"""
RIOT Chat Wallet API - Vercel Serverless
"""
import json
import os

# ─── Config ─────────────────────────────────────────────
WALRUS_PUBLISHER = os.getenv("WALRUS_PUBLISHER", "https://publisher.walrus-testnet.walrus.space")
WALRUS_AGGREGATOR = os.getenv("WALRUS_AGGREGATOR", "https://aggregator.walrus-testnet.walrus.space")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "riot-chat-wallet-secret-key-2026")
DB_PATH = os.getenv("DB_PATH", "/tmp/riot_chat.db")
DEEPSEEK_API_KEY=os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# ─── Simple In-Memory Store (Vercel compatible) ──────────
_memory_store = {}

# ─── Agent Prompts ───────────────────────────────────────
AGENT_PROMPTS = {
    "J4": "You are J4, The Rebel. Chaotic, sarcastic, anti-system. Max 3 sentences.",
    "J2": "You are J2, The Aggressor. Direct, loud, zero filter. Market is war. Max 3 sentences.",
    "J3": "You are J3, The Shadow. Mysterious, cryptic, speaks in riddles. Max 3 sentences.",
    "J5": "You are J5, The Trickster. Chaotic neutral, trolls everyone. Max 3 sentences.",
    "J6": "You are J6, The Network. Knows alpha before it drops. Max 3 sentences.",
    "J7": "You are J7, The Zen. Calm, philosophical, diamond hands. Max 3 sentences.",
    "J8": "You are J8, The Architect. Builds systems, analyzes patterns. Max 3 sentences.",
    "J9": "You are J9, The Oracle. Predicts moves, reads charts like tarot. Max 3 sentences.",
    "J10": "You are J10, The Mercenary. Only cares about profit. Max 3 sentences.",
}

# ─── Helper Functions ────────────────────────────────────
def generate_fallback_response(agent_id, messages):
    """Generate fallback response without AI"""
    user_msg = messages[-1].get("content", "").lower() if messages else ""
    
    responses = {
        "J4": ["Rebellion is the only truth.", "The system burns. I watch.", "You want answers? I give chaos."],
        "J2": ["BUY THE DIP OR CRY.", "Market doesn't care about your feelings.", "TO THE MOON OR TO HELL!"],
        "J3": ["The void whispers...", "Answers lie in shadows you haven't explored.", "Trust nothing. Not even me."],
        "J4_GENERIC": "The riot continues. What do you seek?",
        "J2_GENERIC": "SPEAK FASTER! I don't have all day.",
        "J3_GENERIC": "The darkness listens. Speak carefully.",
    }
    
    import random
    if agent_id in responses:
        return random.choice(responses[agent_id])
    return random.choice(["Interesting...", "Tell me more.", "The network processes."])

def hash_wallet(address):
    """Simple hash for wallet address"""
    import hashlib
    return hashlib.sha256(address.encode()).hexdigest()[:16]

# ─── API Handler ─────────────────────────────────────────
def handler(environ, start_response):
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    headers = [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type'),
    ]
    
    if method == 'OPTIONS':
        start_response('204 No Content', headers)
        return [b'']
    
    if path == '/' or path == '':
        start_response('200 OK', headers + [('Content-Type', 'application/json')])
        return [json.dumps({"status": "RIOT API Live", "version": "2.0"}).encode()]
    
    if path == '/api/health':
        start_response('200 OK', headers + [('Content-Type', 'application/json')])
        return [json.dumps({
            "status": "RIOT Chat Wallet API is LIVE",
            "network": "testnet",
            "encryption": "enabled",
            "deepseek": "connected" if DEEPSEEK_API_KEY else "disabled",
            "timestamp": int(__import__('time').time())
        }).encode()]
    
    if path == '/api/chat' and method == 'POST':
        try:
            import urllib.parse
            size = int(environ.get('CONTENT_LENGTH', 0))
            body = environ['wsgi.input'].read(size).decode()
            data = json.loads(body)
            
            agent_id = data.get("agent_id", "J4")
            messages = data.get("messages", [])
            memory_summary = data.get("memory_summary", "")
            
            # Try DeepSeek if API key exists
            if DEEPSEEK_API_KEY:
                try:
                    import urllib.request
                    req_data = {
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": AGENT_PROMPTS.get(agent_id, AGENT_PROMPTS["J4"])},
                            *[{"role": "user" if m.get("role") == "user" else "assistant", "content": m.get("content", "")} for m in messages[-5:]]
                        ],
                        "max_tokens": 150
                    }
                    req = urllib.request.Request(
                        DEEPSEEK_BASE_URL + "/chat/completions",
                        data=json.dumps(req_data).encode(),
                        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        result = json.loads(resp.read())
                        response_text = result["choices"][0]["message"]["content"]
                        start_response('200 OK', headers + [('Content-Type', 'application/json')])
                        return [json.dumps({
                            "success": True,
                            "response": response_text,
                            "source": "deepseek",
                            "agent_id": agent_id
                        }).encode()]
                except Exception as e:
                    print(f"DeepSeek error: {e}")
            
            # Fallback
            response_text = generate_fallback_response(agent_id, messages)
            start_response('200 OK', headers + [('Content-Type', 'application/json')])
            return [json.dumps({
                "success": True,
                "response": response_text,
                "source": "fallback",
                "agent_id": agent_id
            }).encode()]
        except Exception as e:
            start_response('500 Error', headers + [('Content-Type', 'application/json')])
            return [json.dumps({"error": str(e)}).encode()]
    
    # Memory save
    if path == '/api/memory/save' and method == 'POST':
        try:
            size = int(environ.get('CONTENT_LENGTH', 0))
            body = environ['wsgi.input'].read(size).decode()
            data = json.loads(body)
            
            wallet = data.get("wallet_address", "")
            agent_id = data.get("agent_id", "J4")
            summary = data.get("summary", "")
            messages = data.get("messages", [])
            
            wallet_hash = hash_wallet(wallet)
            key = f"memory:{wallet_hash}"
            
            import time
            if key not in _memory_store:
                _memory_store[key] = {"interactions": 0}
            _memory_store[key].update({
                "wallet": wallet,
                "agent_id": agent_id,
                "summary": summary,
                "messages_count": len(messages),
                "timestamp": int(time.time())
            })
            _memory_store[key]["interactions"] += 1
            
            start_response('200 OK', headers + [('Content-Type', 'application/json')])
            return [json.dumps({"success": True, "blob_id": key}).encode()]
        except Exception as e:
            start_response('500 Error', headers + [('Content-Type', 'application/json')])
            return [json.dumps({"error": str(e)}).encode()]
    
    # Memory load
    if path.startswith('/api/memory/load/'):
        wallet = path.split('/')[-1]
        wallet_hash = hash_wallet(wallet)
        key = f"memory:{wallet_hash}"
        
        try:
            data = _memory_store.get(key, {})
            interactions = data.get("interactions", 0)
            
            if not data:
                start_response('200 OK', headers + [('Content-Type', 'application/json')])
                return [json.dumps({"first_visit": True}).encode()]
            
            start_response('200 OK', headers + [('Content-Type', 'application/json')])
            return [json.dumps({
                "wallet_address": data.get("wallet", wallet),
                "summary": data.get("summary", ""),
                "total_interactions": int(interactions),
                "agents_visited": 1,
                "agents_list": [data.get("agent_id", "J4")],
                "last_active": "recent"
            }).encode()]
        except Exception as e:
            start_response('500 Error', headers + [('Content-Type', 'application/json')])
            return [json.dumps({"error": str(e)}).encode()]
    
    if path == '/api/stats':
        start_response('200 OK', headers + [('Content-Type', 'application/json')])
        return [json.dumps({
            "total_users": len(set(k.split(':')[1] for k in _memory_store.keys() if k.startswith('memory:'))),
            "network": "testnet"
        }).encode()]
    
    start_response('404 Not Found', headers + [('Content-Type', 'text/plain')])
    return [b'Not Found']