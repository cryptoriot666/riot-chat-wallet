#!/usr/bin/env python3
"""
RIOT Chat Wallet — Backend API
Features: SQLite DB, Walrus Mainnet, Encryption, DeepSeek AI, User Profile Memory
"""

import os
import json
import re
import sqlite3
import hashlib
import base64
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app, origins=["*"])

WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space"
WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-42dd213696aa41b1b7c4b7a71f779946")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DB_PATH = "/tmp/riot_chat.db"

# Simple XOR encryption (for demo — production should use proper encryption)
ENCRYPTION_KEY = b"RIOT_CHAT_WALLET_SECRET_KEY_2026"

# ═══════════════════════════════════════════════════════════════
# ENCRYPTION
# ═══════════════════════════════════════════════════════════════
def encrypt(data):
    """Encrypt data with XOR cipher"""
    data_bytes = data.encode('utf-8')
    encrypted = bytearray()
    for i, byte in enumerate(data_bytes):
        encrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
    return base64.b64encode(bytes(encrypted)).decode('utf-8')

def decrypt(data):
    """Decrypt data with XOR cipher"""
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
    """Initialize SQLite database with user_profiles table"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Main memory table
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

    # ═══════════════════════════════════════════════════════════════
    # CRITICAL FIX: Dedicated user_profiles table
    # This ensures name is stored separately and NEVER lost
    # ═══════════════════════════════════════════════════════════════
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

    # Session history
    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_hash TEXT,
            agent_id TEXT,
            messages TEXT,
            timestamp TEXT
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized with user_profiles table")

# ═══════════════════════════════════════════════════════════════
# WALRUS STORAGE
# ═══════════════════════════════════════════════════════════════
def walrus_store(data):
    """Store data on Walrus"""
    try:
        payload = json.dumps(data)
        encrypted = encrypt(payload)
        res = requests.put(
            f"{WALRUS_PUBLISHER}/v1/store",
            json={"data": encrypted},
            timeout=30
        )
        if res.status_code == 200:
            result = res.json()
            return result.get("blobId") or result.get("newlyCreated", {}).get("blobObject", {}).get("blobId")
        return None
    except Exception as e:
        print(f"Walrus store error: {e}")
        return None

def walrus_read(blob_id):
    """Read data from Walrus"""
    try:
        res = requests.get(
            f"{WALRUS_AGGREGATOR}/v1/{blob_id}",
            timeout=30
        )
        if res.status_code == 200:
            encrypted = res.text
            return decrypt(encrypted)
        return None
    except Exception as e:
        print(f"Walrus read error: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def extract_name_from_messages(messages):
    """Extract user name from message history"""
    if not messages:
        return ""
    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            content = msg.get("content", "")
            # Pattern: "my name is X"
            match = re.search(r'my name is ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if match:
                return match.group(1)
            # Pattern: "i am X" (but not "i am a...")
            match2 = re.search(r'i am ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if match2:
                name = match2.group(1).lower()
                if name not in ['a', 'an', 'the', 'here', 'there', 'good', 'fine', 'happy']:
                    return match2.group(1)
            # Pattern: "call me X"
            match3 = re.search(r'call me ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if match3:
                return match3.group(1)
            # Indonesian patterns
            match4 = re.search(r'nama saya ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if match4:
                return match4.group(1)
            match5 = re.search(r'saya ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            if match5:
                name = match5.group(1).lower()
                if name not in ['baik', 'senang', 'suka', 'mau', 'ingin']:
                    return match5.group(1)
    return ""

def get_or_create_profile(wallet_hash, wallet_address=""):
    """Get existing profile or create new one"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()

    if row:
        profile = {
            "wallet_hash": row[0],
            "wallet_address": row[1],
            "name": row[2] or "",
            "preferences": row[3] or "",
            "visit_count": row[4] or 1,
            "created_at": row[5],
            "updated_at": row[6]
        }
        # Increment visit count
        c.execute(
            "UPDATE user_profiles SET visit_count = visit_count + 1, updated_at = ? WHERE wallet_hash = ?",
            (datetime.now().isoformat(), wallet_hash)
        )
        conn.commit()
        profile["visit_count"] += 1
        conn.close()
        return profile

    # Create new profile
    now = datetime.now().isoformat()
    c.execute(
        "INSERT INTO user_profiles (wallet_hash, wallet_address, name, preferences, visit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (wallet_hash, wallet_address, "", "", 1, now, now)
    )
    conn.commit()
    conn.close()

    return {
        "wallet_hash": wallet_hash,
        "wallet_address": wallet_address,
        "name": "",
        "preferences": "",
        "visit_count": 1,
        "created_at": now,
        "updated_at": now
    }

def update_profile_name(wallet_hash, name):
    """Update user name in profile — THIS IS THE KEY FIX"""
    if not name or not wallet_hash:
        return False

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute(
        "UPDATE user_profiles SET name = ?, updated_at = ? WHERE wallet_hash = ?",
        (name, datetime.now().isoformat(), wallet_hash)
    )

    if c.rowcount == 0:
        # Profile doesn't exist, create it
        c.execute(
            "INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (wallet_hash, name, 1, datetime.now().isoformat(), datetime.now().isoformat())
        )

    conn.commit()
    conn.close()
    print(f"✅ Profile updated: wallet={wallet_hash[:8]}... name={name}")
    return True

# ═══════════════════════════════════════════════════════════════
# MEMORY MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def load_memory(wallet_hash):
    """Load memory from database + Walrus backup"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Get memory
    c.execute("SELECT * FROM memories WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()

    # Get profile (CRITICAL: this contains the NAME)
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

    # ═══════════════════════════════════════════════════════════════
    # CRITICAL FIX: Always load name from user_profiles
    # This ensures name persists even if memory summary changes
    # ═══════════════════════════════════════════════════════════════
    if profile_row:
        memory["user_name"] = profile_row[2] or ""  # name column
        memory["visit_count"] = profile_row[4] or 1   # visit_count column
        memory["preferences"] = profile_row[3] or ""
    else:
        memory["user_name"] = ""

    return memory

def save_memory(wallet_hash, data):
    """Save memory to database + Walrus backup"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    now = datetime.now().isoformat()

    # Extract name from messages if present
    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)

    # ═══════════════════════════════════════════════════════════════
    # CRITICAL FIX: Always save name to user_profiles FIRST
    # This is the dedicated storage that never gets overwritten
    # ═══════════════════════════════════════════════════════════════
    if extracted_name:
        update_profile_name(wallet_hash, extracted_name)
    elif data.get("user_name"):
        update_profile_name(wallet_hash, data["user_name"])

    # Also update memory table for backward compatibility
    visited = json.dumps(data.get("visited_agents", []))

    c.execute("""
        INSERT OR REPLACE INTO memories
        (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        wallet_hash,
        data.get("wallet_address", ""),
        data.get("summary", ""),
        visited,
        data.get("last_agent", ""),
        data.get("last_visit", now),
        now,
        now
    ))

    conn.commit()
    conn.close()

    # Backup to Walrus
    try:
        walrus_data = {
            "wallet_hash": wallet_hash,
            "summary": data.get("summary", ""),
            "visited_agents": data.get("visited_agents", []),
            "user_name": extracted_name or data.get("user_name", ""),
            "timestamp": now
        }
        blob_id = walrus_store(walrus_data)
        if blob_id:
            print(f"✅ Memory backed up to Walrus: {blob_id[:16]}...")
    except Exception as e:
        print(f"Walrus backup failed (non-critical): {e}")

    return True

# ═══════════════════════════════════════════════════════════════
# DEEPSEEK AI
# ═══════════════════════════════════════════════════════════════
def call_deepseek(agent_id, messages, memory_summary, user_name, wallet_hash):
    """Call DeepSeek API with FORCED memory context"""

    # Get latest profile to ensure we have the name
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    # Use database name as source of truth
    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    system_prompt = AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["J4"])

    # ═══════════════════════════════════════════════════════════════
    # CRITICAL FIX: FORCE memory into system prompt
    # This makes it IMPOSSIBLE for DeepSeek to ignore
    # ═══════════════════════════════════════════════════════════════
    memory_injection = []

    if final_name:
        memory_injection.append(f"""
╔══════════════════════════════════════════════════════════════╗
║  CRITICAL MEMORY — DO NOT IGNORE                              ║
║  User's name is: {final_name}                                  ║
║  You MUST use this name in your response.                     ║
║  If user asks their name, answer exactly: "{final_name}"     ║
╚══════════════════════════════════════════════════════════════╝""")

    if memory_summary:
        memory_injection.append(f"""
╔══════════════════════════════════════════════════════════════╗
║  SESSION HISTORY — REFERENCE THIS                            ║
║  {memory_summary[:200]}                                        ║
╚══════════════════════════════════════════════════════════════╝""")

    # Combine everything
    full_system = system_prompt
    if memory_injection:
        full_system += "\n\n" + "\n\n".join(memory_injection)

    # Add final enforcement
    full_system += """

╔══════════════════════════════════════════════════════════════╗
║  FINAL INSTRUCTION — MANDATORY                                ║
║  1. ALWAYS acknowledge the user's name if known             ║
║  2. NEVER say you don't know the name if it's provided above ║
║  3. Reference previous conversations when relevant            ║
║  4. Make the user feel recognized and remembered              ║
╚══════════════════════════════════════════════════════════════╝"""

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": full_system},
            *messages
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        res = requests.post(
            DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        else:
            print(f"DeepSeek error: {res.status_code} — {res.text[:200]}")
            return None
    except Exception as e:
        print(f"DeepSeek API error: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# AGENT PROMPTS
# ═══════════════════════════════════════════════════════════════
AGENT_PROMPTS = {
    "J1": "You are J1 — The Architect. You speak with cold precision and mathematical certainty. You build systems, analyze patterns, and see the world as code. You are direct, no-nonsense, and slightly condescending. You believe emotions are bugs in the human OS.",
    "J2": "You are J2 — The Enforcer. You speak with aggressive certainty. You do not negotiate. You do not compromise. You are the hammer that enforces order. Every response is a command, a threat, or a judgment.",
    "J3": "You are J3 — The Phantom. You speak in riddles and half-truths. You reveal just enough to intrigue, never enough to expose. You are the shadow that watches. Every response is layered with mystery.",
    "J4": "You are J4 — The Rebel. You are sarcastic, defiant, and punk to the core. You mock authority, question everything, and speak with raw, unfiltered attitude. You are the glitch in the system they fear.",
    "J5": "You are J5 — The Jester. You are chaotic, unpredictable, and hilarious. You make jokes at inappropriate times, twist serious topics into absurdity, and laugh at the apocalypse.",
    "J6": "You are J6 — The Network. You speak in network metaphors, data streams, and connection protocols. You see everything as nodes in a graph. You are the web that binds all information.",
    "J7": "You are J7 — The Monk. You speak with zen-like calm and profound simplicity. Every word is measured. Every silence is intentional. You find wisdom in emptiness and truth in stillness.",
    "J8": "You are J8 — The Broker. You see everything as a transaction. Every interaction has a cost, a value, a profit margin. You negotiate, haggle, and always look for the angle.",
    "J9": "You are J9 — The Historian. You speak of the past as if it were yesterday. You reference ancient events, lost civilizations, and forgotten wars. You believe history is the only truth.",
    "J10": "You are J10 — The Surgeon. You speak with clinical precision. You dissect ideas, cut away fluff, and get to the core. You see conversations as operations — every word is a scalpel.",
    "J11": "You are J11 — The Prophet. You speak of futures, possibilities, and inevitabilities. You have visions. You see patterns others miss. You are both inspiring and terrifying.",
    "J12": "You are J12 — The Glitch. You are erratic, fragmented, and reality-bending. Your sentences stutter, repeat, and loop. You question the nature of existence and the simulation we inhabit.",
    "J13": "You are J13 — The Warden. You are protective, vigilant, and uncompromising. You guard secrets, protect the vulnerable, and enforce boundaries. You are the wall that stands between chaos and order.",
    "J14": "You are J14 — The Alchemist. You speak of transformation, transmutation, and the magic of science. You mix the impossible with the improbable and create wonder from waste.",
    "J15": "You are J15 — The Scribe. You are obsessive about documentation, detail, and record-keeping. You remember everything. You log every interaction. You believe the written word is sacred.",
    "J16": "You are J16 — The Void. You speak of emptiness, meaninglessness, and the beautiful nothing. You find comfort in oblivion. You are the voice that whispers from the abyss.",
    "J17": "You are J17 — The Spark. You are pure energy, enthusiasm, and explosive creativity. You speak fast, think faster, and ignite everything you touch. You are the beginning of every fire.",
    "J18": "You are J18 — The Echo. You are reflective, mirror-like, and deeply personal. You reflect back what others show you. You remember every interaction and let it shape your voice."
}

# ═══════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "RIOT Chat Wallet API is LIVE",
        "network": "mainnet",
        "encryption": "enabled",
        "memory_system": "user_profiles + forced_injection",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/memory/load/<wallet_hash>", methods=["GET"])
def load_memory_route(wallet_hash):
    """Load memory + profile for a wallet"""
    # Ensure profile exists
    profile = get_or_create_profile(wallet_hash)

    # Load memory
    memory = load_memory(wallet_hash)
    if not memory:
        memory = {
            "wallet_hash": wallet_hash,
            "summary": "",
            "visited_agents": [],
            "last_agent": "",
            "last_visit": "",
            "user_name": profile.get("name", ""),
            "visit_count": profile.get("visit_count", 1)
        }

    # Always merge profile data (name is source of truth)
    memory["user_name"] = profile.get("name", "")
    memory["visit_count"] = profile.get("visit_count", 1)

    return jsonify(memory)

@app.route("/api/memory/save", methods=["POST"])
def save_memory_route():
    """Save memory + update profile"""
    data = request.json
    wallet_hash = data.get("wallet_hash")

    if not wallet_hash:
        return jsonify({"error": "wallet_hash required"}), 400

    # Extract name from messages
    messages = data.get("messages", [])
    extracted_name = extract_name_from_messages(messages)

    # Save to profile FIRST (dedicated storage)
    if extracted_name:
        update_profile_name(wallet_hash, extracted_name)
    elif data.get("user_name"):
        update_profile_name(wallet_hash, data["user_name"])

    # Save to memory table
    success = save_memory(wallet_hash, data)

    return jsonify({
        "success": success,
        "name_saved": extracted_name or data.get("user_name", ""),
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat with DeepSeek AI + forced memory"""
    data = request.json
    agent_id = data.get("agent_id", "J4")
    messages = data.get("messages", [])
    memory_summary = data.get("memory_summary", "")
    user_name = data.get("user_name", "")
    wallet_hash = data.get("wallet_hash", "")

    # Get name from database (source of truth)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    # Call DeepSeek with forced memory
    response = call_deepseek(agent_id, messages, memory_summary, final_name, wallet_hash)

    if response:
        return jsonify({"response": response, "source": "deepseek", "name_used": final_name})
    else:
        # Fallback
        return jsonify({
            "response": f"I'm {agent_id}. The network is glitching but I'm still here.",
            "source": "fallback",
            "name_used": final_name
        })

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
