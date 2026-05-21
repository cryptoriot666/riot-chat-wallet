#!/usr/bin/env python3
"""
RIOT Chat Wallet — Backend API MAINNET
Features: PostgreSQL, Walrus MAINNET, DeepSeek AI, 
          User Profile Memory, On-Chain Indexing
"""

import os
import json
import re
import base64
from datetime import datetime
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pg8000

app = Flask(__name__)
CORS(app, origins=["*"])

# ═══════════════════════════════════════════════════════════════
# CONFIG — MAINNET
# ═══════════════════════════════════════════════════════════════
WALRUS_PUBLISHER = "https://publisher.walrus-mainnet.walrus.space"
WALRUS_AGGREGATOR = "https://aggregator.walrus-mainnet.walrus.space"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
ENCRYPTION_KEY = b"RIOT_CHAT_WALLET_SECRET_KEY_2026_NANDA"

DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_SQLITE = not DATABASE_URL

print(f"[INIT] DATABASE_URL present: {bool(DATABASE_URL)}")
print(f"[INIT] Using: {'SQLite' if USE_SQLITE else 'PostgreSQL'}")
print(f"[INIT] Walrus: MAINNET")

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
def get_db_conn():
    if USE_SQLITE:
        import sqlite3
        return sqlite3.connect("riot_chat.db")
    else:
        parsed = urlparse(DATABASE_URL)
        conn = pg8000.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            user=parsed.username or "",
            password=parsed.password or "",
            database=parsed.path.lstrip("/") or "riot_chat"
        )
        conn.autocommit = False
        return conn

def init_db():
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                wallet_hash TEXT PRIMARY KEY,
                wallet_address TEXT,
                name TEXT DEFAULT '',
                preferences TEXT DEFAULT '',
                visit_count INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)
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
    else:
        c.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                wallet_hash VARCHAR(32) PRIMARY KEY,
                wallet_address VARCHAR(66),
                name VARCHAR(100) DEFAULT '',
                preferences TEXT DEFAULT '',
                visit_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                wallet_hash VARCHAR(32) PRIMARY KEY,
                wallet_address VARCHAR(66),
                summary TEXT,
                visited_agents TEXT,
                last_agent VARCHAR(10),
                last_visit TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS on_chain_saves (
                id SERIAL PRIMARY KEY,
                wallet_hash VARCHAR(32),
                tx_digest VARCHAR(100),
                object_id VARCHAR(66),
                blob_id VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                agent_id VARCHAR(10),
                data_size INTEGER
            )
        """)

    conn.commit()
    conn.close()
    print("[INIT] Database initialized")

# ═══════════════════════════════════════════════════════════════
# ENCRYPTION
# ═══════════════════════════════════════════════════════════════
def encrypt(data):
    data_bytes = data.encode("utf-8")
    encrypted = bytearray()
    for i, byte in enumerate(data_bytes):
        encrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
    return base64.b64encode(bytes(encrypted)).decode("utf-8")

def decrypt(data):
    try:
        encrypted = base64.b64decode(data)
        decrypted = bytearray()
        for i, byte in enumerate(encrypted):
            decrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
        return bytes(decrypted).decode("utf-8")
    except:
        return data

# ═══════════════════════════════════════════════════════════════
# NAME EXTRACTION
# ═══════════════════════════════════════════════════════════════
def extract_name_from_messages(messages):
    if not messages:
        return ""

    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            content = msg.get("content", "").strip()
            if not content:
                continue

            print(f"[EXTRACT] Checking: '{content[:50]}...'")

            patterns = [
                (r"my\s+name\s+is\s+([a-zA-Z0-9_]+)", "my name is"),
                (r"my\s+name\s+([a-zA-Z0-9_]+)", "my name"),
                (r"i\s+am\s+([a-zA-Z0-9_]+)", "i am"),
                (r"call\s+me\s+([a-zA-Z0-9_]+)", "call me"),
                (r"nama\s+saya\s+([a-zA-Z0-9_]+)", "nama saya"),
                (r"saya\s+([a-zA-Z0-9_]+)", "saya"),
                (r"aku\s+([a-zA-Z0-9_]+)", "aku"),
                (r"name\s+is\s+([a-zA-Z0-9_]+)", "name is"),
            ]

            ignore = ['a','an','the','here','there','good','fine','happy','back',
                      'baik','senang','suka','mau','ingin','nanda','kembali','disini']

            for pattern, label in patterns:
                m = re.search(pattern, content, re.IGNORECASE)
                if m:
                    name = m.group(1)
                    if name.lower() not in ignore:
                        print(f"[EXTRACT] Found via '{label}': {name}")
                        return name

            # Single word fallback
            words = content.split()
            if len(words) == 1 and len(words[0]) >= 2:
                w = words[0]
                if w.lower() not in ['hello','hi','hey','yo','ok','yes','no','thanks','please']:
                    print(f"[EXTRACT] Found single word: {w}")
                    return w

    print("[EXTRACT] No name found")
    return ""

# ═══════════════════════════════════════════════════════════════
# PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def get_or_create_profile(wallet_hash, wallet_address=""):
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
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
    else:
        c.execute("SELECT * FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        row = c.fetchone()
        if row:
            profile = {
                "wallet_hash": row[0], "wallet_address": row[1], "name": row[2] or "",
                "preferences": row[3] or "", "visit_count": row[4] or 1,
                "created_at": row[5].isoformat() if row[5] else "", 
                "updated_at": row[6].isoformat() if row[6] else ""
            }
            c.execute("UPDATE user_profiles SET visit_count = visit_count + 1, updated_at = CURRENT_TIMESTAMP WHERE wallet_hash = %s",
                      (wallet_hash,))
            conn.commit()
            profile["visit_count"] += 1
            conn.close()
            return profile

        c.execute("INSERT INTO user_profiles (wallet_hash, wallet_address, name, preferences, visit_count) VALUES (%s, %s, %s, %s, %s)",
                  (wallet_hash, wallet_address, "", "", 1))
        conn.commit()
        conn.close()
        return {"wallet_hash": wallet_hash, "wallet_address": wallet_address, "name": "", "preferences": "", "visit_count": 1, "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}

def update_profile_name(wallet_hash, name):
    if not name or not wallet_hash or not name.strip():
        return False

    name = name.strip()
    print(f"[UPDATE_NAME] Saving '{name}' for {wallet_hash}")

    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        row = c.fetchone()
        if row and row[0] and row[0].strip().lower() == name.lower():
            conn.close()
            return True
        c.execute("UPDATE user_profiles SET name = ?, updated_at = ? WHERE wallet_hash = ?",
                  (name, datetime.now().isoformat(), wallet_hash))
        if c.rowcount == 0:
            c.execute("INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                      (wallet_hash, name, 1, datetime.now().isoformat(), datetime.now().isoformat()))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        row = c.fetchone()
        if row and row[0] and row[0].strip().lower() == name.lower():
            conn.close()
            return True
        c.execute("""
            INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_hash) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
        """, (wallet_hash, name, 1))

    conn.commit()
    conn.close()
    print(f"[UPDATE_NAME] Success: '{name}' saved")
    return True

# ═══════════════════════════════════════════════════════════════
# MEMORY MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def load_memory(wallet_hash):
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("SELECT * FROM memories WHERE wallet_hash = ?", (wallet_hash,))
        row = c.fetchone()
        c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        profile_row = c.fetchone()
    else:
        c.execute("SELECT * FROM memories WHERE wallet_hash = %s", (wallet_hash,))
        row = c.fetchone()
        c.execute("SELECT * FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        profile_row = c.fetchone()

    conn.close()

    memory = {
        "wallet_hash": wallet_hash,
        "summary": row[2] if row else "",
        "visited_agents": json.loads(row[3]) if row and row[3] else [],
        "last_agent": row[4] if row else "",
        "last_visit": row[5] if row else "",
        "visit_count": 1,
        "user_name": ""
    }

    if profile_row:
        memory["user_name"] = profile_row[2] or ""
        memory["visit_count"] = profile_row[4] or 1
        memory["preferences"] = profile_row[3] or ""

    print(f"[LOAD_MEMORY] {wallet_hash}: name='{memory['user_name']}', visits={memory['visit_count']}")
    return memory

def save_memory(wallet_hash, data):
    conn = get_db_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()

    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)

    print(f"[SAVE_MEMORY] {wallet_hash}: extracted='{extracted_name}', data_name='{data.get('user_name', '')}'")

    if extracted_name and extracted_name.strip():
        update_profile_name(wallet_hash, extracted_name)
    elif data.get("user_name") and data["user_name"].strip():
        update_profile_name(wallet_hash, data["user_name"])

    visited = json.dumps(data.get("visited_agents", []))

    if USE_SQLITE:
        c.execute("""
            INSERT OR REPLACE INTO memories
            (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (wallet_hash, data.get("wallet_address", ""), data.get("summary", ""), visited,
              data.get("last_agent", ""), data.get("last_visit", now), now, now))
    else:
        c.execute("""
            INSERT INTO memories (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_hash) DO UPDATE SET
                wallet_address = EXCLUDED.wallet_address,
                summary = EXCLUDED.summary,
                visited_agents = EXCLUDED.visited_agents,
                last_agent = EXCLUDED.last_agent,
                last_visit = EXCLUDED.last_visit,
                updated_at = CURRENT_TIMESTAMP
        """, (wallet_hash, data.get("wallet_address", ""), data.get("summary", ""), visited,
              data.get("last_agent", ""), data.get("last_visit", now)))

    conn.commit()
    conn.close()
    print(f"[SAVE_MEMORY] Success for {wallet_hash}")
    return True

# ═══════════════════════════════════════════════════════════════
# WALRUS STORAGE — MAINNET with detailed error logging
# ═══════════════════════════════════════════════════════════════
def walrus_store(data):
    try:
        payload = json.dumps(data)
        encrypted = encrypt(payload)

        print(f"[WALRUS] Storing {len(payload)} bytes to MAINNET...")
        print(f"[WALRUS] Publisher: {WALRUS_PUBLISHER}")

        res = requests.put(
            f"{WALRUS_PUBLISHER}/v1/store",
            json={"data": encrypted},
            timeout=60
        )

        print(f"[WALRUS] Response status: {res.status_code}")
        print(f"[WALRUS] Response body: {res.text[:200]}")

        if res.status_code == 200:
            result = res.json()
            blob_id = result.get("blobId") or result.get("newlyCreated", {}).get("blobObject", {}).get("blobId")
            print(f"[WALRUS] Success! Blob ID: {blob_id}")
            return blob_id

        print(f"[WALRUS] Store failed: HTTP {res.status_code}")
        return None

    except requests.exceptions.Timeout:
        print(f"[WALRUS] Timeout after 60s")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[WALRUS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[WALRUS] Unexpected error: {e}")
        return None

def walrus_read(blob_id):
    try:
        print(f"[WALRUS] Reading blob {blob_id} from MAINNET...")
        res = requests.get(f"{WALRUS_AGGREGATOR}/v1/{blob_id}", timeout=60)

        print(f"[WALRUS] Read status: {res.status_code}")

        if res.status_code == 200:
            result = res.json()
            encrypted_data = result.get("data")
            if encrypted_data:
                decrypted = decrypt(encrypted_data)
                return json.loads(decrypted)

        print(f"[WALRUS] Read failed: HTTP {res.status_code}")
        return None

    except Exception as e:
        print(f"[WALRUS] Read error: {e}")
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
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    print(f"[DEEPSEEK] {wallet_hash}: db='{db_name}', input='{user_name}', final='{final_name}'")

    memory_blocks = []

    if final_name:
        memory_blocks.append("PERMANENT MEMORY — USER IDENTITY: The user's name is: " + final_name + ". You have spoken with this user before. ALWAYS address them by name: " + final_name + ". If they ask who am I, what is my name, siapa aku, nama saya — answer EXACTLY: You are " + final_name + ". NEVER say you don't know their name.")

    if memory_summary and memory_summary.strip():
        memory_blocks.append("CONVERSATION HISTORY: " + memory_summary[:300])

    if not final_name:
        memory_blocks.append("PERMANENT MEMORY — USER IDENTITY: The user has not yet told you their name. If they mention it, REMEMBER IT FOREVER.")

    personality = AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["J4"])
    enforcement = "ABSOLUTE RULES: 1. MEMORY IS TRUTH. If memory says user's name is known, you MUST use it. 2. NEVER claim you don't remember something that is in memory. 3. NEVER ask for information that is already in memory. 4. If user asks their name and you know it — answer immediately with the name. 5. Personality is secondary to memory accuracy."

    separator = chr(10) + chr(10)
    full_system = separator.join(memory_blocks) + separator + personality + separator + enforcement

    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": full_system}, *messages],
        "temperature": 0.3,
        "max_tokens": 800
    }

    try:
        res = requests.post(DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        print(f"[DEEPSEEK] Error: {res.status_code}")
        return None
    except Exception as e:
        print(f"[DEEPSEEK] API error: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "RIOT Chat Wallet API is LIVE — MAINNET",
        "network": "mainnet",
        "database": "PostgreSQL" if not USE_SQLITE else "SQLite",
        "encryption": "enabled",
        "memory_system": "user_profiles + forced_injection_v3",
        "walrus": "mainnet",
        "on_chain": "enabled",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/memory/load/<wallet_hash>", methods=["GET"])
def load_memory_route(wallet_hash):
    print(f"[API] Load memory: {wallet_hash}")
    profile = get_or_create_profile(wallet_hash)
    memory = load_memory(wallet_hash)
    memory["user_name"] = profile.get("name", "")
    memory["visit_count"] = profile.get("visit_count", 1)
    print(f"[API] Return: name='{memory['user_name']}', visits={memory['visit_count']}")
    return jsonify(memory)

@app.route("/api/memory/save", methods=["POST"])
def save_memory_route():
    data = request.json
    wallet_hash = data.get("wallet_hash")
    if not wallet_hash:
        return jsonify({"error": "wallet_hash required"}), 400

    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)

    name_saved = ""
    if extracted_name and extracted_name.strip():
        update_profile_name(wallet_hash, extracted_name)
        name_saved = extracted_name
    elif data.get("user_name") and data["user_name"].strip():
        update_profile_name(wallet_hash, data["user_name"])
        name_saved = data["user_name"]

    success = save_memory(wallet_hash, data)
    return jsonify({
        "success": success,
        "name_saved": name_saved,
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    agent_id = data.get("agent_id", "J4")
    messages = data.get("messages", [])
    memory_summary = data.get("memory_summary", "")
    user_name = data.get("user_name", "")
    wallet_hash = data.get("wallet_hash", "")

    conn = get_db_conn()
    c = conn.cursor()
    if USE_SQLITE:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    response = call_deepseek(agent_id, messages, memory_summary, final_name, wallet_hash)

    if response:
        return jsonify({"response": response, "source": "deepseek", "name_used": final_name})
    return jsonify({"response": f"I'm {agent_id}. Network glitching but I'm still here.", "source": "fallback", "name_used": final_name})

# ═══════════════════════════════════════════════════════════════
# WALRUS CHAT HISTORY — MAINNET
# ═══════════════════════════════════════════════════════════════

@app.route("/api/walrus/store-chat", methods=["POST"])
def walrus_store_chat():
    data = request.json
    wallet_hash = data.get("wallet_hash")
    chat_history = data.get("chat_history", [])
    agent_id = data.get("agent_id", "")

    if not wallet_hash or not chat_history:
        return jsonify({"error": "wallet_hash and chat_history required"}), 400

    print(f"[API] Walrus store-chat: wallet={wallet_hash}, messages={len(chat_history)}")

    payload = {
        "wallet_hash": wallet_hash,
        "chat_history": chat_history,
        "agent_id": agent_id,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0"
    }

    blob_id = walrus_store(payload)

    if blob_id:
        conn = get_db_conn()
        c = conn.cursor()
        if USE_SQLITE:
            c.execute("INSERT INTO on_chain_saves (wallet_hash, blob_id, timestamp, agent_id, data_size) VALUES (?, ?, ?, ?, ?)",
                      (wallet_hash, blob_id, datetime.now().isoformat(), agent_id, len(json.dumps(payload))))
        else:
            c.execute("INSERT INTO on_chain_saves (wallet_hash, blob_id, timestamp, agent_id, data_size) VALUES (%s, %s, CURRENT_TIMESTAMP, %s, %s)",
                      (wallet_hash, blob_id, agent_id, len(json.dumps(payload))))
        conn.commit()
        conn.close()

        print(f"[API] Walrus store success: blob_id={blob_id}")
        return jsonify({
            "success": True,
            "blob_id": blob_id,
            "message": "Chat history stored on Walrus MAINNET",
            "timestamp": datetime.now().isoformat()
        })

    print(f"[API] Walrus store FAILED")
    return jsonify({"success": False, "error": "Failed to store on Walrus"}), 500

@app.route("/api/walrus/load-chat/<wallet_hash>", methods=["GET"])
def walrus_load_chat(wallet_hash):
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = ? AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 1", (wallet_hash,))
    else:
        c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = %s AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 1", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    if not row or not row[0]:
        return jsonify({"error": "No Walrus backup found"}), 404

    blob_id = row[0]
    chat_data = walrus_read(blob_id)

    if chat_data:
        return jsonify({"success": True, "chat_history": chat_data.get("chat_history", []), "blob_id": blob_id})

    return jsonify({"success": False, "error": "Failed to read from Walrus"}), 500

@app.route("/api/walrus/save", methods=["POST"])
def walrus_save():
    data = request.json
    wallet_hash = data.get("wallet_hash")
    tx_digest = data.get("tx_digest")
    blob_id = data.get("blob_id", "")

    if not wallet_hash or not tx_digest:
        return jsonify({"error": "wallet_hash and tx_digest required"}), 400

    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (?, ?, ?, ?, ?)",
                  (wallet_hash, tx_digest, blob_id, datetime.now().isoformat(), data.get("agent_id", "")))
    else:
        c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s)",
                  (wallet_hash, tx_digest, blob_id, data.get("agent_id", "")))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "tx_digest": tx_digest, "blob_id": blob_id, "indexed": True})

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)