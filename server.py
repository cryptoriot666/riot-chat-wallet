from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import sqlite3
import time
import os
from datetime import datetime
from crypto_utils import encrypt_data, decrypt_data, hash_wallet

app = Flask(__name__)
CORS(app)

WALRUS_PUBLISHER = os.getenv("WALRUS_PUBLISHER", "https://publisher.walrus-mainnet.walrus.space")
WALRUS_AGGREGATOR = os.getenv("WALRUS_AGGREGATOR", "https://aggregator.walrus-mainnet.walrus.space")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "riot-chat-wallet-secret-key-2026")
EPOCHS = int(os.getenv("WALRUS_EPOCHS", "1"))
DB_PATH = os.getenv("DB_PATH", "riot_chat.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            wallet_hash TEXT PRIMARY KEY,
            wallet_address TEXT,
            first_visit TEXT,
            total_interactions INTEGER DEFAULT 0,
            last_active TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_hash TEXT,
            blob_id TEXT UNIQUE,
            agent_id TEXT,
            timestamp INTEGER,
            summary TEXT,
            FOREIGN KEY (wallet_hash) REFERENCES users(wallet_hash)
        )
    """)
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def store_on_walrus(data: dict) -> str:
    json_str = json.dumps(data)
    encrypted = encrypt_data(json_str, ENCRYPTION_KEY)
    encrypted_bytes = encrypted.encode("utf-8")

    response = requests.put(
        f"{WALRUS_PUBLISHER}/v1/store",
        params={"epochs": EPOCHS},
        data=encrypted_bytes,
        headers={"Content-Type": "application/octet-stream"},
        timeout=30
    )
    response.raise_for_status()
    result = response.json()

    if "newlyCreated" in result:
        return result["newlyCreated"]["blobObject"]["blobId"]
    elif "alreadyCertified" in result:
        return result["alreadyCertified"]["blobId"]
    else:
        raise Exception(f"Unexpected Walrus response: {result}")

def read_from_walrus(blob_id: str) -> dict:
    response = requests.get(
        f"{WALRUS_AGGREGATOR}/v1/{blob_id}",
        timeout=30
    )
    response.raise_for_status()
    encrypted_data = response.text
    decrypted = decrypt_data(encrypted_data, ENCRYPTION_KEY)
    return json.loads(decrypted)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "RIOT Chat Wallet API is LIVE",
        "network": "mainnet",
        "encryption": "enabled",
        "timestamp": int(time.time())
    })

@app.route("/api/memory/save", methods=["POST"])
def save_memory():
    data = request.json
    wallet = data.get("wallet_address", "").lower()
    agent_id = data.get("agent_id", "J4")

    if not wallet or not wallet.startswith("0x"):
        return jsonify({"error": "Valid Sui wallet address required"}), 400

    wallet_hash = hash_wallet(wallet)

    memory_entry = {
        "wallet": wallet,
        "agent_id": agent_id,
        "messages": data.get("messages", []),
        "summary": data.get("summary", ""),
        "timestamp": data.get("timestamp", int(time.time())),
        "version": "1.0"
    }

    try:
        blob_id = store_on_walrus(memory_entry)

        conn = get_db()
        c = conn.cursor()
        now = datetime.now().isoformat()

        c.execute("""
            INSERT INTO users (wallet_hash, wallet_address, first_visit, total_interactions, last_active)
            VALUES (?, ?, ?, 1, ?)
            ON CONFLICT(wallet_hash) DO UPDATE SET
                total_interactions = total_interactions + 1,
                last_active = ?
        """, (wallet_hash, wallet, now, now, now))

        c.execute("""
            INSERT INTO memories (wallet_hash, blob_id, agent_id, timestamp, summary)
            VALUES (?, ?, ?, ?, ?)
        """, (wallet_hash, blob_id, agent_id, memory_entry["timestamp"], memory_entry["summary"]))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "blob_id": blob_id,
            "message": "Memory encrypted and stored on Walrus mainnet"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/memory/load/<wallet>", methods=["GET"])
def load_memory(wallet):
    wallet = wallet.lower()
    wallet_hash = hash_wallet(wallet)

    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE wallet_hash = ?", (wallet_hash,))
    user = c.fetchone()

    if not user:
        conn.close()
        return jsonify({
            "memories": [],
            "summary": "",
            "first_visit": True,
            "total_interactions": 0,
            "agents_visited": 0
        })

    c.execute("""
        SELECT * FROM memories 
        WHERE wallet_hash = ? 
        ORDER BY timestamp DESC
    """, (wallet_hash,))
    rows = c.fetchall()
    conn.close()

    memories = []
    combined_summary = []
    agents_visited = set()

    for row in rows:
        try:
            data = read_from_walrus(row["blob_id"])
            memories.append({
                "blob_id": row["blob_id"],
                "agent_id": row["agent_id"],
                "timestamp": row["timestamp"],
                "summary": row["summary"],
                "data": data
            })
            if row["summary"]:
                combined_summary.append(row["summary"])
            agents_visited.add(row["agent_id"])
        except Exception as e:
            print(f"Failed to read blob {row['blob_id']}: {e}")
            continue

    return jsonify({
        "memories": memories,
        "summary": " | ".join(combined_summary),
        "first_visit": False,
        "total_interactions": user["total_interactions"],
        "agents_visited": len(agents_visited),
        "agents_list": list(agents_visited),
        "last_active": user["last_active"]
    })

@app.route("/api/memory/summary/<wallet>", methods=["GET"])
def get_summary(wallet):
    wallet = wallet.lower()
    wallet_hash = hash_wallet(wallet)

    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT total_interactions, last_active FROM users WHERE wallet_hash = ?", (wallet_hash,))
    user = c.fetchone()

    if not user:
        conn.close()
        return jsonify({
            "has_memory": False,
            "summary": "",
            "total_interactions": 0,
            "agents_visited": 0
        })

    c.execute("SELECT DISTINCT agent_id FROM memories WHERE wallet_hash = ?", (wallet_hash,))
    agents = [row["agent_id"] for row in c.fetchall()]

    c.execute("""
        SELECT summary FROM memories 
        WHERE wallet_hash = ? 
        ORDER BY timestamp DESC LIMIT 5
    """, (wallet_hash,))
    recent_summaries = [row["summary"] for row in c.fetchall() if row["summary"]]

    conn.close()

    return jsonify({
        "has_memory": True,
        "summary": " | ".join(recent_summaries),
        "total_interactions": user["total_interactions"],
        "agents_visited": len(agents),
        "agents_list": agents,
        "last_active": user["last_active"]
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) as users FROM users")
    total_users = c.fetchone()["users"]

    c.execute("SELECT COUNT(*) as memories FROM memories")
    total_memories = c.fetchone()["memories"]

    c.execute("SELECT COUNT(DISTINCT agent_id) as agents FROM memories")
    total_agents = c.fetchone()["agents"]

    conn.close()

    return jsonify({
        "total_users": total_users,
        "total_memories": total_memories,
        "total_agents": total_agents,
        "network": "Walrus Mainnet",
        "encryption": "AES-256"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
