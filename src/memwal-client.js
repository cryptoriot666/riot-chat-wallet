// RIOT Chat Wallet — MemWal Integration
// Official MystenLabs library for encrypted AI memory on Walrus
// https://github.com/MystenLabs/MemWal

import { MemWal } from "@mysten-incubation/memwal";

const RELAYER_URL = "https://relayer.memwal.ai";
const NAMESPACE = "riot-chat-wallet";

let memwalInstance = null;
let initPromise = null;

/**
 * Initialize MemWal singleton
 */
export async function initMemWal() {
  if (memwalInstance) return memwalInstance;
  if (initPromise) return initPromise;

  const delegateKey = import.meta.env.VITE_MEMWAL_DELEGATE_KEY;
  const accountId = import.meta.env.VITE_MEMWAL_ACCOUNT_ID;

  if (!delegateKey || !accountId) {
    console.warn("[MemWal] Credentials not configured — falling back to API");
    return null;
  }

  initPromise = (async () => {
    try {
      memwalInstance = MemWal.create({
        key: delegateKey,
        accountId: accountId,
        serverUrl: RELAYER_URL,
        namespace: NAMESPACE,
        suiNetwork: "mainnet"
      });

      const health = await memwalInstance.health();
      console.log("[MemWal] ✅ Connected to mainnet relayer", health);
      return memwalInstance;
    } catch (err) {
      console.error("[MemWal] ❌ Connection failed:", err.message);
      memwalInstance = null;
      return null;
    }
  })();

  return initPromise;
}

/**
 * Save chat memory to MemWal (encrypted + semantic search enabled)
 * Returns: { id, blob_id, owner, namespace } or null on failure
 */
export async function memwalRemember(walletAddress, messages, agentId, metadata = {}) {
  const mw = await initMemWal();
  if (!mw) return null;

  const payload = JSON.stringify({
    wallet_address: walletAddress,
    agent_id: agentId,
    messages: messages.slice(-10), // Last 10 messages to keep size reasonable
    timestamp: Date.now(),
    message_count: messages.length,
    ...metadata
  });

  try {
    const result = await mw.rememberAndWait(payload);
    console.log("[MemWal] 💾 Memory saved:", result.blob_id?.slice(0, 16) + "...");
    return result;
  } catch (err) {
    console.error("[MemWal] 💾 Save failed:", err.message);
    return null;
  }
}

/**
 * Semantic search — finds memories by MEANING not keyword
 * Example: "What did I ask about Bitcoin?" → finds relevant chats
 */
export async function memwalRecall(query, limit = 5) {
  const mw = await initMemWal();
  if (!mw) return { results: [] };

  try {
    const result = await mw.recall(query, limit);
    console.log(`[MemWal] 🔍 Found ${result.results.length} memories for "${query}"`);
    return result;
  } catch (err) {
    console.error("[MemWal] 🔍 Search failed:", err.message);
    return { results: [] };
  }
}

/**
 * Auto-extract facts from text → store as separate memories
 * Better recall precision than storing whole chat blocks
 */
export async function memwalAnalyze(text) {
  const mw = await initMemWal();
  if (!mw) return null;

  try {
    const result = await mw.analyzeAndWait(text);
    console.log(`[MemWal] 🧠 Extracted ${result.fact_count} facts`);
    return result;
  } catch (err) {
    console.error("[MemWal] 🧠 Analyze failed:", err.message);
    return null;
  }
}

/**
 * Bulk save multiple items (up to 20) — for migration or batch operations
 */
export async function memwalRememberBulk(items) {
  const mw = await initMemWal();
  if (!mw) return null;

  try {
    const result = await mw.rememberBulkAndWait(items);
    console.log(`[MemWal] 💾 Bulk saved ${result.total} memories`);
    return result;
  } catch (err) {
    console.error("[MemWal] 💾 Bulk save failed:", err.message);
    return null;
  }
}

/**
 * Check if MemWal is ready
 */
export function isMemWalReady() {
  return !!memwalInstance;
}

/**
 * Get MemWal health status
 */
export async function getMemWalHealth() {
  const mw = await initMemWal();
  if (!mw) return { status: "disconnected", error: "Not configured" };

  try {
    const health = await mw.health();
    return { status: "connected", ...health };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}
