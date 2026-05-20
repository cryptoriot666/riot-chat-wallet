const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

class RiotAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  }

  async health() {
    return this.request("/api/health");
  }

  async saveMemoryWithObject(walletAddress, agentId, messages, summary, objectId, txDigest) {
  return this.request("/api/memory/save", {
    method: "POST",
    body: JSON.stringify({
      wallet_address: walletAddress,
      agent_id: agentId,
      messages: messages.slice(-10),
      summary: summary,
      object_id: objectId,      // ← dari on-chain tx
      tx_digest: txDigest,      // ← dari on-chain tx
      timestamp: Math.floor(Date.now() / 1000)
    })
  });
}

  async chat(agentId, messages, memorySummary = "") {
    return this.request("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        agent_id: agentId,
        messages: messages,
        memory_summary: memorySummary
      })
    });
  }

  async saveMemory(walletAddress, agentId, messages, summary) {
    return this.request("/api/memory/save", {
      method: "POST",
      body: JSON.stringify({
        wallet_address: walletAddress,
        agent_id: agentId,
        messages: messages.slice(-10),
        summary: summary,
        timestamp: Math.floor(Date.now() / 1000)
      })
    });
  }

  async loadMemory(walletAddress) {
    return this.request(`/api/memory/load/${walletAddress}`);
  }

  async getSummary(walletAddress) {
    return this.request(`/api/memory/summary/${walletAddress}`);
  }

  async getStats() {
    return this.request("/api/stats");
  }
}

export const api = new RiotAPI();
