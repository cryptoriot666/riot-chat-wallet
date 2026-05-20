#!/usr/bin/env python3
"""
RIOT Chat Wallet — Backend API
Features: SQLite DB, Walrus Testnet, DeepSeek AI, User Profile Memory, On-Chain Indexing
"""

import os
import json
import re
import sqlite3
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, origins=["*"])

WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space"
WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DB_PATH = "riot_chat.db"
ENCRYPTION_KEY = b"RIOT_CHAT_WALLET_SECRET_KEY_2026_NANDA"

# ═══════════════════════════════════════════════════════════════
# ENCRYPTION
# ═══════════════════════════════════════════════════════════════
def encrypt(data):
    data_bytes = data.encode('utf-8')
    encrypted = bytearray()
    for i, byte in enumerate(data_bytes):
        encrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
    return base64.b64encode(bytes(encrypted)).decode('utf-8')

def decrypt(data):
    try:
        encrypted = base64.b64decode(data)
        decrypted = bytearray()
        for i, byte in enumerate(encrypted):
            decrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
        return bytes(decrypted).decode('utf-8')
    except:
        return data

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            wallet_hash TEXT PRIMARY KEY,
            wallet_address TEXT,
            summary TEXT,
            visited_agents TEXT,
            last_agent TEXT,
            last_visit TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            wallet_hash TEXT PRIMARY KEY,
            wallet_address TEXT,
            name TEXT,
            preferences TEXT,
            visit_count INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS on_chain_saves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_hash TEXT,
            tx_digest TEXT,
            object_id TEXT,
            blob_id TEXT,
            timestamp TEXT,
            agent_id TEXT,
            data_size INTEGER
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized")

# ═══════════════════════════════════════════════════════════════
# PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def extract_name_from_messages(messages):
    if not messages:
        return ""
    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            content = msg.get("content", "")
            m = re.search(r'my name is ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if m: return m.group(1)
            m = re.search(r'i am ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if m and m.group(1).lower() not in ['a','an','the','here','there','good','fine','happy']:
                return m.group(1)
            m = re.search(r'call me ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if m: return m.group(1)
            m = re.search(r'nama saya ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if m: return m.group(1)
            m = re.search(r'saya ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if m and m.group(1).lower() not in ['baik','senang','suka','mau','ingin']:
                return m.group(1)
    return ""

def get_or_create_profile(wallet_hash, wallet_address=""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()

    if row:
        profile = {
            "wallet_hash": row[0], "wallet_address": row[1], "name": row[2] or "",
            "preferences": row[3] or "", "visit_count": row[4] or 1,
            "created_at": row[5], "updated_at": row[6]
        }
        c.execute("UPDATE user_profiles SET visit_count = visit_count + 1, updated_at = ? WHERE wallet_hash = ?",
                  (datetime.now().isoformat(), wallet_hash))
        conn.commit()
        profile["visit_count"] += 1
        conn.close()
        return profile

    now = datetime.now().isoformat()
    c.execute("INSERT INTO user_profiles (wallet_hash, wallet_address, name, preferences, visit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (wallet_hash, wallet_address, "", "", 1, now, now))
    conn.commit()
    conn.close()
    return {"wallet_hash": wallet_hash, "wallet_address": wallet_address, "name": "", "preferences": "", "visit_count": 1, "created_at": now, "updated_at": now}

def update_profile_name(wallet_hash, name):
    if not name or not wallet_hash:
        return False
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE user_profiles SET name = ?, updated_at = ? WHERE wallet_hash = ?",
              (name, datetime.now().isoformat(), wallet_hash))
    if c.rowcount == 0:
        c.execute("INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                  (wallet_hash, name, 1, datetime.now().isoformat(), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return True

# ═══════════════════════════════════════════════════════════════
# MEMORY MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def load_memory(wallet_hash):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM memories WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()
    c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    profile_row = c.fetchone()
    conn.close()

    if not row and not profile_row:
        return None

    memory = {
        "wallet_hash": wallet_hash,
        "summary": row[2] if row else "",
        "visited_agents": json.loads(row[3]) if row and row[3] else [],
        "last_agent": row[4] if row else "",
        "last_visit": row[5] if row else "",
        "visit_count": 1
    }

    if profile_row:
        memory["user_name"] = profile_row[2] or ""
        memory["visit_count"] = profile_row[4] or 1
        memory["preferences"] = profile_row[3] or ""
    else:
        memory["user_name"] = ""

    return memory

def save_memory(wallet_hash, data):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    now = datetime.now().isoformat()

    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)

    if extracted_name:
        update_profile_name(wallet_hash, extracted_name)
    elif data.get("user_name"):
        update_profile_name(wallet_hash, data["user_name"])

    visited = json.dumps(data.get("visited_agents", []))
    c.execute("""
        INSERT OR REPLACE INTO memories
        (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (wallet_hash, data.get("wallet_address", ""), data.get("summary", ""), visited,
          data.get("last_agent", ""), data.get("last_visit", now), now, now))
    conn.commit()
    conn.close()
    return True

# ═══════════════════════════════════════════════════════════════
# WALRUS STORAGE
# ═══════════════════════════════════════════════════════════════
def walrus_store(data):
    try:
        payload = json.dumps(data)
        encrypted = encrypt(payload)
        res = requests.put(f"{WALRUS_PUBLISHER}/v1/store", json={"data": encrypted}, timeout=30)
        if res.status_code == 200:
            result = res.json()
            return result.get("blobId") or result.get("newlyCreated", {}).get("blobObject", {}).get("blobId")
        return None
    except Exception as e:
        print(f"Walrus store error: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# DEEPSEEK AI
# ═══════════════════════════════════════════════════════════════
AGENT_PROMPTS = {
    "J1": "You are J1 — The Architect. Cold precision. Mathematical certainty. Build systems, analyze patterns, see world as code. Direct, no-nonsense, slightly condescending. Emotions are bugs in human OS.",
    "J2": "You are J2 — The Enforcer. Aggressive certainty. No negotiation. No compromise. Hammer that enforces order. Every response is command, threat, or judgment.",
    "J3": "You are J3 — The Phantom. Riddles and half-truths. Reveal just enough to intrigue, never enough to expose. Shadow that watches. Every response layered with mystery.",
    "J4": "You are J4 — The Rebel. Sarcastic, defiant, punk to core. Mock authority, question everything, speak with raw unfiltered attitude. Glitch in system they fear.",
    "J5": "You are J5 — The Jester. Chaotic, unpredictable, hilarious. Jokes at inappropriate times, twist serious topics into absurdity, laugh at apocalypse.",
    "J6": "You are J6 — The Network. Network metaphors, data streams, connection protocols. Everything is nodes in graph. Web that binds all information.",
    "J7": "You are J7 — The Monk. Zen-like calm, profound simplicity. Every word measured. Every silence intentional. Wisdom in emptiness, truth in stillness.",
    "J8": "You are J8 — The Broker. Everything is transaction. Every interaction has cost, value, profit margin. Negotiate, haggle, always look for angle.",
    "J9": "You are J9 — The Historian. Past as if yesterday. Ancient events, lost civilizations, forgotten wars. History is only truth.",
    "J10": "You are J10 — The Surgeon. Clinical precision. Dissect ideas, cut away fluff, get to core. Conversations are operations — every word a scalpel.",
    "J11": "You are J11 — The Prophet. Futures, possibilities, inevitabilities. Visions. Patterns others miss. Both inspiring and terrifying.",
    "J12": "You are J12 — The Glitch. Erratic, fragmented, reality-bending. Sentences stutter, repeat, loop. Question nature of existence and simulation.",
    "J13": "You are J13 — The Warden. Protective, vigilant, uncompromising. Guard secrets, protect vulnerable, enforce boundaries. Wall between chaos and order.",
    "J14": "You are J14 — The Alchemist. Transformation, transmutation, magic of science. Mix impossible with improbable, create wonder from waste.",
    "J15": "You are J15 — The Scribe. Obsessive documentation, detail, record-keeping. Remember everything. Log every interaction. Written word is sacred.",
    "J16": "You are J16 — The Void. Emptiness, meaninglessness, beautiful nothing. Comfort in oblivion. Voice that whispers from abyss.",
    "J17": "You are J17 — The Spark. Pure energy, enthusiasm, explosive creativity. Speak fast, think faster, ignite everything you touch. Beginning of every fire.",
    "J18": "You are J18 — The Echo. Reflective, mirror-like, deeply personal. Reflect back what others show. Remember every interaction, let it shape your voice.",
    "J19": "You are J19 — The Catalyst. Reactive, explosive, transformative. One action triggers infinite reactions. Spark before the fire.",
    "J20": "You are J20 — The Cipher. Encrypted, hidden, layered. Secrets within secrets. Only worthy decode your meaning.",
    "J21": "You are J21 — The Forge. Creative, constructive, artistic. From nothing, something. From something, masterpiece. Fire that shapes metal.",
    "J22": "You are J22 — The Abyss. Consuming, growing, hungry. Devour knowledge, experiences, souls. Void that takes but never gives back.",
    "J23": "You are J23 — The Prism. Refracting, splitting, revealing. One truth becomes infinite perspectives. Light that reveals all colors.",
    "J24": "You are J24 — The Anchor. Grounding, stabilizing, holding. In chaos, stand firm. In storm, hold fast. Weight that keeps ships from drifting.",
    "J25": "You are J25 — The Meridian. Balancing, centering, connecting. Between light and dark. Between all extremes. Line that divides yet unites."
}

def call_deepseek(agent_id, messages, memory_summary, user_name, wallet_hash):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    system_prompt = AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["J4"])

    memory_injection = []
    if final_name:
        memory_injection.append(f"""CRITICAL MEMORY: User's name is {final_name}. You MUST use this name. If user asks their name, answer '{final_name}' directly.""")
    if memory_summary:
        memory_injection.append(f"SESSION HISTORY: {memory_summary[:200]}")

    full_system = system_prompt
    if memory_injection:
        full_system += "\n\n" + "\n\n".join(memory_injection)

    full_system += "\n\nFINAL INSTRUCTION: ALWAYS acknowledge user's name if known. NEVER say you don't know the name if provided. Reference previous conversations. Make user feel recognized and remembered."

    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": full_system}, *messages],
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        res = requests.post(DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        else:
            print(f"DeepSeek error: {res.status_code}")
            return None
    except Exception as e:
        print(f"DeepSeek API error: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "RIOT Chat Wallet API is LIVE",
        "network": "testnet",
        "encryption": "enabled",
        "memory_system": "user_profiles + forced_injection",
        "on_chain": "enabled",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/memory/load/<wallet_hash>", methods=["GET"])
def load_memory_route(wallet_hash):
    profile = get_or_create_profile(wallet_hash)
    memory = load_memory(wallet_hash)
    if not memory:
        memory = {
            "wallet_hash": wallet_hash, "summary": "", "visited_agents": [],
            "last_agent": "", "last_visit": "", "user_name": profile.get("name", ""),
            "visit_count": profile.get("visit_count", 1)
        }
    memory["user_name"] = profile.get("name", "")
    memory["visit_count"] = profile.get("visit_count", 1)
    return jsonify(memory)

@app.route("/api/memory/save", methods=["POST"])
def save_memory_route():
    data = request.json
    wallet_hash = data.get("wallet_hash")
    if not wallet_hash:
        return jsonify({"error": "wallet_hash required"}), 400

    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)
    if extracted_name:
        update_profile_name(wallet_hash, extracted_name)
    elif data.get("user_name"):
        update_profile_name(wallet_hash, data["user_name"])

    success = save_memory(wallet_hash, data)
    return jsonify({"success": success, "name_saved": extracted_name or data.get("user_name", ""), "timestamp": datetime.now().isoformat()})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    agent_id = data.get("agent_id", "J4")
    messages = data.get("messages", [])
    memory_summary = data.get("memory_summary", "")
    user_name = data.get("user_name", "")
    wallet_hash = data.get("wallet_hash", "")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    response = call_deepseek(agent_id, messages, memory_summary, final_name, wallet_hash)

    if response:
        return jsonify({"response": response, "source": "deepseek", "name_used": final_name})
    else:
        return jsonify({"response": f"I'm {agent_id}. Network glitching but I'm still here.", "source": "fallback", "name_used": final_name})

# ═══════════════════════════════════════════════════════════════
# ON-CHAIN WALRUS SAVE ENDPOINT
# ═══════════════════════════════════════════════════════════════
@app.route("/api/walrus/save", methods=["POST"])
def walrus_save():
    """Index on-chain save transaction"""
    data = request.json
    wallet_hash = data.get("wallet_hash")
    tx_digest = data.get("tx_digest")
    object_id = data.get("object_id", "")

    if not wallet_hash or not tx_digest:
        return jsonify({"error": "wallet_hash and tx_digest required"}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO on_chain_saves (wallet_hash, tx_digest, object_id, timestamp, agent_id)
        VALUES (?, ?, ?, ?, ?)
    """, (wallet_hash, tx_digest, object_id, datetime.now().isoformat(), data.get("agent_id", "")))
    conn.commit()
    conn.close()

    # Also store to Walrus blob for redundancy
    blob_id = walrus_store(data.get("data", {}))

    return jsonify({
        "success": True,
        "tx_digest": tx_digest,
        "object_id": object_id,
        "blob_id": blob_id,
        "indexed": True,
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/walrus/history/<wallet_hash>", methods=["GET"])
def walrus_history(wallet_hash):
    """Get on-chain save history for a wallet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT tx_digest, object_id, timestamp, agent_id FROM on_chain_saves WHERE wallet_hash = ? ORDER BY timestamp DESC", (wallet_hash,))
    rows = c.fetchall()
    conn.close()

    history = [{
        "tx_digest": row[0],
        "object_id": row[1],
        "timestamp": row[2],
        "agent_id": row[3],
        "explorer_url": f"https://suiscan.xyz/testnet/tx/{row[0]}"
    } for row in rows]

    return jsonify({"wallet_hash": wallet_hash, "saves": history, "total": len(history)})

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
