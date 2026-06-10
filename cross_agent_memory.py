"""
Cross Agent Memory - Shared memory bus between agents
Minimal stub for local/Render deployment
"""

def init_cross_agent_memory(get_db_conn, use_sqlite=False):
    """Initialize cross-agent memory system"""
    print("Cross-agent memory: initialized (stub mode)")
    return True

def get_cross_agent_bus():
    """Get the shared memory bus"""
    return CrossAgentBus()

class CrossAgentBus:
    """Simple in-memory bus for agent communication"""
    
    def __init__(self):
        self.channels = {}
        self.messages = []
    
    def publish(self, channel, message):
        """Publish message to channel"""
        if channel not in self.channels:
            self.channels[channel] = []
        self.channels[channel].append(message)
        self.messages.append({"channel": channel, "data": message})
        return True
    
    def subscribe(self, channel):
        """Subscribe to channel"""
        return self.channels.get(channel, [])
    
    def get_messages(self, channel=None):
        """Get messages from channel or all"""
        if channel:
            return self.channels.get(channel, [])
        return self.messages
    
    def clear(self, channel=None):
        """Clear messages"""
        if channel:
            self.channels[channel] = []
        else:
            self.channels = {}
            self.messages = []
        return True