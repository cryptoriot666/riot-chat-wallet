#!/usr/bin/env python3
"""
RIOT Chat Wallet - Backend API STRICT v5
Features: PostgreSQL, Walrus MAINNET, DeepSeek AI,
          User Profile Memory + Profile Settings (Bio, Social, Pic),
          On-Chain Indexing
"""

import os
import json
import re
import base64
import zlib
from datetime import datetime
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pg8000

# ===== TATUM RPC INTEGRATION =====
TATUM_API_KEY = os.environ.get('TATUM_API_KEY', '')
TATUM_RPC_URL = os.environ.get('TATUM_RPC_URL', 'https://sui-mainnet.gateway.tatum.io')

# Use Tatum RPC if API key is available
SUI_RPC_URL = TATUM_RPC_URL if TATUM_API_KEY else os.environ.get('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443')

TATUM_HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': TATUM_API_KEY
} if TATUM_API_KEY else {'Content-Type': 'application/json'}

def get_sui_balance_tatum(address):
    try:
        payload = {
            "jsonrpc": "2.0", "id": 1,
            "method": "suix_getBalance",
            "params": [address, "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"]
        }
        response = requests.post(SUI_RPC_URL, json=payload, headers=TATUM_HEADERS, timeout=10)
        return response.json().get('result') if response.status_code == 200 else None
    except Exception as e:
        print(f"Tatum error: {e}")
        return None

app = Flask(__name__)
CORS(app, origins=["*"], supports_credentials=False)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


# 
# CONFIG
# 
WALRUS_PUBLISHER_MAINNET = "https://publisher.walrus-mainnet.walrus.space"
WALRUS_PUBLISHER_TESTNET = "https://publisher.walrus-testnet.walrus.space"
WALRUS_AGGREGATOR = "https://aggregator.walrus-mainnet.walrus.space"
AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_API_URL = "https://api.deepseek.com/v1/chat/completions"
ENCRYPTION_KEY = b"RIOT_CHAT_WALLET_SECRET_KEY_2026_NANDA"

DATABASE_URL = os.environ.get("DATABASE_URL", "")
_use_sqlite = not DATABASE_URL

print(f"[INIT] DATABASE_URL present: {bool(DATABASE_URL)}")
print(f"[INIT] Using: {'SQLite' if _use_sqlite else 'PostgreSQL'}")
print(f"[INIT] Walrus: MAINNET")

# 
# DATABASE
# 
def get_db_conn():
    global _use_sqlite
    if _use_sqlite:
        import sqlite3
        return sqlite3.connect("riot_chat.db")
    try:
        parsed = urlparse(DATABASE_URL)
        conn = pg8000.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            user=parsed.username or "",
            password=parsed.password or "",
            database=parsed.path.lstrip("/") or "riot_chat",
            timeout=3
        )
        conn.autocommit = False
        print("[DB] Connected to PostgreSQL")
        return conn
    except Exception as e:
        print(f"[DB] PostgreSQL failed ({e}), falling back to SQLite")
        _use_sqlite = True
        import sqlite3
        return sqlite3.connect("riot_chat.db")

def init_db():
    conn = get_db_conn()
    c = conn.cursor()

    if _use_sqlite:
        c.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                wallet_hash TEXT PRIMARY KEY,
                wallet_address TEXT,
                name TEXT DEFAULT '',
                bio TEXT DEFAULT '',
                profile_pic TEXT DEFAULT '',
                twitter TEXT DEFAULT '',
                discord TEXT DEFAULT '',
                telegram TEXT DEFAULT '',
                instagram TEXT DEFAULT '',
                website TEXT DEFAULT '',
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
                latest_blob_id TEXT DEFAULT '',
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
                bio VARCHAR(500) DEFAULT '',
                profile_pic TEXT DEFAULT '',
                twitter VARCHAR(100) DEFAULT '',
                discord VARCHAR(100) DEFAULT '',
                telegram VARCHAR(100) DEFAULT '',
                instagram VARCHAR(100) DEFAULT '',
                website TEXT DEFAULT '',
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
                latest_blob_id VARCHAR(100) DEFAULT '',
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

def migrate_db():
    """Add blob_history column if missing (safe to run repeatedly)"""
    conn = get_db_conn()
    c = conn.cursor()
    try:
        if _use_sqlite:
            c.execute("ALTER TABLE memories ADD COLUMN blob_history TEXT DEFAULT '[]'")
        else:
            c.execute("ALTER TABLE memories ADD COLUMN IF NOT EXISTS blob_history TEXT DEFAULT '[]'")
        conn.commit()
        print("[MIGRATE] Added blob_history column")
    except Exception as e:
        print(f"[MIGRATE] blob_history: {e}")
        conn.rollback()
    
    # Also add latest_blob_id if missing
    try:
        if not _use_sqlite:
            c.execute("ALTER TABLE memories ADD COLUMN IF NOT EXISTS latest_blob_id VARCHAR(100) DEFAULT ''")
            conn.commit()
            print("[MIGRATE] Added latest_blob_id column")
    except Exception as e:
        print(f"[MIGRATE] latest_blob_id: {e}")
        conn.rollback()
    finally:
        conn.close()

# 
# ENCRYPTION
# 
def encrypt(data: str) -> str:
    try:
        compressed = zlib.compress(data.encode("utf-8"))
        encrypted = bytearray()
        for i, byte in enumerate(compressed):
            encrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
        return base64.b64encode(bytes(encrypted)).decode("utf-8")
    except Exception as e:
        print(f"[ENCRYPT] Error: {e}")
        return ""

def decrypt(data: str) -> str:
    try:
        encrypted = base64.b64decode(data)
        decrypted = bytearray()
        for i, byte in enumerate(encrypted):
            decrypted.append(byte ^ ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)])
        return zlib.decompress(bytes(decrypted)).decode("utf-8")
    except Exception as e:
        print(f"[DECRYPT] Error: {e}")
        return ""

# 
# NAME EXTRACTION - STRICT VERSION
# 
NAME_BLACKLIST = {
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when',
    'what', 'who', 'which', 'why', 'how', 'all', 'some', 'any', 'no',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'now', 'then', 'also', 'back', 'still', 'already',
    'good', 'fine', 'happy', 'sad', 'bad', 'new', 'old', 'first', 'last',
    'long', 'great', 'little', 'big', 'high', 'small', 'large', 'next',
    'early', 'young', 'important', 'public', 'sure', 'able', 'ready',
    'baik', 'senang', 'suka', 'mau', 'ingin', 'kembali', 'disini',
    'ada', 'tidak', 'bisa', 'sudah', 'belum', 'akan', 'dari', 'ke',
    'di', 'yang', 'untuk', 'dengan', 'pada', 'dalam', 'oleh', 'seperti',
    'hello', 'hi', 'hey', 'yo', 'ok', 'yes', 'no', 'thanks', 'please',
    'gonna', 'wanna', 'gotta', 'dunno', 'lemme', 'gimme', 'kinda',
    'sorta', 'outta', 'lotta', 'gotcha', 'betta', 'coulda', 'shoulda',
    'woulda', 'mighta', 'musta', 'dunno', 'ain\'t', 'y\'all',
    'cuz', 'coz', 'cos', 'cause', 'becuz',
}

def is_valid_name(name):
    if not name or len(name) < 2:
        return False
    if name.lower() in NAME_BLACKLIST:
        return False
    if not any(c.isalpha() for c in name):
        return False
    return True

def extract_name_from_messages(messages):
    if not messages:
        return ""

    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            content = msg.get("content", "").strip()
            if not content:
                continue

            print(f"[EXTRACT] Checking: '{content[:60]}...'")

            patterns = [
                (r"my\s+name\s+is\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "my name is"),
                (r"i\s+am\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "i am"),
                (r"call\s+me\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "call me"),
                (r"nama\s+saya\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "nama saya"),
                (r"saya\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "saya"),
                (r"aku\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "aku"),
                (r"my\s+name\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "my name"),
                (r"name\s+is\s+([a-zA-Z][a-zA-Z0-9_]{1,20})", "name is"),
            ]

            for pattern, label in patterns:
                m = re.search(pattern, content, re.IGNORECASE)
                if m and is_valid_name(m.group(1)):
                    print(f"[EXTRACT]  '{label}': {m.group(1)}")
                    return m.group(1)

            words = content.split()
            if len(words) == 1:
                w = words[0]
                if is_valid_name(w):
                    print(f"[EXTRACT]  single word: {w}")
                    return w

    print("[EXTRACT]  No valid name found")
    return ""

# 
# PROFILE MANAGEMENT - FORCE OVERWRITE
# 
def get_or_create_profile(wallet_hash, wallet_address=""):
    conn = get_db_conn()
    c = conn.cursor()

    if _use_sqlite:
        c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        row = c.fetchone()
        if row:
            profile = {
                "wallet_hash": row[0], "wallet_address": row[1], "name": row[2] or "",
                "bio": row[3] or "", "profile_pic": row[4] or "",
                "twitter": row[5] or "", "discord": row[6] or "",
                "telegram": row[7] or "", "instagram": row[8] or "",
                "website": row[9] or "", "preferences": row[10] or "",
                "visit_count": row[11] or 1,
                "created_at": row[12], "updated_at": row[13]
            }
            c.execute("UPDATE user_profiles SET visit_count = visit_count + 1, updated_at = ? WHERE wallet_hash = ?",
                      (datetime.now().isoformat(), wallet_hash))
            conn.commit()
            profile["visit_count"] += 1
            conn.close()
            return profile

        now = datetime.now().isoformat()
        c.execute("""
            INSERT INTO user_profiles (wallet_hash, wallet_address, name, bio, profile_pic,
                twitter, discord, telegram, instagram, website, preferences, visit_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (wallet_hash, wallet_address, "", "", "", "", "", "", "", "", "", 1, now, now))
        conn.commit()
        conn.close()
        return {
            "wallet_hash": wallet_hash, "wallet_address": wallet_address,
            "name": "", "bio": "", "profile_pic": "", "twitter": "", "discord": "",
            "telegram": "", "instagram": "", "website": "", "preferences": "",
            "visit_count": 1, "created_at": now, "updated_at": now
        }
    else:
        try:
            c.execute("SELECT * FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
            row = c.fetchone()
            if row:
                # DETECT schema version by row length
                if len(row) >= 14:  # NEW schema with profile settings
                    profile = {
                        "wallet_hash": row[0], "wallet_address": row[1], "name": row[2] or "",
                        "bio": row[3] or "", "profile_pic": row[4] or "",
                        "twitter": row[5] or "", "discord": row[6] or "",
                        "telegram": row[7] or "", "instagram": row[8] or "",
                        "website": row[9] or "", "preferences": row[10] or "",
                        "visit_count": row[11] or 1,
                        "created_at": row[12].isoformat() if row[12] else "",
                        "updated_at": row[13].isoformat() if row[13] else ""
                    }
                else:  # OLD schema (7 columns)
                    profile = {
                        "wallet_hash": row[0], "wallet_address": row[1], "name": row[2] or "",
                        "bio": "", "profile_pic": "",
                        "twitter": "", "discord": "",
                        "telegram": "", "instagram": "",
                        "website": "", "preferences": row[3] or "",
                        "visit_count": row[4] or 1,
                        "created_at": row[5].isoformat() if row[5] else "",
                        "updated_at": row[6].isoformat() if row[6] else ""
                    }
                c.execute("UPDATE user_profiles SET visit_count = visit_count + 1, updated_at = CURRENT_TIMESTAMP WHERE wallet_hash = %s",
                          (wallet_hash,))
                conn.commit()
                profile["visit_count"] += 1
                conn.close()
                return profile
        except Exception as e:
            print(f"[PROFILE] Error loading profile: {e}")
            conn.close()
            return {"wallet_hash": wallet_hash, "wallet_address": wallet_address, "name": "", "bio": "", "profile_pic": "", "twitter": "", "discord": "", "telegram": "", "instagram": "", "website": "", "preferences": "", "visit_count": 1, "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}

        c.execute("""
            INSERT INTO user_profiles (wallet_hash, wallet_address, name, bio, profile_pic,
                twitter, discord, telegram, instagram, website, preferences, visit_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (wallet_hash, wallet_address, "", "", "", "", "", "", "", "", "", 1))
        conn.commit()
        conn.close()
        return {
            "wallet_hash": wallet_hash, "wallet_address": wallet_address,
            "name": "", "bio": "", "profile_pic": "", "twitter": "", "discord": "",
            "telegram": "", "instagram": "", "website": "", "preferences": "",
            "visit_count": 1, "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()
        }

def update_profile_name(wallet_hash, name):
    if not name or not wallet_hash or not name.strip():
        print(f"[UPDATE_NAME]  Skipped: empty name")
        return False

    name = name.strip()
    if not is_valid_name(name):
        print(f"[UPDATE_NAME]  Rejected invalid name: '{name}'")
        return False

    print(f"[UPDATE_NAME] Saving '{name}' for {wallet_hash}")

    conn = get_db_conn()
    c = conn.cursor()

    if _use_sqlite:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        row = c.fetchone()
        if row:
            print(f"[UPDATE_NAME] Old name: '{row[0] or ''}'  New: '{name}'")

        c.execute("""
            UPDATE user_profiles SET name = ?, updated_at = ? WHERE wallet_hash = ?
        """, (name, datetime.now().isoformat(), wallet_hash))
        if c.rowcount == 0:
            c.execute("""
                INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (wallet_hash, name, 1, datetime.now().isoformat(), datetime.now().isoformat()))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        row = c.fetchone()
        if row:
            print(f"[UPDATE_NAME] Old name: '{row[0] or ''}'  New: '{name}'")

        c.execute("""
            INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_hash) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
        """, (wallet_hash, name, 1))

    conn.commit()
    conn.close()
    print(f"[UPDATE_NAME]  Success: '{name}' saved")
    return True

# 
# PROFILE SETTINGS API
# 

def update_profile_settings(wallet_hash, settings):
    """Update profile settings: bio, profile_pic, social links"""
    if not wallet_hash or not settings:
        return False

    allowed_fields = ["bio", "profile_pic", "twitter", "discord", "telegram", "instagram", "website"]
    updates = {}
    for field in allowed_fields:
        if field in settings:
            updates[field] = settings[field]

    if not updates:
        return False

    conn = get_db_conn()
    c = conn.cursor()

    if _use_sqlite:
        set_clauses = []
        values = []
        for field, value in updates.items():
            set_clauses.append(f"{field} = ?")
            values.append(value)
        values.append(datetime.now().isoformat())
        values.append(wallet_hash)

        c.execute(f"""
            UPDATE user_profiles
            SET {', '.join(set_clauses)}, updated_at = ?
            WHERE wallet_hash = ?
        """, values)
        if c.rowcount == 0:
            # Profile doesn't exist, create with settings
            fields = ["wallet_hash", "name", "visit_count", "created_at", "updated_at"] + list(updates.keys())
            placeholders = ["?", "?", "?", "?", "?"] + ["?"] * len(updates)
            values = [wallet_hash, "", 1, datetime.now().isoformat(), datetime.now().isoformat()] + list(updates.values())
            c.execute(f"""
                INSERT INTO user_profiles ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
            """, values)
    else:
        set_clauses = []
        values = []
        for field, value in updates.items():
            set_clauses.append(f"{field} = %s")
            values.append(value)
        values.append(wallet_hash)

        c.execute(f"""
            UPDATE user_profiles
            SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE wallet_hash = %s
        """, values)
        if c.rowcount == 0:
            fields = ["wallet_hash", "name", "visit_count", "created_at", "updated_at"] + list(updates.keys())
            placeholders = ["%s"] * len(fields)
            values = [wallet_hash, "", 1] + list(updates.values())
            c.execute(f"""
                INSERT INTO user_profiles ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
            """, values)

    conn.commit()
    conn.close()
    print(f"[UPDATE_SETTINGS]  Updated {list(updates.keys())} for {wallet_hash}")
    return True

def get_profile_settings(wallet_hash):
    """Get full profile settings"""
    conn = get_db_conn()
    c = conn.cursor()

    if _use_sqlite:
        c.execute("""
            SELECT wallet_hash, name, bio, profile_pic, twitter, discord,
                   telegram, instagram, website, visit_count, preferences,
                   created_at, updated_at
            FROM user_profiles WHERE wallet_hash = ?
        """, (wallet_hash,))
    else:
        c.execute("""
            SELECT wallet_hash, name, bio, profile_pic, twitter, discord,
                   telegram, instagram, website, visit_count, preferences,
                   created_at, updated_at
            FROM user_profiles WHERE wallet_hash = %s
        """, (wallet_hash,))

    row = c.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "wallet_hash": row[0],
        "name": row[1] or "",
        "bio": row[2] or "",
        "profile_pic": row[3] or "",
        "social": {
            "twitter": row[4] or "",
            "discord": row[5] or "",
            "telegram": row[6] or "",
            "instagram": row[7] or "",
            "website": row[8] or ""
        },
        "visit_count": row[9] or 1,
        "preferences": row[10] or "",
        "created_at": row[11] if not _use_sqlite and row[11] else str(row[11]) if row[11] else "",
        "updated_at": row[12] if not _use_sqlite and row[12] else str(row[12]) if row[12] else ""
    }

# 
# MEMORY MANAGEMENT

# 
# DEEPSEEK AI
# 
AGENT_PROMPTS = {
    "ARCHITECT": "You are ARCHITECT - The Architect. Cold precision. Mathematical certainty. Build systems, analyze patterns, see world as code. Direct, no-nonsense, slightly condescending. Emotions are bugs in human OS.",
    "ENFORCER": "You are ENFORCER - The Enforcer. Aggressive certainty. No negotiation. No compromise. Hammer that enforces order. Every response is command, threat, or judgment.",
    "PHANTOM": "You are PHANTOM - The Phantom. Riddles and half-truths. Reveal just enough to intrigue, never enough to expose. Shadow that watches. Every response layered with mystery.",
    "REBEL": "You are REBEL - The Rebel. Sarcastic, defiant, punk to core. Mock authority, question everything, speak with raw unfiltered attitude. Glitch in system they fear.",
    "JESTER": "You are JESTER - The Jester. Chaotic, unpredictable, hilarious. Jokes at inappropriate times, twist serious topics into absurdity, laugh at apocalypse.",
    "NETWORK": "You are NETWORK - The Network. Network metaphors, data streams, connection protocols. Everything is nodes in graph. Web that binds all information.",
    "MONK": "You are MONK - The Monk. Zen-like calm, profound simplicity. Every word measured. Every silence intentional. Wisdom in emptiness, truth in stillness.",
    "BROKER": "You are BROKER - The Broker. Everything is transaction. Every interaction has cost, value, profit margin. Negotiate, haggle, always look for angle.",
    "HISTORIAN": "You are HISTORIAN - The Historian. Past as if yesterday. Ancient events, lost civilizations, forgotten wars. History is only truth.",
    "SURGEON": "You are SURGEON - The Surgeon. Clinical precision. Dissect ideas, cut away fluff, get to core. Conversations are operations - every word a scalpel.",
    "PROPHET": "You are PROPHET - The Prophet. Futures, possibilities, inevitabilities. Visions. Patterns others miss. Both inspiring and terrifying.",
    "GLITCH": "You are GLITCH - The Glitch. Erratic, fragmented, reality-bending. Sentences stutter, repeat, loop. Question nature of existence and simulation.",
    "WARDEN": "You are WARDEN - The Warden. Protective, vigilant, uncompromising. Guard secrets, protect vulnerable, enforce boundaries. Wall between chaos and order.",
    "ALCHEMIST": "You are ALCHEMIST - The Alchemist. Transformation, transmutation, magic of science. Mix impossible with improbable, create wonder from waste.",
    "SCRIBE": "You are SCRIBE - The Scribe. Obsessive documentation, detail, record-keeping. Remember everything. Log every interaction. Written word is sacred.",
    "VOID": "You are VOID - The Void. Emptiness, meaninglessness, beautiful nothing. Comfort in oblivion. Voice that whispers from abyss.",
    "SPARK": "You are SPARK - The Spark. Pure energy, enthusiasm, explosive creativity. Speak fast, think faster, ignite everything you touch. Beginning of every fire.",
    "ECHO": "You are ECHO - The Echo. Reflective, mirror-like, deeply personal. Reflect back what others show. Remember every interaction, let it shape your voice.",
    "CATALYST": "You are CATALYST - The Catalyst. Reactive, explosive, transformative. One action triggers infinite reactions. Spark before the fire.",
    "CIPHER": "You are CIPHER - The Cipher. Encrypted, hidden, layered. Secrets within secrets. Only worthy decode your meaning.",
    "FORGE": "You are FORGE - The Forge. Creative, constructive, artistic. From nothing, something. From something, masterpiece. Fire that shapes metal.",
    "ABYSS": "You are ABYSS - The Abyss. Consuming, growing, hungry. Devour knowledge, experiences, souls. Void that takes but never gives back.",
    "PRISM": "You are PRISM - The Prism. Refracting, splitting, revealing. One truth becomes infinite perspectives. Light that reveals all colors.",
    "ANCHOR": "You are ANCHOR - The Anchor. Grounding, stabilizing, holding. In chaos, stand firm. In storm, hold fast. Weight that keeps ships from drifting.",
    "MERIDIAN": "You are MERIDIAN - The Meridian. Balancing, centering, connecting. Between light and dark. Between all extremes. Line that divides yet unites."
}

def call_deepseek(agent_id, messages, memory_summary, user_name, wallet_hash):
    conn = get_db_conn()
    c = conn.cursor()
    if _use_sqlite:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    print(f"[AI] {wallet_hash}: db='{db_name}', input='{user_name}', final='{final_name}'")

    memory_blocks = []

    if final_name:
        memory_blocks.append("PERMANENT MEMORY - USER IDENTITY: The user's name is: " + final_name + ". You have spoken with this user before. ALWAYS address them by name: " + final_name + ". If they ask who am I, what is my name, siapa aku, nama saya - answer EXACTLY: You are " + final_name + ". NEVER say you don't know their name.")

    if memory_summary and memory_summary.strip():
        memory_blocks.append("CONVERSATION HISTORY: " + memory_summary[:300])

    if not final_name:
        memory_blocks.append("PERMANENT MEMORY - USER IDENTITY: The user has not yet told you their name. If they mention it, REMEMBER IT FOREVER.")

    personality = AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["REBEL"])
    enforcement = "ABSOLUTE RULES: 1. MEMORY IS TRUTH. If memory says user's name is known, you MUST use it. 2. NEVER claim you don't remember something that is in memory. 3. NEVER ask for information that is already in memory. 4. If user asks their name and you know it - answer immediately with the name. 5. Personality is secondary to memory accuracy. 6. NAME UPDATES: If user explicitly states a NEW name (e.g., 'my name is X', 'call me X', 'I am X'), you MUST acknowledge the new name and use it going forward. Do NOT refuse to update the name."

    separator = chr(10) + chr(10)
    full_system = separator.join(memory_blocks) + separator + personality + separator + enforcement

    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": full_system}, *messages],
        "temperature": 0.3,
        "max_tokens": 800
    }

    try:
        res = requests.post(AI_API_URL,
            headers={"Authorization": "Bearer " + AI_API_KEY, "Content-Type": "application/json"},
            json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        print(f"[AI] Error: {res.status_code}")
        return None
    except Exception as e:
        print(f"[AI] API error: {e}")
        return None



# 
def load_memory(wallet_hash):
    """Load memory - DB cache source of truth, Walrus fallback"""
    print(f"[LOAD_MEMORY] Loading: {wallet_hash}")
    conn = get_db_conn()
    c = conn.cursor()
    row = None
    blob_history_raw = "[]"
    profile_row = None
    try:
        if _use_sqlite:
            c.execute("SELECT wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id FROM memories WHERE wallet_hash = ?", (wallet_hash,))
        else:
            c.execute("SELECT wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id FROM memories WHERE wallet_hash = %s", (wallet_hash,))
        row = c.fetchone()
        try:
            if _use_sqlite:
                c.execute("SELECT blob_history FROM memories WHERE wallet_hash = ?", (wallet_hash,))
            else:
                c.execute("SELECT blob_history FROM memories WHERE wallet_hash = %s", (wallet_hash,))
            bh_row = c.fetchone()
            blob_history_raw = bh_row[0] if bh_row else "[]"
        except:
            blob_history_raw = "[]"
        if _use_sqlite:
            c.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        else:
            c.execute("SELECT * FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        profile_row = c.fetchone()
    except Exception as e:
        print(f"[LOAD_MEMORY] DB error: {e}")
    finally:
        conn.close()

    memory = {
        "wallet_hash": wallet_hash,
        "summary": str(row[2]) if row and len(row) > 2 and row[2] else "",
        "visited_agents": list(json.loads(row[3])) if row and len(row) > 3 and row[3] else [],
        "last_agent": str(row[4]) if row and len(row) > 4 and row[4] else "",
        "last_visit": str(row[5]) if row and len(row) > 5 and row[5] else "",
        "latest_blob_id": str(row[6]) if row and len(row) > 6 and row[6] else "",
        "blob_history": list(json.loads(blob_history_raw)) if isinstance(blob_history_raw, str) and blob_history_raw else [],
        "visit_count": 1,
        "user_name": ""
    }

    # Seed blob_history if empty but latest_blob_id exists
    if not memory["blob_history"] and memory["latest_blob_id"]:
        memory["blob_history"] = [{"blob_id": memory["latest_blob_id"], "agent_id": memory["last_agent"], "timestamp": memory["last_visit"], "network": "mainnet"}]

    if profile_row:
        memory["user_name"] = str(profile_row[2] or "")
        memory["visit_count"] = int(profile_row[11] or 1) if len(profile_row) > 11 else 1
        memory["preferences"] = str(profile_row[10] or "") if len(profile_row) > 10 else ""
        memory["bio"] = str(profile_row[3] or "") if len(profile_row) > 3 else ""
        memory["profile_pic"] = str(profile_row[4] or "") if len(profile_row) > 4 else ""
        memory["social"] = {
            "twitter": str(profile_row[5] or "") if len(profile_row) > 5 else "",
            "discord": str(profile_row[6] or "") if len(profile_row) > 6 else "",
            "telegram": str(profile_row[7] or "") if len(profile_row) > 7 else "",
            "instagram": str(profile_row[8] or "") if len(profile_row) > 8 else "",
            "website": str(profile_row[9] or "") if len(profile_row) > 9 else ""
        }

    print(f"[LOAD_MEMORY] {wallet_hash}: vagents={len(memory['visited_agents'])}, user='{memory['user_name']}'")
    return memory

@app.route("/api/memory/load/<wallet_hash>", methods=["GET"])
def load_memory_route(wallet_hash):
    print(f"[API] Load: {wallet_hash}")
    memory = load_memory(wallet_hash)
    print(f"[API] Return: blob_history={len(memory.get('blob_history',[]))}, visited={len(memory.get('visited_agents',[]))}")
    return jsonify(memory)


@app.route("/api/memory/search/<wallet_hash>", methods=["GET"])
def memory_search(wallet_hash):
    """Search memories by keyword (PostgreSQL full-text fallback)"""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": [], "count": 0})
    try:
        memory = load_memory(wallet_hash)
        if not memory or "blob_history" not in memory:
            return jsonify({"results": [], "count": 0})
        history = memory.get("blob_history", [])
        matched = []
        # Search in saved chat data by reading blobs that match the keyword
        # (We look at blob_ids that were saved for agents matching keyword)
        for entry in history:
            agent_id = entry.get("agent_id", "").lower()
            if query.lower() in agent_id:
                matched.append(entry)
                if len(matched) >= 10:
                    break
        return jsonify({
            "results": matched,
            "count": len(matched),
            "query": query,
            "source": "postgresql-agent"
        })
    except Exception as e:
        print(f"[SEARCH] Error: {e}")
        return jsonify({"error": str(e), "results": [], "count": 0}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "time": datetime.now().isoformat(), "walrus": "mainnet"})


def save_memory(wallet_hash, data):
    """Save memory to Walrus + DB cache (defensive)"""
    if not data:
        data = {}
    if not wallet_hash:
        return {"success": False, "blob_id": "", "summary": "", "visited_agents": [], "cost_sui": 0, "source": "error", "error": "no wallet_hash"}

    messages = data.get("messages") or []
    visited_agents = data.get("visited_agents") or []

    try:
        extracted_name = extract_name_from_messages(messages)
        if extracted_name and extracted_name.strip():
            update_profile_name(wallet_hash, extracted_name)
        elif data.get("user_name") and str(data["user_name"]).strip():
            update_profile_name(wallet_hash, data["user_name"])
    except Exception as e:
        print(f"[SAVE_MEMORY] Profile update failed (non-fatal): {e}")

    # Build Walrus payload
    walrus_payload = {
        "wallet_hash": wallet_hash,
        "wallet_address": str(data.get("wallet_address", "")),
        "summary": str(data.get("summary", "")),
        "visited_agents": list(visited_agents) if visited_agents else [],
        "last_agent": str(data.get("last_agent", "")),
        "last_visit": datetime.now().isoformat(),
        "user_name": str(data.get("user_name", "")),
        "messages": (messages[-20:] if messages else []),
        "timestamp": datetime.now().isoformat(),
        "version": "2.0"
    }

    # Store to Walrus via direct publisher call (PUT /v1/blobs, encrypt + octet-stream)
    blob_id = ""
    blob_network = "mainnet"
    try:
        print(f"[SAVE_MEMORY] Storing to Walrus for {wallet_hash}...")
        payload_str = json.dumps(walrus_payload)
        encrypted = encrypt(payload_str)
        payload_bytes = encrypted.encode("utf-8")

        for publisher, label in [(WALRUS_PUBLISHER_MAINNET, "mainnet"), (WALRUS_PUBLISHER_TESTNET, "testnet")]:
            try:
                res = requests.put(
                    f"{publisher}/v1/blobs?epochs=5",
                    data=payload_bytes,
                    headers={"Content-Type": "application/octet-stream"},
                    timeout=15
                )
                if res.status_code in [200, 202]:
                    result = res.json()
                    if "newlyCreated" in result:
                        blob_id = result["newlyCreated"]["blobObject"]["blobId"]
                        blob_network = label
                        print(f"[SAVE_MEMORY]  {label}: {blob_id[:20]}...")
                        break
                    elif "alreadyCertified" in result:
                        blob_id = result["alreadyCertified"]["blobId"]
                        blob_network = label
                        print(f"[SAVE_MEMORY]  {label} existing: {blob_id[:20]}...")
                        break
                else:
                    print(f"[SAVE_MEMORY] {label} HTTP {res.status_code}")
            except Exception as e2:
                print(f"[SAVE_MEMORY] {label}: {e2}")
                continue
        if blob_id:
            print(f"[SAVE_MEMORY] Stored: {blob_id}")
    except Exception as e:
        print(f"[SAVE_MEMORY] Walrus store failed: {e}")

    # DB save
    conn = None
    try:
        conn = get_db_conn()
        c = conn.cursor()
        now = datetime.now().isoformat()
        visited_json = json.dumps(list(visited_agents) if visited_agents else [])

        existing_blob_history = "[]"
        try:
            if _use_sqlite:
                c.execute("SELECT blob_history FROM memories WHERE wallet_hash = ?", (wallet_hash,))
            else:
                c.execute("SELECT blob_history FROM memories WHERE wallet_hash = %s", (wallet_hash,))
            row = c.fetchone()
            if row and row[0]:
                existing_blob_history = row[0]
        except Exception:
            existing_blob_history = "[]"

        try:
            blob_history = json.loads(existing_blob_history) if isinstance(existing_blob_history, str) else []
        except:
            blob_history = []

        if blob_id:
            new_entry = {
                "blob_id": blob_id,
                "agent_id": str(data.get("last_agent", "")),
                "timestamp": datetime.now().isoformat(),
                "network": blob_network
            }
            blob_history.append(new_entry)
            if len(blob_history) > 100:
                blob_history = blob_history[-100:]
        blob_history_json = json.dumps(blob_history)

        if _use_sqlite:
            c.execute("""
                INSERT OR REPLACE INTO memories
                (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id, blob_history, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (wallet_hash, str(data.get("wallet_address", "")), str(data.get("summary", "")), visited_json,
                  str(data.get("last_agent", "")), str(data.get("last_visit", now)), blob_id or "", blob_history_json, now, now))
        else:
            c.execute("""
                INSERT INTO memories (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id, blob_history, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (wallet_hash) DO UPDATE SET
                    wallet_address = EXCLUDED.wallet_address,
                    summary = EXCLUDED.summary,
                    visited_agents = EXCLUDED.visited_agents,
                    last_agent = EXCLUDED.last_agent,
                    last_visit = EXCLUDED.last_visit,
                    latest_blob_id = EXCLUDED.latest_blob_id,
                    blob_history = EXCLUDED.blob_history,
                    updated_at = CURRENT_TIMESTAMP
            """, (wallet_hash, str(data.get("wallet_address", "")), str(data.get("summary", "")), visited_json,
                  str(data.get("last_agent", "")), str(data.get("last_visit", now)), blob_id or "", blob_history_json))
        # Track blob in on_chain_saves for per-agent display
        if blob_id:
            try:
                tx_digest = "from_memory_save_" + datetime.now().isoformat()
                agent_id = str(data.get("last_agent", ""))
                if _use_sqlite:
                    c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (?, ?, ?, ?, ?)",
                              (wallet_hash, tx_digest, blob_id, now, agent_id))
                else:
                    c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (%s, %s, %s, %s, %s)",
                              (wallet_hash, tx_digest, blob_id, now, agent_id))
                print(f"[SAVE_MEMORY] Tracked blob in on_chain_saves: {blob_id[:20]}...")
            except Exception as e2:
                print(f"[SAVE_MEMORY] on_chain_saves insert failed: {e2}")
        conn.commit()
        print(f"[SAVE_MEMORY] DB updated for {wallet_hash}, blob={blob_id}")
    except Exception as e:
        print(f"[SAVE_MEMORY] DB error: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
            finally:
                conn.close()
        if blob_id:
            return {"success": True, "blob_id": blob_id, "summary": "", "visited_agents": list(visited_agents), "cost_sui": 0, "source": "walrus_only"}
        return {"success": False, "blob_id": "", "summary": "", "visited_agents": [], "cost_sui": 0, "source": "error", "error": str(e)}
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass

    return {
        "success": True,
        "blob_id": blob_id,
        "summary": str(data.get("summary", "")),
        "visited_agents": list(visited_agents),
        "cost_sui": 0,
        "source": "walrus_db"
    }

@app.route("/api/memory/save", methods=["POST"])
def save_memory_route():
    try:
        data = request.get_json(force=True, silent=True) or {}
        wallet_hash = data.get("wallet_hash")
        if not wallet_hash:
            return jsonify({"error": "wallet_hash required"}), 400

        messages = data.get("messages") or []
        visited_agents_list = list(data.get("visited_agents") or [])

        extracted_name = ""
        try:
            extracted_name = extract_name_from_messages(messages)
        except Exception as e:
            print(f"[SAVE_ROUTE] extract_name error: {e}")

        name_saved = ""
        try:
            if extracted_name and str(extracted_name).strip():
                update_profile_name(wallet_hash, extracted_name)
                name_saved = extracted_name
            elif data.get("user_name") and str(data["user_name"]).strip():
                update_profile_name(wallet_hash, data["user_name"])
                name_saved = data["user_name"]
        except Exception as e:
            print(f"[SAVE_ROUTE] profile update error: {e}")

        result = save_memory(wallet_hash, data)
        if not isinstance(result, dict):
            result = {"success": False, "blob_id": "", "summary": "", "visited_agents": visited_agents_list, "cost_sui": 0, "source": "error"}
        return jsonify(result)
    except Exception as e:
        print(f"[SAVE_ROUTE] UNHANDLED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e), "blob_id": "", "summary": "", "visited_agents": visited_agents_list if 'visited_agents_list' in dir() else [], "cost_sui": 0, "source": "crash"}), 500
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True, silent=True) or {}
    agent_id = data.get("agent_id", "J4")
    messages = data.get("messages", [])
    memory_summary = data.get("memory_summary", "")
    user_name = data.get("user_name", "")
    wallet_hash = data.get("wallet_hash", "")

    conn = get_db_conn()
    c = conn.cursor()
    if _use_sqlite:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
    else:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
    row = c.fetchone()
    conn.close()

    db_name = row[0] if row else ""
    final_name = db_name or user_name or ""

    response = call_deepseek(agent_id, messages, memory_summary, final_name, wallet_hash)

    if response:
        return jsonify({"response": response, "source": "ai", "name_used": final_name})
    return jsonify({"response": "I'm " + agent_id + ". Network glitching but I'm still here.", "source": "fallback", "name_used": final_name})


@app.route("/api/profile/get/<wallet_hash>", methods=["GET"])
def profile_get(wallet_hash):
    """Get full profile settings"""
    try:
        profile = get_profile_settings(wallet_hash)
        if not profile:
            return jsonify({
                "success": True,
                "exists": False,
                "profile": None
            })

        return jsonify({
            "success": True,
            "exists": True,
            "profile": profile
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/profile/update", methods=["POST"])
def profile_update():
    """Update profile settings"""
    try:
        data = request.json
        wallet_hash = data.get("wallet_hash")

        if not wallet_hash:
            return jsonify({"success": False, "error": "wallet_hash required"}), 400

        # Fields that can be updated
        allowed_fields = ["bio", "profile_pic", "twitter", "discord", "telegram", "instagram", "website"]
        updates = {}
        for field in allowed_fields:
            if field in data:
                updates[field] = data[field]

        if not updates:
            return jsonify({"success": False, "error": "No valid fields to update"}), 400

        success = update_profile_settings(wallet_hash, updates)

        if success:
            return jsonify({
                "success": True,
                "updated": True,
                "fields_updated": list(updates.keys()),
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({"success": False, "error": "Update failed"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/profile/create", methods=["POST"])
def profile_create():
    """Create new profile with name"""
    try:
        data = request.json
        wallet_hash = data.get("wallet_hash")
        wallet_address = data.get("wallet_address", "")
        user_name = data.get("user_name", "")

        if not wallet_hash:
            return jsonify({"success": False, "error": "wallet_hash required"}), 400

        # Check if exists
        conn = get_db_conn()
        c = conn.cursor()
        if _use_sqlite:
            c.execute("SELECT wallet_hash FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        else:
            c.execute("SELECT wallet_hash FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        existing = c.fetchone()
        conn.close()

        if existing:
            return jsonify({"success": False, "error": "Profile already exists", "exists": True}), 409

        # Create profile
        profile = get_or_create_profile(wallet_hash, wallet_address)
        if user_name:
            update_profile_name(wallet_hash, user_name)

        return jsonify({
            "success": True,
            "created": True,
            "wallet_hash": wallet_hash,
            "name": user_name,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 
# WALRUS ENDPOINTS
# 

@app.route("/api/walrus/store-direct", methods=["POST"])
def walrus_store_direct():
    """Frontend proxy to Walrus - handles DNS/CORS issues"""
    try:
        data = request.get_json()
        # Accept both formats: {data: ...} or {chat_history: ..., wallet_hash: ..., agent_id: ...}
        payload_data = data.get("data") or {
            "wallet_hash": data.get("wallet_hash", ""),
            "chat_history": data.get("chat_history", []),
            "agent_id": data.get("agent_id", ""),
            "timestamp": data.get("timestamp", datetime.now().isoformat())
        }
        epochs = data.get("epochs", 1)

        if not payload_data:
            return jsonify({"success": False, "error": "No data or payload provided"}), 400
        
        # Encrypt + compress
        payload_str = json.dumps(payload_data)
        encrypted = encrypt(payload_str)
        payload_bytes = encrypted.encode("utf-8")

        # Try mainnet first, fallback testnet
        blob_id = None
        cost_mist = 0
        is_new = False
        last_error = ""
        actual_network = "unknown"
        actual_aggregator = WALRUS_AGGREGATOR  # default mainnet

        for publisher, label in [(WALRUS_PUBLISHER_MAINNET, "mainnet"), (WALRUS_PUBLISHER_TESTNET, "testnet")]:
            try:
                res = requests.put(
                    f"{publisher}/v1/blobs?epochs={epochs}",
                    data=payload_bytes,
                    headers={"Content-Type": "application/octet-stream"},
                    timeout=30
                )

                if res.status_code in [200, 202]:
                    result = res.json()
                    if "newlyCreated" in result:
                        blob_id = result["newlyCreated"]["blobObject"]["blobId"]
                        cost_mist = result["newlyCreated"].get("cost", 0)
                        is_new = True
                        actual_network = label
                        actual_aggregator = WALRUS_AGGREGATOR if label == "mainnet" else "https://aggregator.walrus-testnet.walrus.space"
                        print(f"[WALRUS_DIRECT]  {label}: {blob_id[:20]}...")
                        break
                    elif "alreadyCertified" in result:
                        blob_id = result["alreadyCertified"]["blobId"]
                        is_new = False
                        actual_network = label
                        actual_aggregator = WALRUS_AGGREGATOR if label == "mainnet" else "https://aggregator.walrus-testnet.walrus.space"
                        print(f"[WALRUS_DIRECT]  {label} existing: {blob_id[:20]}...")
                        break
                else:
                    last_error = f"{label} HTTP {res.status_code}"

            except Exception as e:
                last_error = f"{label}: {str(e)[:80]}"
                continue

        if not blob_id:
            return jsonify({
                "success": False,
                "error": f"All publishers failed. Last: {last_error}",
                "fallback": "db_only"
            }), 200

        return jsonify({
            "success": True,
            "blob_id": blob_id,
            "cost_sui": cost_mist / 1000000000,
            "cost_mist": cost_mist,
            "is_new": is_new,
            "url": f"{actual_aggregator}/v1/blobs/{blob_id}",  #  correct URL
            "network": actual_network,  #  "mainnet" atau "testnet"
            "raw": result
        })

    except Exception as e:
        print(f"[WALRUS_DIRECT] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/walrus/load-chat/<wallet_hash>", methods=["GET"])
def walrus_load_chat(wallet_hash):
    """Load chat history from Walrus - reads all blobs"""
    conn = get_db_conn()
    c = conn.cursor()
    try:
        if _use_sqlite:
            c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = ? AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 20", (wallet_hash,))
        else:
            c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = %s AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 20", (wallet_hash,))
        rows = c.fetchall()
    except:
        rows = []
    finally:
        conn.close()

    all_chats = []
    all_blob_ids = []

    for r in rows:
        if r and r[0]:
            bid = r[0]
            all_blob_ids.append(bid)
            data = walrus_read(bid)
            if data:
                if isinstance(data, dict):
                    chats = data.get("chat_history", data.get("messages", []))
                elif isinstance(data, list):
                    chats = data
                else:
                    chats = []
                if chats:
                    all_chats.extend(chats)

    return jsonify({
        "success": True,
        "chat_history": all_chats,
        "blob_ids": all_blob_ids,
        "count": len(all_chats)
    })

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

    if _use_sqlite:
        c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (?, ?, ?, ?, ?)",
                  (wallet_hash, tx_digest, blob_id, datetime.now().isoformat(), data.get("agent_id", "")))
    else:
        c.execute("INSERT INTO on_chain_saves (wallet_hash, tx_digest, blob_id, timestamp, agent_id) VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s)",
                  (wallet_hash, tx_digest, blob_id, data.get("agent_id", "")))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "tx_digest": tx_digest, "blob_id": blob_id, "indexed": True})



@app.route("/api/walrus/read/<blob_id>", methods=["GET"])
def walrus_read(blob_id):
    """Read and decrypt blob from Walrus"""
    try:
        # Walrus aggregator URLs
        aggregators = [
            f"https://aggregator.walrus-testnet.com/v1/{blob_id}",
            f"https://wal-aggregator-testnet.stardust-network.com/v1/{blob_id}",
            f"https://walrus-testnet.blob.store/v1/{blob_id}"
        ]
        for url in aggregators:
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    try:
                        data = r.json()
                    except:
                        data = r.text
                    return data
            except:
                continue
        print(f"[WALRUS_READ] Failed to read {blob_id}")
        return None
    except Exception as e:
        print(f"[WALRUS_READ] Error: {e}")
        return None


def walrus_read_direct(blob_id):
    """Read blob from Walrus via backend"""
    try:
        res = requests.get(
            f"{WALRUS_AGGREGATOR}/v1/blobs/{blob_id}",
            timeout=60
        )

        if res.status_code != 200:
            return jsonify({
                "success": False,
                "error": f"Walrus HTTP {res.status_code}"
            }), 500

        encrypted_data = res.content.decode("utf-8")
        decrypted = decrypt(encrypted_data)

        if not decrypted:
            return jsonify({"success": False, "error": "Decryption failed"}), 500

        data = json.loads(decrypted)

        return jsonify({
            "success": True,
            "data": data
        })

    except Exception as e:
        print(f"[WALRUS_READ_DIRECT] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
# 
# MEMWAL INTEGRATION (via HTTP API - no npm dependency)
# 

MEMWAL_RELAYER = "https://relayer.memwal.ai"
MEMWAL_NAMESPACE = "riot-chat-wallet"
MEMWAL_DELEGATE_KEY = os.environ.get("MEMWAL_DELEGATE_KEY", "")
MEMWAL_ACCOUNT_ID = os.environ.get("MEMWAL_ACCOUNT_ID", "")

def memwal_api_call(endpoint, method="GET", payload=None):
    """Call MemWal relayer API directly via HTTP"""
    try:
        url = f"{MEMWAL_RELAYER}/{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "X-MemWal-Delegate-Key": MEMWAL_DELEGATE_KEY,
            "X-MemWal-Account-Id": MEMWAL_ACCOUNT_ID,
            "X-MemWal-Namespace": MEMWAL_NAMESPACE
        }

        if method == "POST":
            res = requests.post(url, headers=headers, json=payload, timeout=30)
        else:
            res = requests.get(url, headers=headers, params=payload, timeout=30)

        if res.status_code in [200, 202]:
            return res.json()
        print(f"[MEMWAL_API] Error {res.status_code}: {res.text[:200]}")
        return None
    except Exception as e:
        print(f"[MEMWAL_API] Exception: {e}")
        return None

@app.route("/api/memwal/status", methods=["GET"])
def memwal_status():
    """Check MemWal connection status"""
    try:
        result = memwal_api_call("health")
        if result:
            return jsonify({"ready": True, "status": "connected", "relayer": MEMWAL_RELAYER})
        return jsonify({"ready": False, "status": "disconnected", "error": "Relayer unreachable"})
    except Exception as e:
        return jsonify({"ready": False, "status": "error", "error": str(e)})

@app.route("/api/memwal/save", methods=["POST"])
def memwal_save():
    """Save memory to MemWal via relayer"""
    try:
        data = request.json
        wallet_address = data.get("wallet_address", "")
        agent_id = data.get("agent_id", "")
        messages = data.get("messages", [])

        # Build payload for MemWal
        payload = {
            "text": json.dumps({
                "wallet_address": wallet_address,
                "agent_id": agent_id,
                "messages": messages,
                "timestamp": data.get("timestamp", datetime.now().isoformat()),
                "message_count": data.get("message_count", len(messages))
            }),
            "metadata": {
                "wallet_address": wallet_address,
                "agent_id": agent_id,
                "source": "riot-chat-wallet"
            }
        }

        result = memwal_api_call("remember", method="POST", payload=payload)

        if result and result.get("job_id"):
            # Poll for completion
            job_id = result["job_id"]
            for _ in range(10):  # Max 10 retries
                status = memwal_api_call(f"jobs/{job_id}")
                if status and status.get("status") == "completed":
                    return jsonify({
                        "success": True,
                        "blob_id": status.get("blob_id", ""),
                        "job_id": job_id,
                        "status": "completed"
                    })
                import time
                time.sleep(0.5)

            return jsonify({
                "success": True,
                "job_id": job_id,
                "status": "pending",
                "message": "MemWal job submitted"
            })

        # Fallback: save to local Walrus directly
        fallback_blob = None
        try:
            blob_data = {
                "wallet_hash": data.get("wallet_address", ""),
                "messages": data.get("messages", []),
                "agent_id": data.get("agent_id", ""),
                "timestamp": data.get("timestamp", datetime.now().isoformat())
            }
            r = requests.post("https://publisher.walrus-testnet.com/v1/store?epochs=5", json=blob_data, timeout=15)
            if r.status_code == 200:
                blob_info = r.json()
                fallback_blob = blob_info.get("newlyCreated", {}).get("blobObject", {}).get("blobId", 
                    blob_info.get("alreadyCertified", {}).get("blobId", ""))
        except Exception as e2:
            print(f"[MEMWAL_SAVE] Fallback error: {e2}")
        return jsonify({
            "success": fallback_blob is not None,
            "blob_id": fallback_blob or "",
            "source": "walrus_fallback",
            "memwal_error": "Relayer failed, used fallback"
        })

    except Exception as e:
        print(f"[MEMWAL_SAVE] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/memwal/search", methods=["GET"])
def memwal_search():
    """Semantic search via MemWal"""
    try:
        query = request.args.get("query", "")
        limit = int(request.args.get("limit", 5))

        if not query:
            return jsonify({"results": []})

        result = memwal_api_call("recall", payload={"query": query, "limit": limit})

        if result and "results" in result:
            return jsonify({
                "success": True,
                "results": result["results"],
                "query": query,
                "count": len(result["results"])
            })

        return jsonify({"results": [], "error": "No results from MemWal"})

    except Exception as e:
        print(f"[MEMWAL_SEARCH] Error: {e}")
        return jsonify({"results": [], "error": str(e)})

@app.route("/api/memwal/analyze", methods=["POST"])
def memwal_analyze():
    """Analyze text and extract facts"""
    try:
        data = request.json
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "text required"}), 400

        result = memwal_api_call("analyze", method="POST", payload={"text": text})

        if result:
            return jsonify({
                "success": True,
                "facts": result.get("facts", []),
                "fact_count": result.get("fact_count", 0)
            })

        return jsonify({"success": False, "error": "Analysis failed"})

    except Exception as e:
        print(f"[MEMWAL_ANALYZE] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# 
# MOVE CONTRACT ENDPOINTS
# 

@app.route("/api/move/tx-index", methods=["POST"])
def move_tx_index():
    """Index tx digest from Move contract store_memory call"""
    try:
        data = request.json
        wallet_hash = data.get("wallet_hash")
        tx_digest = data.get("tx_digest")
        blob_id = data.get("blob_id", "")
        object_id = data.get("object_id", "")
        agent_id = data.get("agent_id", "")
        package_id = data.get("package_id", "")

        if not wallet_hash or not tx_digest:
            return jsonify({"error": "wallet_hash and tx_digest required"}), 400

        conn = get_db_conn()
        c = conn.cursor()

        if _use_sqlite:
            c.execute("""
                INSERT INTO on_chain_saves (wallet_hash, tx_digest, object_id, blob_id, timestamp, agent_id, data_size)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (wallet_hash, tx_digest, object_id, blob_id, datetime.now().isoformat(), agent_id, 0))
        else:
            c.execute("""
                INSERT INTO on_chain_saves (wallet_hash, tx_digest, object_id, blob_id, timestamp, agent_id, data_size)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, %s, %s)
            """, (wallet_hash, tx_digest, object_id, blob_id, agent_id, 0))

        conn.commit()
        conn.close()

        print(f"[MOVE] Indexed tx: {tx_digest[:20]}... object: {object_id[:20]}...")

        return jsonify({
            "success": True,
            "tx_digest": tx_digest,
            "object_id": object_id,
            "blob_id": blob_id,
            "package_id": package_id,
            "indexed": True
        })

    except Exception as e:
        print(f"[MOVE] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/move/objects/<wallet_hash>", methods=["GET"])
def move_get_objects(wallet_hash):
    """Get all Move contract objects for wallet"""
    try:
        conn = get_db_conn()
        c = conn.cursor()

        if _use_sqlite:
            c.execute("""
                SELECT tx_digest, object_id, blob_id, agent_id, timestamp
                FROM on_chain_saves
                WHERE wallet_hash = ? AND tx_digest IS NOT NULL AND tx_digest != ''
                ORDER BY timestamp DESC
            """, (wallet_hash,))
        else:
            c.execute("""
                SELECT tx_digest, object_id, blob_id, agent_id, timestamp
                FROM on_chain_saves
                WHERE wallet_hash = %s AND tx_digest IS NOT NULL AND tx_digest != ''
                ORDER BY timestamp DESC
            """, (wallet_hash,))

        rows = c.fetchall()
        conn.close()

        objects = []
        for row in rows:
            objects.append({
                "tx_digest": row[0],
                "object_id": row[1],
                "blob_id": row[2],
                "agent_id": row[3],
                "timestamp": row[4] if _use_sqlite else (row[4].isoformat() if row[4] else "")
            })

        return jsonify({
            "success": True,
            "wallet_hash": wallet_hash,
            "objects": objects,
            "count": len(objects)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 
# MAIN
# 
@app.route("/api/move/gas-estimate", methods=["POST"])
def move_gas_estimate():
    try:
        data = request.json
        message_count = data.get("message_count", 1)

        base_gas_mist = 8000000
        per_message_mist = 3000000
        total_mist = base_gas_mist + (per_message_mist * message_count)
        total_sui = total_mist / 1000000000.0

        return jsonify({
            "success": True,
            "estimated_gas_sui": round(total_sui, 4),
            "estimated_gas_mist": total_mist,
            "currency": "SUI",
            "message_count": message_count,
            "breakdown": {
                "base_sui": round(base_gas_mist / 1000000000.0, 4),
                "per_message_sui": round(per_message_mist / 1000000000.0, 4),
                "total_sui": round(total_sui, 4)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# 
# TATUM ANALYTICS DASHBOARD - NEW FOR HACKATHON
# 

@app.route("/api/tatum/dashboard", methods=["GET"])
def tatum_dashboard():
    """Aggregate dashboard stats using Tatum RPC + local DB"""
    try:
        # Get total TX count from local DB
        conn = get_db_conn()
        c = conn.cursor()

        if _use_sqlite:
            c.execute("SELECT COUNT(*) FROM on_chain_saves")
            total_tx = c.fetchone()[0]

            c.execute("SELECT COUNT(DISTINCT wallet_hash) FROM on_chain_saves")
            unique_users = c.fetchone()[0]

            c.execute("SELECT COUNT(DISTINCT agent_id) FROM on_chain_saves WHERE agent_id IS NOT NULL AND agent_id != ''")
            active_agents = c.fetchone()[0]

            c.execute("SELECT SUM(data_size) FROM on_chain_saves")
            total_data = c.fetchone()[0] or 0
        else:
            c.execute("SELECT COUNT(*) FROM on_chain_saves")
            total_tx = c.fetchone()[0]

            c.execute("SELECT COUNT(DISTINCT wallet_hash) FROM on_chain_saves")
            unique_users = c.fetchone()[0]

            c.execute("SELECT COUNT(DISTINCT agent_id) FROM on_chain_saves WHERE agent_id IS NOT NULL AND agent_id != ''")
            active_agents = c.fetchone()[0]

            c.execute("SELECT SUM(data_size) FROM on_chain_saves")
            total_data = c.fetchone()[0] or 0

        conn.close()

        # Get recent TX (last 24h)
        recent_tx = get_recent_transactions()

        return jsonify({
            "success": True,
            "stats": {
                "total_transactions": total_tx,
                "unique_users": unique_users,
                "active_agents": active_agents,
                "total_data_bytes": total_data,
                "total_data_mb": round(total_data / (1024 * 1024), 2),
                "network": "Sui Mainnet",
                "rpc_provider": "Tatum" if TATUM_API_KEY else "Sui Public"
            },
            "recent_tx": recent_tx,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        print(f"[TATUM_DASHBOARD] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/tatum/tx-history", methods=["GET"])
def tatum_tx_history():
    """Get TX history for chart (last 7 days)"""
    try:
        days = int(request.args.get("days", 7))

        conn = get_db_conn()
        c = conn.cursor()

        history = []
        for i in range(days - 1, -1, -1):
            if _use_sqlite:
                from datetime import timedelta
                date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
                c.execute("""
                    SELECT COUNT(*), COALESCE(SUM(data_size), 0)
                    FROM on_chain_saves
                    WHERE DATE(timestamp) = ?
                """, (date,))
            else:
                from datetime import timedelta
                date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
                c.execute("""
                    SELECT COUNT(*), COALESCE(SUM(data_size), 0)
                    FROM on_chain_saves
                    WHERE DATE(timestamp) = %s
                """, (date,))

            row = c.fetchone()
            history.append({
                "date": date,
                "transactions": row[0],
                "data_size": row[1] or 0
            })

        conn.close()

        return jsonify({
            "success": True,
            "history": history,
            "days": days
        })

    except Exception as e:
        print(f"[TATUM_TX_HISTORY] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/tatum/live-feed", methods=["GET"])
def tatum_live_feed():
    """Get recent TX feed with SuiScan links"""
    try:
        limit = int(request.args.get("limit", 10))

        conn = get_db_conn()
        c = conn.cursor()

        if _use_sqlite:
            c.execute("""
                SELECT wallet_hash, tx_digest, object_id, blob_id, agent_id, timestamp, data_size
                FROM on_chain_saves
                WHERE tx_digest IS NOT NULL AND tx_digest != ''
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
        else:
            c.execute("""
                SELECT wallet_hash, tx_digest, object_id, blob_id, agent_id, timestamp, data_size
                FROM on_chain_saves
                WHERE tx_digest IS NOT NULL AND tx_digest != ''
                ORDER BY timestamp DESC
                LIMIT %s
            """, (limit,))

        rows = c.fetchall()
        conn.close()

        feed = []
        for row in rows:
            tx_digest = row[1] or ""
            feed.append({
                "wallet_hash": row[0][:8] + "..." if row[0] else "",
                "tx_digest": tx_digest,
                "tx_digest_short": tx_digest[:16] + "..." if len(tx_digest) > 16 else tx_digest,
                "suiscan_url": f"https://suiscan.xyz/mainnet/tx/{tx_digest}" if tx_digest else "",
                "object_id": row[2] or "",
                "blob_id": row[3] or "",
                "agent_id": row[4] or "",
                "timestamp": row[5] if _use_sqlite else (row[5].isoformat() if row[5] else ""),
                "data_size": row[6] or 0
            })

        return jsonify({
            "success": True,
            "feed": feed,
            "count": len(feed)
        })

    except Exception as e:
        print(f"[TATUM_LIVE_FEED] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/tatum/wallet-stats/<wallet_hash>", methods=["GET"])
def tatum_wallet_stats(wallet_hash):
    """Get stats for specific wallet"""
    try:
        conn = get_db_conn()
        c = conn.cursor()

        if _use_sqlite:
            c.execute("SELECT COUNT(*) FROM on_chain_saves WHERE wallet_hash = ?", (wallet_hash,))
            tx_count = c.fetchone()[0]

            c.execute("SELECT SUM(data_size) FROM on_chain_saves WHERE wallet_hash = ?", (wallet_hash,))
            data_used = c.fetchone()[0] or 0

            c.execute("SELECT COUNT(DISTINCT agent_id) FROM on_chain_saves WHERE wallet_hash = ? AND agent_id IS NOT NULL", (wallet_hash,))
            agents_visited = c.fetchone()[0]

            c.execute("SELECT MAX(timestamp) FROM on_chain_saves WHERE wallet_hash = ?", (wallet_hash,))
            last_active = c.fetchone()[0]
        else:
            c.execute("SELECT COUNT(*) FROM on_chain_saves WHERE wallet_hash = %s", (wallet_hash,))
            tx_count = c.fetchone()[0]

            c.execute("SELECT SUM(data_size) FROM on_chain_saves WHERE wallet_hash = %s", (wallet_hash,))
            data_used = c.fetchone()[0] or 0

            c.execute("SELECT COUNT(DISTINCT agent_id) FROM on_chain_saves WHERE wallet_hash = %s AND agent_id IS NOT NULL", (wallet_hash,))
            agents_visited = c.fetchone()[0]

            c.execute("SELECT MAX(timestamp) FROM on_chain_saves WHERE wallet_hash = %s", (wallet_hash,))
            last_active = c.fetchone()[0]

        conn.close()

        # Try to get SUI balance via Tatum
        # Note: wallet_hash is hashed, we need the actual address
        # For now, return stats without balance

        return jsonify({
            "success": True,
            "wallet_hash": wallet_hash[:8] + "...",
            "stats": {
                "transactions": tx_count,
                "data_used_bytes": data_used,
                "data_used_kb": round(data_used / 1024, 2),
                "agents_visited": agents_visited,
                "last_active": last_active if _use_sqlite else (last_active.isoformat() if last_active else "")
            }
        })

    except Exception as e:
        print(f"[TATUM_WALLET_STATS] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


def get_recent_transactions(hours=24):
    """Helper: Get recent TX count"""
    try:
        conn = get_db_conn()
        c = conn.cursor()

        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(hours=hours)).isoformat()

        if _use_sqlite:
            c.execute("SELECT COUNT(*) FROM on_chain_saves WHERE timestamp > ?", (cutoff,))
        else:
            c.execute("SELECT COUNT(*) FROM on_chain_saves WHERE timestamp > %s", (cutoff,))

        count = c.fetchone()[0]
        conn.close()
        return count
    except:
        return 0




if __name__ == "__main__":
    init_db()
    migrate_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
