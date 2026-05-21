// MemWal React Integration for RIOT Chat Wallet
// Hooks and components to replace custom Walrus storage

import { useState, useCallback, useEffect } from "react";
import { initMemWal, memwalRemember, memwalRecall, memwalAnalyze } from "./memwal-client";

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

export default { useMemWal, MemWalStatus, MemorySearch };
