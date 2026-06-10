// MemWal React Integration for RIOT Chat Wallet
// Hooks and components to replace custom Walrus storage

import { useState, useCallback, useEffect } from "react";
import { initMemWal, memwalRemember, memwalRecall, memwalAnalyze, memwalCrossAgentRecall } from "./memwal-client";

const API_BASE = import.meta.env.VITE_API_URL || "https://riot-chat-wallet.onrender.com";

/**
 * Hook: useMemWal()
 * Manages MemWal connection and provides save/recall functions
 */
export function useMemWal(walletAddress) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Initialize MemWal when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setIsReady(false);
      return;
    }

    const setup = async () => {
      try {
        // Load credentials from env
        const delegateKey = import.meta.env.VITE_MEMWAL_DELEGATE_KEY;
        const accountId = import.meta.env.VITE_MEMWAL_ACCOUNT_ID;

        if (!delegateKey || !accountId) {
          console.warn("[MemWal] Credentials not configured");
          setIsReady(false);
          return;
        }

        await initMemWal(delegateKey, accountId);
        setIsReady(true);
        setLastError(null);
      } catch (err) {
        console.error("[MemWal] Init failed:", err);
        setLastError(err.message);
        setIsReady(false);
      }
    };

    setup();
  }, [walletAddress]);

  /**
   * Save chat to MemWal (replaces API call to /api/walrus-store)
   */
  const saveMemory = useCallback(async (messages, agentId, metadata = {}) => {
    if (!isReady) {
      console.warn("[MemWal] Not ready, skipping save");
      return null;
    }

    setIsLoading(true);
    try {
      const result = await memwalRemember(walletAddress, messages, agentId, metadata);
      setLastError(null);
      return result;
    } catch (err) {
      setLastError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady, walletAddress]);

  /**
   * Semantic search (NEW FEATURE - competitor doesn't have this)
   */
  const searchMemory = useCallback(async (query, limit = 5) => {
    if (!isReady) return [];

    setIsLoading(true);
    try {
      const result = await memwalRecall(query, limit);
      return result.results || [];
    } catch (err) {
      setLastError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  /**
   * Auto-extract facts from conversation
   */
  const analyzeConversation = useCallback(async (text) => {
    if (!isReady) return null;

    setIsLoading(true);
    try {
      const result = await memwalAnalyze(text);
      return result;
    } catch (err) {
      setLastError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  return {
    isReady,
    isLoading,
    lastError,
    saveMemory,
    searchMemory,        // NEW: semantic search
    analyzeConversation  // NEW: fact extraction
  };
}

/**
 * Component: MemWalStatus
 * Shows connection status and memory stats
 */
export function MemWalStatus({ isReady, memoryCount }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: isReady ? "#00ff88" : "#ff4444"
    }}>
      <span style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: isReady ? "#00ff88" : "#ff4444",
        boxShadow: isReady ? "0 0 8px #00ff88" : "none"
      }} />
      {isReady ? (
        <span>🧠 MemWal ON • {memoryCount} memories encrypted</span>
      ) : (
        <span>⚠️ MemWal OFF (fallback mode)</span>
      )}
    </div>
  );
}

/**
 * Component: MemorySearch
 * UI for semantic search (killer feature for demo)
 */
export function MemorySearch({ onSearch, results }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div style={{ marginTop: "20px", borderTop: "1px solid #333", paddingTop: "15px" }}>
      <h4 style={{ color: "#ff0044", marginBottom: "10px", fontSize: "14px" }}>
        🔍 Semantic Memory Search
      </h4>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your memories... (e.g., 'What did I ask about Bitcoin?')"
          style={{
            flex: 1,
            background: "#1a1a1a",
            border: "1px solid #ff0044",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "13px"
          }}
        />
        <button
          type="submit"
          style={{
            background: "#ff0044",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Search
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          {results.map((r, i) => (
            <div key={i} style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "4px",
              padding: "10px",
              marginBottom: "8px",
              fontSize: "12px"
            }}>
              <div style={{ color: "#888", marginBottom: "4px" }}>
                Match: {(1 - r.distance).toFixed(2)}% relevant
              </div>
              <div style={{ color: "#ccc" }}>
                {JSON.parse(r.text).messages?.slice(-2).map(m => m.content).join(" → ") || r.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hook: useCrossAgentMemory()
 * Fetches shared memory context when user switches between agents.
 * Agent B automatically knows what Agent A discussed.
 */
export function useCrossAgentMemory(walletAddress, currentAgentId, previousAgentId) {
  const [sharedContext, setSharedContext] = useState(null);
  const [visitedAgents, setVisitedAgents] = useState([]);
  const [handoffMessage, setHandoffMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentCount, setAgentCount] = useState(0);

  // Fetch cross-agent context when agent changes
  useEffect(() => {
    if (!walletAddress || !currentAgentId) return;

    const fetchContext = async () => {
      setIsLoading(true);
      try {
        const userIntent = ""; // extracted from last user message by caller
        const resp = await fetch(
          `${API_BASE}/api/memory/cross-agent/context/${walletAddress}/${currentAgentId}` +
          `?last_agent=${previousAgentId || ""}&user_intent=${encodeURIComponent(userIntent)}&limit=5`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            setSharedContext(data.context || []);
            setHandoffMessage(data.handoff || "");
            setAgentCount(data.context_count || 0);
            setVisitedAgents(data.context?.map(c => c.from_agent_id).filter(Boolean) || []);
          }
        }

        // Also try direct MemWal search for richer results
        const memwalResult = await memwalCrossAgentRecall(walletAddress, currentAgentId, 3);
        if (memwalResult?.results?.length > 0) {
          setAgentCount(prev => Math.max(prev, memwalResult.results.length));
        }
      } catch (err) {
        console.error("[CrossAgent] Context fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
  }, [walletAddress, currentAgentId, previousAgentId]);

  return {
    sharedContext,
    visitedAgents,
    handoffMessage,
    agentCount,
    isLoading,
    isFirstAgent: agentCount === 0
  };
}

/**
 * Component: CrossAgentIndicator
 * Small pill showing how many agents have spoken with this user.
 * Green when agents share context, grey when it's the first agent.
 */
export function CrossAgentIndicator({ agentCount, visitedAgents = [], currentAgentId }) {
  if (agentCount === 0) return null;

  const agentNames = visitedAgents.slice(0, 5);
  const moreCount = Math.max(0, agentCount - agentNames.length);

  return (
    <div
      title={`Agents aware of this session: ${agentNames.join(", ")}${moreCount > 0 ? ` +${moreCount} more` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "12px",
        background: agentCount > 0 ? "rgba(46, 196, 182, 0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${agentCount > 0 ? "rgba(46, 196, 182, 0.4)" : "rgba(255,255,255,0.1)"}`,
        fontSize: "11px",
        color: agentCount > 0 ? "#2ec4b6" : "#666",
        cursor: "default",
        transition: "all 0.3s ease"
      }}
    >
      <span>🧠</span>
      <span style={{ fontWeight: "bold" }}>
        {agentCount} agent{agentCount !== 1 ? "s" : ""} aware
      </span>
    </div>
  );
}

/**
 * Component: HandoffBanner
 * Shows when switching from one agent to another with context.
 */
export function HandoffBanner({ handoffMessage, fromAgentName, toAgentName }) {
  if (!handoffMessage) return null;

  return (
    <div style={{
      margin: "8px 0",
      padding: "10px 14px",
      borderRadius: "8px",
      background: "rgba(255, 183, 3, 0.08)",
      border: "1px solid rgba(255, 183, 3, 0.2)",
      fontSize: "12px",
      color: "#ffb703",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      <span style={{ fontSize: "16px" }}>🔄</span>
      <span>
        <strong>{fromAgentName || "Previous agent"}</strong> handed off to{" "}
        <strong>{toAgentName || "you"}</strong>. Context from prior conversation is loaded.
      </span>
    </div>
  );
}

export default { useMemWal, MemWalStatus, MemorySearch, useCrossAgentMemory, CrossAgentIndicator, HandoffBanner };
