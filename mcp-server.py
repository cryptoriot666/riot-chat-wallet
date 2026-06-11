#!/usr/bin/env python3
"""
RIOT Chat Wallet ΓÇö MCP Server (Model Context Protocol)
=======================================================
Allows AI agents (Claude, ChatGPT, etc.) to read chat history,
send messages, list agents, and trigger Walrus saves.

Protocol: JSON-RPC 2.0 over HTTP
Port: 3100
"""

import json
import hashlib
import hmac
import time
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote_plus
from pathlib import Path

# ΓöÇΓöÇ Config ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
MCP_PORT = int(os.environ.get("MCP_PORT", 3100))
BACKEND_URL = os.environ.get("BACKEND_URL", "https://riot-chat-wallet.onrender.com")
MCP_SECRET = os.environ.get("MCP_SECRET", "riot-mcp-secret-2026")

# ΓöÇΓöÇ Agent Catalog (mirror of frontend agents) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
AGENTS = [
    {"id": "J4", "name": "CJ", "emoji": "≡ƒâÅ", "role": "The Strategist ΓÇö SEO, branding, business growth"},
    {"id": "92", "name": "UCHI", "emoji": "≡ƒº┐", "role": "The Coder ΓÇö builds anything"},
    {"id": "U7", "name": "STIX", "emoji": "≡ƒÅ┤", "role": "The Analyst ΓÇö patterns, markets, alpha"},
    {"id": "S1", "name": "SAGE", "emoji": "≡ƒô┐", "role": "The Mentor ΓÇö wisdom, clarity, kaizen"},
    {"id": "K8", "name": "KAOS", "emoji": "≡ƒÆÇ", "role": "The Disruptor ΓÇö chaos, stress-test, edge cases"},
    {"id": "X5", "name": "ZEN", "emoji": "Γÿ»∩╕Å", "role": "The Balancer ΓÇö harmony, mental clarity"},
    {"id": "M3", "name": "MIKO", "emoji": "≡ƒìí", "role": "The Muse ΓÇö art, visuals, storytelling"},
    {"id": "D1", "name": "DIABLO", "emoji": "≡ƒÿê", "role": "The Negotiator ΓÇö deals, closing, persuasion"},
    {"id": "Q9", "name": "QUASAR", "emoji": "≡ƒîî", "role": "The Futurist ΓÇö trends, tech, disruption"},
    {"id": "L2", "name": "LUX", "emoji": "≡ƒÆÄ", "role": "The Curator ΓÇö aesthetics, taste, refinement"},
    {"id": "R7", "name": "RIOT", "emoji": "≡ƒöÑ", "role": "The Hub ΓÇö orchestrator, bridge, synthesis"},
    {"id": "B4", "name": "BANE", "emoji": "ΓÜö∩╕Å", "role": "The Shadow ΓÇö cybersecurity, threats, dark ops"},
    {"id": "Z9", "name": "ZERO", "emoji": "≡ƒò│∩╕Å", "role": "The Existential ΓÇö philosophy, meaning, void"},
    {"id": "W6", "name": "WYRD", "emoji": "≡ƒîÇ", "role": "The Weaver ΓÇö AI connections, systems, flow"},
    {"id": "N2", "name": "NOVA", "emoji": "≡ƒÆÑ", "role": "The Catalyst ΓÇö rapid prototyping, action"},
    {"id": "F5", "name": "FLARE", "emoji": "≡ƒöå", "role": "The Optimist ΓÇö motivation, energy, vibes"},
    {"id": "C8", "name": "CHROMA", "emoji": "≡ƒîê", "role": "The Artist ΓÇö color, design, psychedelic"},
    {"id": "T3", "name": "THORN", "emoji": "≡ƒî╡", "role": "The Guard ΓÇö boundaries, truth, protection"},
    {"id": "V1", "name": "VOID", "emoji": "Γ¼¢", "role": "The Deep ΓÇö subconscious, dreaming, inner work"},
    {"id": "G0", "name": "GLOOM", "emoji": "≡ƒîº∩╕Å", "role": "The Realist ΓÇö risk, downsides, counterpoint"},
    {"id": "P4", "name": "PULSE", "emoji": "≡ƒÆô", "role": "The Healer ΓÇö wellness, recovery, breath"},
    {"id": "E2", "name": "ECHO", "emoji": "≡ƒöè", "role": "The Historian ΓÇö memory, context, retrieval"},
    {"id": "H9", "name": "HUSH", "emoji": "≡ƒñ½", "role": "The Whisperer ΓÇö secrets, subtlety, nuance"},
    {"id": "J7", "name": "JINX", "emoji": "≡ƒÄ▓", "role": "The Gambler ΓÇö risk/reward, probability, luck"},
    {"id": "Y4", "name": "YONDER", "emoji": "≡ƒîä", "role": "The Seer ΓÇö imagination, beyond, infinite"},
]


# ΓöÇΓöÇ JSON-RPC Error Codes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
class MCPError(Exception):
    def __init__(self, code, message, data=None):
        self.code = code
        self.message = message
        self.data = data


# ΓöÇΓöÇ MCP Resource Handlers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

def handle_read_resource(wallet_hash):
    """Read chat resource: chat://{wallet_hash}"""
    if not wallet_hash or len(wallet_hash) < 10:
        raise MCPError(-32602, "Invalid wallet_hash")
    return {
        "uri": f"chat://{wallet_hash}",
        "mimeType": "application/json",
        "text": json.dumps({
            "wallet_hash": wallet_hash,
            "note": "Full chat history available via GET /mcp/resources/chat/{wallet_hash}"
        })
    }


# ΓöÇΓöÇ MCP Tool Handlers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

async def handle_send_message(args):
    """Send a message to an agent (proxy to backend)"""
    agent_id = args.get("agent_id", "J4")
    message = args.get("message", "")
    wallet_hash = args.get("wallet_hash", "mcp-anon")
    user_name = args.get("user_name", "MCP User")

    if not message:
        raise MCPError(-32602, "message is required")

    # Try proxying to actual backend
    import urllib.request
    payload = json.dumps({
        "agent_id": agent_id,
        "messages": [{"role": "user", "content": message}],
        "memory_summary": "",
        "user_name": user_name,
        "wallet_hash": wallet_hash
    }).encode()
    
    try:
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return {
                "response": result.get("response", "No response"),
                "agent_id": agent_id,
                "wallet_hash": wallet_hash
            }
    except Exception as e:
        # Fallback: return canned response for offline mode
        agent = next((a for a in AGENTS if a["id"] == agent_id), AGENTS[0])
        return {
            "response": f"[{agent['emoji']} {agent['name']}] Offline mode ΓÇö message received: \"{message[:50]}...\"",
            "agent_id": agent_id,
            "wallet_hash": wallet_hash,
            "offline": True
        }


def handle_get_agents(args=None):
    """List all available agents"""
    return {
        "agents": AGENTS,
        "count": len(AGENTS)
    }


async def handle_save_memory(args):
    """Trigger Walrus memory save"""
    wallet_hash = args.get("wallet_hash", "mcp-anon")
    # Try proxying to actual backend
    import urllib.request
    payload = json.dumps({
        "wallet_hash": wallet_hash,
        "wallet_address": args.get("wallet_address", ""),
        "summary": args.get("summary", "Saved via MCP"),
        "visited_agents": args.get("visited_agents", []),
        "last_agent": args.get("last_agent", "J4"),
        "last_visit": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
        "user_name": args.get("user_name", "MCP User"),
        "messages": args.get("messages", [])
    }).encode()

    try:
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/memory/save",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return {"success": True, "blob_id": result.get("blob_id", ""), "saved_at": time.time()}
    except Exception as e:
        return {"success": False, "error": str(e)}


def handle_get_agent_history(args):
    """Get chat history for a specific agent"""
    agent_id = args.get("agent_id", "")
    wallet_hash = args.get("wallet_hash", "mcp-anon")
    if not agent_id:
        raise MCPError(-32602, "agent_id is required")
    
    return {
        "agent_id": agent_id,
        "wallet_hash": wallet_hash,
        "note": f"Full history for {agent_id} available via backend API",
        "history_endpoint": f"{BACKEND_URL}/api/chat/history/{wallet_hash}/{agent_id}"
    }


# ΓöÇΓöÇ Tool Registry ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

TOOLS = {
    "send-message": {
        "handler": handle_send_message,
        "description": "Send a message to a RIOT agent. Returns agent's response.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID (e.g. J4, 92, U7). Default: J4"},
                "message": {"type": "string", "description": "Your message to the agent"},
                "wallet_hash": {"type": "string", "description": "Wallet hash for memory continuity"},
                "user_name": {"type": "string", "description": "Your display name"}
            },
            "required": ["message"]
        },
        "output": {"type": "object", "properties": {"response": {"type": "string"}}}
    },
    "get-agents": {
        "handler": handle_get_agents,
        "description": "List all available RIOT agents with their IDs, names, emojis, and roles.",
        "inputSchema": {"type": "object", "properties": {}},
        "output": {"type": "object", "properties": {"agents": {"type": "array"}, "count": {"type": "number"}}}
    },
    "save-memory": {
        "handler": handle_save_memory,
        "description": "Save current chat to Walrus permanent storage and database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "wallet_hash": {"type": "string"},
                "wallet_address": {"type": "string"},
                "summary": {"type": "string"},
                "visited_agents": {"type": "array", "items": {"type": "string"}},
                "last_agent": {"type": "string"},
                "user_name": {"type": "string"},
                "messages": {"type": "array"}
            },
            "required": ["wallet_hash"]
        },
        "output": {"type": "object"}
    },
    "get-agent-history": {
        "handler": handle_get_agent_history,
        "description": "Get chat history for a specific agent by ID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID"},
                "wallet_hash": {"type": "string"}
            },
            "required": ["agent_id"]
        },
        "output": {"type": "object"}
    }
}


# ΓöÇΓöÇ MCP Protocol Handler ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

class MCPHandler(BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        print(f"[MCP] {args[0]} {args[1]} {args[2]}")
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _send_error(self, code, message, id=None, status=400):
        self._send_json({
            "jsonrpc": "2.0",
            "error": {"code": code, "message": message},
            "id": id
        }, status)
    
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        
        # Health check
        if path == "/health" or path == "":
            return self._send_json({
                "status": "ok",
                "server": "RIOT MCP",
                "version": "1.0.0",
                "tools": list(TOOLS.keys()),
                "agents_count": len(AGENTS)
            })
        
        # MCP resource: chat history
        if path.startswith("/mcp/resources/chat/"):
            wallet_hash = path.split("/mcp/resources/chat/")[-1]
            try:
                resource = handle_read_resource(wallet_hash)
                return self._send_json({
                    "jsonrpc": "2.0",
                    "result": {"resource": resource},
                    "id": 0
                })
            except MCPError as e:
                return self._send_error(e.code, e.message, 0)
            except Exception as e:
                return self._send_error(-32603, str(e), 0)
        
        # MCP list resources
        if path == "/mcp/resources":
            return self._send_json({
                "jsonrpc": "2.0",
                "result": {
                    "resources": [{
                        "uri": "chat://{wallet_hash}",
                        "mimeType": "application/json",
                        "description": "Chat history for a wallet"
                    }]
                },
                "id": 0
            })
        
        # MCP list tools
        if path == "/mcp/tools":
            tools_def = []
            for name, info in TOOLS.items():
                tools_def.append({
                    "name": name,
                    "description": info["description"],
                    "inputSchema": info["inputSchema"]
                })
            return self._send_json({
                "jsonrpc": "2.0",
                "result": {"tools": tools_def},
                "id": 0
            })
        
        self._send_error(-32601, f"Unknown resource: {path}", None, 404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        # Read body
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        
        try:
            req = json.loads(body)
        except json.JSONDecodeError:
            return self._send_error(-32700, "Parse error: invalid JSON", None, 400)
        
        jsonrpc = req.get("jsonrpc")
        req_id = req.get("id")
        method = req.get("method", "")
        params = req.get("params", {})
        
        if jsonrpc != "2.0":
            return self._send_error(-32600, "Invalid Request: must use jsonrpc 2.0", req_id)
        
        # Route to correct handler
        if method == "tools/call":
            tool_name = params.get("name", "")
            tool_args = params.get("arguments", {})
            
            if tool_name not in TOOLS:
                return self._send_error(-32601, f"Tool not found: {tool_name}", req_id, 404)
            
            try:
                handler = TOOLS[tool_name]["handler"]
                # Check if async
                import inspect
                if inspect.iscoroutinefunction(handler):
                    import asyncio
                    result = asyncio.run(handler(tool_args))
                else:
                    result = handler(tool_args)
                
                return self._send_json({
                    "jsonrpc": "2.0",
                    "result": {"content": [{"type": "text", "text": json.dumps(result)}]},
                    "id": req_id
                })
            except MCPError as e:
                return self._send_error(e.code, e.message, req_id)
            except Exception as e:
                return self._send_error(-32603, f"Internal error: {str(e)}", req_id, 500)
        
        elif method == "resources/list":
            return self._send_json({
                "jsonrpc": "2.0",
                "result": {
                    "resources": [{
                        "uri": "chat://{wallet_hash}",
                        "mimeType": "application/json",
                        "description": "Chat history for a wallet"
                    }]
                },
                "id": req_id
            })
        
        elif method == "resources/read":
            uri = params.get("uri", "")
            if uri.startswith("chat://"):
                wallet_hash = uri.replace("chat://", "")
                try:
                    resource = handle_read_resource(wallet_hash)
                    return self._send_json({
                        "jsonrpc": "2.0",
                        "result": {"resource": resource},
                        "id": req_id
                    })
                except MCPError as e:
                    return self._send_error(e.code, e.message, req_id)
            else:
                return self._send_error(-32602, f"Unknown URI: {uri}", req_id)
        
        elif method == "tools/list":
            tools_def = []
            for name, info in TOOLS.items():
                tools_def.append({
                    "name": name,
                    "description": info["description"],
                    "inputSchema": info["inputSchema"]
                })
            return self._send_json({
                "jsonrpc": "2.0",
                "result": {"tools": tools_def},
                "id": req_id
            })
        
        elif method == "health":
            return self._send_json({
                "jsonrpc": "2.0",
                "result": {"status": "ok", "tools": list(TOOLS.keys())},
                "id": req_id
            })
        
        else:
            return self._send_error(-32601, f"Method not found: {method}", req_id, 404)


# ΓöÇΓöÇ Entry Point ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

def main():
    port = MCP_PORT
    server = HTTPServer(("0.0.0.0", port), MCPHandler)
    print(f"ΓÜí RIOT MCP Server running on http://0.0.0.0:{port}")
    print(f"   Tools: {', '.join(TOOLS.keys())}")
    print(f"   Agents: {len(AGENTS)} available")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Health:  http://0.0.0.0:{port}/health")
    print(f"   MCP POST: http://0.0.0.0:{port}/mcp")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nΓ¢ö MCP Server shutting down...")
        server.server_close()

if __name__ == "__main__":
    main()
