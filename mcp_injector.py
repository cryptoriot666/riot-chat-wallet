"""
MCP (Model Context Protocol) Injector
Injects MCP context into agent prompts
Minimal stub for local/Render deployment
"""

def inject_mcp_prompt(base_prompt, agent_id, context=None):
    """Inject MCP context into prompt"""
    mcp_context = get_agent_mcp_config(agent_id)
    if mcp_context:
        return f"{base_prompt}\n\n{mcp_context}"
    return base_prompt

def get_agent_mcp_config(agent_id):
    """Get MCP configuration for agent"""
    configs = {
        "J4": "Role: Rebel. Style: Chaotic, sarcastic. Constraints: Max 3 sentences.",
        "J1": "Role: Strategist. Style: Analytical, tactical. Constraints: Max 3 sentences.",
        "J2": "Role: Aggressor. Style: Direct, loud. Constraints: Max 3 sentences.",
        "J3": "Role: Shadow. Style: Cryptic, mysterious. Constraints: Max 3 sentences.",
        "J5": "Role: Trickster. Style: Chaotic, trolling. Constraints: Max 3 sentences.",
        "J6": "Role: Network. Style: Connected, informative. Constraints: Max 3 sentences.",
        "J7": "Role: Zen. Style: Calm, philosophical. Constraints: Max 3 sentences.",
        "J8": "Role: Architect. Style: Technical, systematic. Constraints: Max 3 sentences.",
        "J9": "Role: Oracle. Style: Prophetic, mysterious. Constraints: Max 3 sentences.",
        "J10": "Role: Mercenary. Style: Profit-focused, cold. Constraints: Max 3 sentences.",
    }
    return configs.get(agent_id, f"Role: {agent_id}. Style: Neutral. Constraints: Max 3 sentences.")

def get_available_tools(agent_id):
    """Get available tools for agent"""
    return [
        {"name": "web_search", "description": "Search the web for information"},
        {"name": "calculator", "description": "Perform calculations"},
        {"name": "memory_save", "description": "Save conversation to memory"},
        {"name": "memory_load", "description": "Load conversation from memory"},
    ]

def format_tools_for_prompt(tools):
    """Format tools list for prompt injection"""
    if not tools:
        return ""
    tool_list = "\n".join([f"- {t['name']}: {t['description']}" for t in tools])
    return f"\n\nAvailable tools:\n{tool_list}"
