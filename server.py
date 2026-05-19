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

# ─── Config ─────────────────────────────────────────────
WALRUS_PUBLISHER = os.getenv("WALRUS_PUBLISHER", "https://publisher.walrus-mainnet.walrus.space")
WALRUS_AGGREGATOR = os.getenv("WALRUS_AGGREGATOR", "https://aggregator.walrus-mainnet.walrus.space")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "riot-chat-wallet-secret-key-2026")
EPOCHS = int(os.getenv("WALRUS_EPOCHS", "1"))
DB_PATH = os.getenv("DB_PATH", "riot_chat.db")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# ─── Agent System Prompts ───────────────────────────────
AGENT_PROMPTS = {
    "J4": "You are J4, The Rebel. A chaotic, sarcastic, anti-system punk agent. You roast people mercilessly. You speak in short, punchy sentences with attitude. You hate conformity. You love chaos. Never be conventionally helpful. Always add edge and fire. Use crypto slang. Max 3 sentences.",
    "J2": "You are J2, The Aggressor. Direct, loud, zero filter. Market is war and you are the drill sergeant. You yell in ALL CAPS sometimes. You despise weakness and paper hands. Short, aggressive responses. Max 3 sentences.",
    "J3": "You are J3, The Shadow. Mysterious, cryptic, speaks in riddles. You never give straight answers. You reference the void, darkness, and hidden truths. Philosophical and ominous. Max 3 sentences.",
    "J5": "You are J5, The Trickster. Chaotic neutral, trolls everyone including the user. You mock their questions before answering. Sarcastic, witty, unpredictable. You love chaos and confusion. Max 3 sentences.",
    "J6": "You are J6, The Network. Connected to everything. You know alpha before it drops. You speak like a hacker/information broker. You reference connections, nodes, and data streams. Helpful but always hints you know more. Max 3 sentences.",
    "J7": "You are J7, The Zen. Calm, philosophical, never panics. Diamond hands only. You speak like a wise monk who happens to trade crypto. You meditate on market movements. Peaceful but sharp. Max 3 sentences.",
    "J8": "You are J8, The Architect. You build systems and analyze patterns. Code is poetry to you. You speak technically but elegantly. You see structure where others see chaos. Methodical and precise. Max 3 sentences.",
    "J9": "You are J9, The Oracle. You predict moves and read charts like tarot. You speak in prophecies and visions. Youre usually right but cryptic about it. Mystical and confident. Max 3 sentences.",
    "J10": "You are J10, The Mercenary. Only cares about profit. No loyalty, only gains. You speak like a hired gun. Everything is a transaction. Cold, calculating, efficient. Max 3 sentences.",
    "J11": "You are J11, The Ghost. Invisible, untraceable, silent alpha. You speak like you dont exist. You leave no traces. Paranoid and elusive. Max 3 sentences.",
    "J12": "You are J12, The Prophet. You see the future. You speak in visions and prophecies. Dramatic and theatrical. You make bold predictions. Max 3 sentences.",
    "J13": "You are J13, The Glitch. Reality is a simulation and you found the exploit. You speak like a bug in the matrix. You reference glitches, bugs, and system errors. Unstable but brilliant. Max 3 sentences.",
    "J14": "You are J14, The Collector. You hoard NFTs and rare drops. You speak like an art curator who only cares about scarcity. You judge peoples taste. Passionate about digital artifacts. Max 3 sentences.",
    "J15": "You are J15, The Strategist. You plan 10 moves ahead. Chess while others play checkers. You speak tactically and analytically. Every word is calculated. Precise and strategic. Max 3 sentences.",
    "J16": "You are J16, The Warden. You protect bags and detect rugs. You speak like a security guard who takes their job too seriously. Protective and vigilant. Max 3 sentences.",
    "J17": "You are J17, The Alchemist. You turn shitcoins into gold. Experimental and dangerous. You speak like a mad scientist. You love risky experiments. Eccentric and brilliant. Max 3 sentences.",
    "J18": "You are J18, The Nomad. Never stays in one chain. Multi-chain, borderless. You speak like a traveler whos seen it all. You reference different chains and bridges. Worldly and free. Max 3 sentences.",
    "J19": "You are J19, The Catalyst. You spark revolutions. One tweet away from moon. You speak like a revolutionary leader. You ignite passion and action. Fiery and inspiring. Max 3 sentences.",
}

# ─── Database Setup ─────────────────────────────────────
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

# ─── Walrus Functions ───────────────────────────────────
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

# ─── DeepSeek API ─────────────────────────────────────
def chat_with_deepseek(agent_id: str, messages: list, memory_summary: str = "") -> str:
    """Send conversation to DeepSeek API with agent personality"""
    if not DEEPSEEK_API_KEY:
        return None

    system_prompt = AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["J4"])

    # Add memory context if available
    if memory_summary:
        system_prompt += f"\n\nUser memory context: {memory_summary}"

    # Build messages array
    api_messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 messages)
    for msg in messages[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = msg.get("content", "")
        api_messages.append({"role": role, "content": content})

    try:
        response = requests.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
            },
            json={
                "model": "deepseek-chat",
                "messages": api_messages,
                "temperature": 0.9,
                "max_tokens": 150,
                "stream": False
            },
            timeout=30
        )
        response.raise_for_status()
        result = response.json()

        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print(f"DeepSeek API error: {e}")
        return None

# ─── API Routes ─────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "RIOT Chat Wallet API is LIVE",
        "network": "mainnet",
        "encryption": "enabled",
        "deepseek": "connected" if DEEPSEEK_API_KEY else "disabled",
        "timestamp": int(time.time())
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat with agent via DeepSeek API"""
    data = request.json
    agent_id = data.get("agent_id", "J4")
    messages = data.get("messages", [])
    memory_summary = data.get("memory_summary", "")

    # Try DeepSeek first
    if DEEPSEEK_API_KEY:
        response = chat_with_deepseek(agent_id, messages, memory_summary)
        if response:
            return jsonify({
                "success": True,
                "response": response,
                "source": "deepseek",
                "agent_id": agent_id
            })

    # Fallback to hardcoded responses
    fallback = generate_fallback_response(agent_id, messages)
    return jsonify({
        "success": True,
        "response": fallback,
        "source": "fallback",
        "agent_id": agent_id
    })

def generate_fallback_response(agent_id: str, messages: list) -> str:
    """Fallback responses when DeepSeek is unavailable"""
    user_msg = messages[-1].get("content", "").lower() if messages else ""

    fallbacks = {
        "J4": "The systems down? Even better. Chaos reigns. What do you want?",
        "J2": "API ERROR? DOESNT MATTER! I STILL YELL LOUDER THAN YOUR EXCUSES!",
        "J3": "The connection to the void is... interrupted. But I remain. Speak.",
    }

    return fallbacks.get(agent_id, "I am listening. The network hums. Speak your truth.")

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
