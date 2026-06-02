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
CORS(app, origins=[
    "https://riot-chat-wallet.vercel.app",
    "https://riot-chat-wallet-git-main-the-riot-s-projects.vercel.app",
    "http://localhost:5173",
    "https://riot-chat-wallet-temp.vercel.app"
], supports_credentials=True)

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════
WALRUS_PUBLISHER_MAINNET = "https://publisher.walrus-mainnet.walrus.space"
WALRUS_PUBLISHER_TESTNET = "https://publisher.walrus-testnet.walrus.space"
WALRUS_AGGREGATOR = "https://aggregator.walrus-mainnet.walrus.space"
AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_API_URL = "https://api.deepseek.com/v1/chat/completions"
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
        if USE_SQLITE:
            c.execute("ALTER TABLE memories ADD COLUMN blob_history TEXT DEFAULT '[]'")
        else:
            c.execute("ALTER TABLE memories ADD COLUMN IF NOT EXISTS blob_history TEXT DEFAULT '[]'")
        conn.commit()
        print("[MIGRATE] Added blob_history column")
    except Exception as e:
        print(f"[MIGRATE] Column already exists or error: {e}")
        conn.rollback()
    finally:
        conn.close()

# ═══════════════════════════════════════════════════════════════
# ENCRYPTION
# ═══════════════════════════════════════════════════════════════
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

# ═══════════════════════════════════════════════════════════════
# NAME EXTRACTION - STRICT VERSION
# ═══════════════════════════════════════════════════════════════
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
                    print(f"[EXTRACT] ✓ '{label}': {m.group(1)}")
                    return m.group(1)

            words = content.split()
            if len(words) == 1:
                w = words[0]
                if is_valid_name(w):
                    print(f"[EXTRACT] ✓ single word: {w}")
                    return w

    print("[EXTRACT] ✗ No valid name found")
    return ""

# ═══════════════════════════════════════════════════════════════
# PROFILE MANAGEMENT - FORCE OVERWRITE
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
        print(f"[UPDATE_NAME] ✗ Skipped: empty name")
        return False

    name = name.strip()
    if not is_valid_name(name):
        print(f"[UPDATE_NAME] ✗ Rejected invalid name: '{name}'")
        return False

    print(f"[UPDATE_NAME] Saving '{name}' for {wallet_hash}")

    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
        c.execute("SELECT name FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        row = c.fetchone()
        if row:
            print(f"[UPDATE_NAME] Old name: '{row[0] or ''}' → New: '{name}'")

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
            print(f"[UPDATE_NAME] Old name: '{row[0] or ''}' → New: '{name}'")

        c.execute("""
            INSERT INTO user_profiles (wallet_hash, name, visit_count, created_at, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_hash) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
        """, (wallet_hash, name, 1))

    conn.commit()
    conn.close()
    print(f"[UPDATE_NAME] ✓ Success: '{name}' saved")
    return True

# ═══════════════════════════════════════════════════════════════
# PROFILE SETTINGS API
# ═══════════════════════════════════════════════════════════════

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

    if USE_SQLITE:
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
    print(f"[UPDATE_SETTINGS] ✓ Updated {list(updates.keys())} for {wallet_hash}")
    return True

def get_profile_settings(wallet_hash):
    """Get full profile settings"""
    conn = get_db_conn()
    c = conn.cursor()

    if USE_SQLITE:
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
        "created_at": row[11] if not USE_SQLITE and row[11] else str(row[11]) if row[11] else "",
        "updated_at": row[12] if not USE_SQLITE and row[12] else str(row[12]) if row[12] else ""
    }

# ═══════════════════════════════════════════════════════════════
# MEMORY MANAGEMENT
# ═══════════════════════════════════════════════════════════════
def load_memory(wallet_hash):
    """Load memory - Walrus source of truth, DB cache fallback"""
    print(f"[LOAD_MEMORY] Loading: {wallet_hash}")

    # Step 1: Try DB cache (fast path)
    conn = get_db_conn()
    c = conn.cursor()
    try:
        sql_cols = "wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id"
        if USE_SQLITE:
            c.execute("SELECT " + sql_cols + " FROM memories WHERE wallet_hash = ?", (wallet_hash,))
            row = c.fetchone()
        else:
            c.execute("SELECT " + sql_cols + " FROM memories WHERE wallet_hash = %s", (wallet_hash,))
            row = c.fetchone()
        db_has_data = row is not None
    except:
        row = None
        db_has_data = False

    # Step 2: Try load from Walrus (all known blobs for this wallet)
    all_blob_ids = []
    try:
        if USE_SQLITE:
            c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = ? AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 50", (wallet_hash,))
        else:
            c.execute("SELECT blob_id FROM on_chain_saves WHERE wallet_hash = %s AND blob_id IS NOT NULL ORDER BY timestamp DESC LIMIT 50", (wallet_hash,))
        all_blob_ids = [r[0] for r in c.fetchall() if r[0]]
    except:
        pass
    # Also include latest_blob_id from memories table
    if row and len(row) > 6 and row[6]:
        if row[6] not in all_blob_ids:
            all_blob_ids.append(row[6])
    # Try latest_blob_id as direct column
    try:
        if USE_SQLITE:
            c.execute("SELECT latest_blob_id FROM memories WHERE wallet_hash = ? AND latest_blob_id != ''", (wallet_hash,))
        else:
            c.execute("SELECT latest_blob_id FROM memories WHERE wallet_hash = %s AND latest_blob_id != ''", (wallet_hash,))
        extra = c.fetchone()
        if extra and extra[0] and extra[0] not in all_blob_ids:
            all_blob_ids.append(extra[0])
    except:
        pass

    conn.close()

    # Step 3: Build memory from Walrus blobs
    memory = {
        "wallet_hash": wallet_hash,
        "summary": "",
        "visited_agents": [],
        "last_agent": "",
        "last_visit": "",
        "latest_blob_id": all_blob_ids[0] if all_blob_ids else "",
        "blob_history": [],
        "visit_count": 1,
        "user_name": ""
    }

    # Load profile if exists
    try:
        conn2 = get_db_conn()
        c2 = conn2.cursor()
        if USE_SQLITE:
            c2.execute("SELECT * FROM user_profiles WHERE wallet_hash = ?", (wallet_hash,))
        else:
            c2.execute("SELECT * FROM user_profiles WHERE wallet_hash = %s", (wallet_hash,))
        profile_row = c2.fetchone()
        conn2.close()
        if profile_row:
            memory["user_name"] = profile_row[2] or ""
            memory["visit_count"] = profile_row[11] or 1
            memory["preferences"] = profile_row[10] or ""
            memory["bio"] = profile_row[3] or ""
            memory["profile_pic"] = profile_row[4] or ""
            memory["social"] = {
                "twitter": profile_row[5] or "",
                "discord": profile_row[6] or "",
                "telegram": profile_row[7] or "",
                "instagram": profile_row[8] or "",
                "website": profile_row[9] or ""
            }
    except:
        pass

    # Step 4: Read from Walrus to populate blob_history
    visited_set = set()
    for bid in all_blob_ids[:20]:  # Max 20 blobs
        walrus_data = walrus_read(bid)
        if walrus_data:
            entry = {
                "blob_id": bid,
                "agent_id": walrus_data.get("agent_id", walrus_data.get("last_agent", "J4")),
                "timestamp": walrus_data.get("timestamp", walrus_data.get("last_visit", "")),
                "network": "mainnet"
            }
            memory["blob_history"].append(entry)
            if entry["agent_id"]:
                visited_set.add(entry["agent_id"])
            if walrus_data.get("summary") and not memory["summary"]:
                memory["summary"] = walrus_data["summary"]
            if walrus_data.get("visited_agents"):
                for a in walrus_data["visited_agents"]:
                    visited_set.add(a)

    memory["visited_agents"] = list(visited_set)
    print(f"[LOAD_MEMORY] {wallet_hash}: {len(memory['blob_history'])} blobs, {len(memory['visited_agents'])} agents")

    # Step 5: Save latest blob_id back to DB for next fast load
    if memory["latest_blob_id"] and not db_has_data:
        try:
            conn3 = get_db_conn()
            c3 = conn3.cursor()
            import json as _json
            now = datetime.now().isoformat()
            bh_json = _json.dumps(memory["blob_history"])
            va_json = _json.dumps(memory["visited_agents"])
            if USE_SQLITE:
                c3.execute("INSERT OR REPLACE INTO memories (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id, blob_history, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (wallet_hash, "", memory["summary"], va_json, "", "", memory["latest_blob_id"], bh_json, now, now))
            else:
                c3.execute("INSERT INTO memories (wallet_hash, wallet_address, summary, visited_agents, last_agent, last_visit, latest_blob_id, blob_history, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (wallet_hash) DO UPDATE SET visited_agents = EXCLUDED.visited_agents, latest_blob_id = EXCLUDED.latest_blob_id, blob_history = EXCLUDED.blob_history, updated_at = CURRENT_TIMESTAMP",
                    (wallet_hash, "", memory["summary"], va_json, "", "", memory["latest_blob_id"], bh_json))
            conn3.commit()
            conn3.close()
            print(f"[LOAD_MEMORY] Seeded DB cache")
        except Exception as e:
            print(f"[LOAD_MEMORY] DB seed skipped: {e}")

    return memory


@app.route("/api/memory/load/<wallet_hash>", methods=["GET"])
def load_memory_route(wallet_hash):
    print(f"[API] Load: {wallet_hash}")
    memory = load_memory(wallet_hash)
    print(f"[API] Return: blob_history={len(memory.get('blob_history',[]))}, visited={len(memory.get('visited_agents',[]))}")
    return jsonify(memory)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "time": datetime.now().isoformat(), "walrus": "mainnet"})

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

    result = save_memory(wallet_hash, data)
    return jsonify({
        "success": result["success"],
        "blob_id": result.get("blob_id", ""),
        "name_saved": name_saved,
        "summary": result.get("summary", ""),
        "visited_agents": result.get("visited_agents", []),
        "cost_sui": result.get("cost_sui", 0),
        "source": result.get("source", "unknown")
    }), 200

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
        return jsonify({"response": response, "source": "ai", "name_used": final_name})
    return jsonify({"response": f"I'm {agent_id}. Network glitching but I'm still here.", "source": "fallback", "name_used": final_name})


@app.route("/api/profile/get/<wallet_hash>", methods=["GET"])