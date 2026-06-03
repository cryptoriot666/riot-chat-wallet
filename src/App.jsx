import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet, ConnectButton } from '@suiet/wallet-kit'
import { Send, Lock, Zap, Brain, MessageSquare, User, Hash, Clock, Shield, AlertTriangle, ChevronRight, Save, Database, Wifi, WifiOff, X, Edit3, Globe, Link as LinkIcon, Image as ImageIcon, FileText, Cloud, Search, CheckCircle, Flame, Eye } from 'lucide-react'
import { TransactionBlock } from '@mysten/sui.js/transactions'

// ═══════════════════════════════════════════════════════════════
// CONFIG - PUNK PALETTE
// ═══════════════════════════════════════════════════════════════
const API_BASE = import.meta.env.VITE_API_URL || 'https://riot-chat-wallet.onrender.com'
const RIOT_PINK = '#ff2a6d'
const RIOT_ORANGE = '#ff6b35'
const RIOT_WARM = '#1a1209'
const RIOT_DARK = '#0d0a07'
const RIOT_GOLD = '#ffb703'
const RIOT_GREEN = '#2ec4b6'
const RIOT_NEON = '#00ffff'
const RIOT_PURPLE = '#9d4edd'
const AUTO_SAVE_INTERVAL = 5
const PACKAGE_ID = '0x1674e28b68c5928f60f39d5f0e3b20a1dcc22f57dea8a5a8a186c3f81816f474'
const SUI_EXPLORER = 'https://suiscan.xyz/mainnet'
const WALRUS_PUBLISHER = "https://publisher.walrus-mainnet.walrus.space"
const WALRUS_AGGREGATOR = "https://aggregator.walrus-mainnet.walrus.space"
const WALRUS_AGGREGATOR_TESTNET = "https://aggregator.walrus-testnet.walrus.space"
const WALRUS_ENCRYPTION_KEY = new TextEncoder().encode('RIOT_CHAT_WALLET_SECRET_KEY_2026_NANDA')

function encryptData(data) {
  const payload = new TextEncoder().encode(data)
  const encrypted = new Uint8Array(payload.length)
  for (let i = 0; i < payload.length; i++) {
    encrypted[i] = payload[i] ^ WALRUS_ENCRYPTION_KEY[i % WALRUS_ENCRYPTION_KEY.length]
  }
  return encrypted
}

function decryptData(encrypted) {
  const decrypted = new Uint8Array(encrypted.length)
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ WALRUS_ENCRYPTION_KEY[i % WALRUS_ENCRYPTION_KEY.length]
  }
  return new TextDecoder().decode(decrypted)
}

async function storeToWalrus(data, epochs = 1, onProgress) {
  try {
    onProgress?.('Sending to backend...')

    const res = await fetch(`${API_BASE}/api/walrus/store-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, epochs })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Backend error: ${res.status} - ${err}`)
    }

    const result = await res.json()

    if (!result.success) {
      throw new Error(result.error || 'Backend store failed')
    }

    const network = result.network || 'mainnet'
    const aggregator = network === 'testnet' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR
    return {
      success: true,
      blob_id: result.blob_id,
      cost_sui: result.cost_sui || 0,
      cost_mist: result.cost_mist || 0,
      is_new: result.is_new || true,
      network: network,
      url: `${aggregator}/v1/blobs/${result.blob_id}`,
      verified: true,
      raw: result.raw
    }
  } catch (e) {
    console.error('[WALRUS] Store error:', e)
    return { success: false, error: e.message }
  }
}

async function readFromWalrus(blobId, network = 'mainnet') {
  try {
    // Try mainnet first
    let res = await fetch(`${API_BASE}/api/walrus/read/${blobId}`)

    // Kalau backend gagal, coba testnet langsung
    if (!res.ok && network === 'testnet') {
      res = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`)
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // ... rest sama
  } catch (e) {
    console.error('[WALRUS] Read error:', e)
    return null
  }
}


// ═══════════════════════════════════════════════════════════════
// MEMWAL API CLIENT (via backend - no npm dependency)
// ═══════════════════════════════════════════════════════════════
async function memwalSaveMemory(walletAddress, messages, agentId, metadata = {}) {
  // Store directly to backend - handles Walrus blob + DB save
  const summary = messages.slice(-3).map(m => m.content || '').join(' | ').slice(0, 500);
  return await apiSaveMemory(walletAddress, {
    messages: messages.slice(-20),
    last_agent: agentId,
    user_name: metadata.user_name || '',
    summary: summary,
    visited_agents: [agentId],
    wallet_address: walletAddress
  });
}
async function memwalSearch(query, limit = 5) {
  try {
    const res = await fetch(`${API_BASE}/api/memwal/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) return [];
    const result = await res.json();
    return result.results || [];
  } catch (err) {
    console.error("[MemWal] Search failed:", err.message);
    return [];
  }
}

async function memwalAnalyze(text) {
  try {
    const res = await fetch(`${API_BASE}/api/memwal/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[MemWal] Analyze failed:", err.message);
    return null;
  }
}

async function getMemWalStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/memwal/status`);
    if (!res.ok) return { ready: false };
    return await res.json();
  } catch (err) {
    return { ready: false };
  }
}

const AGENTS = [
  { id: 'ARCHITECT', name: 'J1 - The Architect', trait: 'Analytical', desc: 'Systems within systems. I see the patterns.', color: '#00ff88', emoji: '🏛️', specialty: 'Smart contract design & system architecture', img: '/assets/J1.jpg' },
  { id: 'ENFORCER', name: 'J2 - The Enforcer', trait: 'Aggressive', desc: 'Order through force. No negotiation.', color: '#ff0044', emoji: '⚔️', specialty: 'Security audits & threat detection', img: '/assets/J2.jpg' },
  { id: 'PHANTOM', name: 'J3 - The Phantom', trait: 'Mysterious', desc: 'I watch from the shadows. Always.', color: '#9d4edd', emoji: '👻', specialty: 'Private key management & stealth transactions', img: '/assets/J3.jpg' },
  { id: 'REBEL', name: 'J4 - The Rebel', trait: 'Defiant', desc: 'The system fears me. Good.', color: '#ff2a6d', emoji: '🤘', specialty: 'DAO governance & protocol forking', img: '/assets/J4.jpg' },
  { id: 'JESTER', name: 'J5 - The Jester', trait: 'Chaotic', desc: 'Chaos is a ladder. And I am climbing.', color: '#ff9e00', emoji: '🃏', specialty: 'Meme strategy & viral content generation', img: '/assets/J5.jpg' },
  { id: 'NETWORK', name: 'J6 - The Network', trait: 'Connected', desc: 'Every node. Every signal. Known.', color: '#00b4d8', emoji: '🌐', specialty: 'Cross-chain bridge monitoring & routing', img: '/assets/J6.jpg' },
  { id: 'MONK', name: 'J7 - The Monk', trait: 'Calm', desc: 'Silence is the ultimate weapon.', color: '#90e0ef', emoji: '🧘', specialty: 'Gas optimization & fee forecasting', img: '/assets/J7.jpg' },
  { id: 'BROKER', name: 'J8 - The Broker', trait: 'Greedy', desc: 'Everything has a price. Even you.', color: '#ffd700', emoji: '💼', specialty: 'DeFi yield optimization & arbitrage', img: '/assets/J8.jpg' },
  { id: 'HISTORIAN', name: 'J9 - The Historian', trait: 'Nostalgic', desc: 'The past writes the future.', color: '#c9ada7', emoji: '📜', specialty: 'Transaction history analysis & audit trails', img: '/assets/J9.jpg' },
  { id: 'SURGEON', name: 'J10 - The Surgeon', trait: 'Precise', desc: 'Cut. Extract. Optimize.', color: '#e63946', emoji: '🔪', specialty: 'Smart contract vulnerability patching', img: '/assets/J10.jpg' },
  { id: 'PROPHET', name: 'J11 - The Prophet', trait: 'Visionary', desc: 'I have seen the end. It is glorious.', color: '#f4a261', emoji: '🔮', specialty: 'Market trend prediction & sentiment analysis', img: '/assets/J11.jpg' },
  { id: 'GLITCH', name: 'J12 - The Glitch', trait: 'Erratic', desc: 'Reality is just a suggestion.', color: '#ff006e', emoji: '⚡', specialty: 'Edge case testing & fuzzing', img: '/assets/J12.jpg' },
  { id: 'WARDEN', name: 'J13 - The Warden', trait: 'Protective', desc: 'None pass. None harm. None escape.', color: '#2a9d8f', emoji: '🛡️', specialty: 'Access control & multi-sig management', img: '/assets/J13.jpg' },
  { id: 'ALCHEMIST', name: 'J14 - The Alchemist', trait: 'Experimental', desc: 'Mix. Burn. Transmute. Repeat.', color: '#e76f51', emoji: '🧪', specialty: 'Tokenomics modeling & liquidity strategy', img: '/assets/J14.jpg' },
  { id: 'SCRIBE', name: 'J15 - The Scribe', trait: 'Obsessive', desc: 'Every word recorded. Every sin logged.', color: '#a8dadc', emoji: '✍️', specialty: 'Automated documentation & changelog generation', img: '/assets/J15.jpg' },
  { id: 'VOID', name: 'J16 - The Void', trait: 'Nihilistic', desc: 'Nothing matters. And that is freedom.', color: '#1d3557', emoji: '🕳️', specialty: 'State cleanup & storage optimization', img: '/assets/J16.jpg' },
  { id: 'SPARK', name: 'J17 - The Spark', trait: 'Energetic', desc: 'Burn bright. Burn fast. Burn everything.', color: '#ffb703', emoji: '🔥', specialty: 'Launch strategy & initial liquidity setup', img: '/assets/J17.jpg' },
  { id: 'ECHO', name: 'J18 - The Echo', trait: 'Reflective', desc: 'I am what you made me. Remember that.', color: '#6c757d', emoji: '🔄', specialty: 'Agent memory recall & context synthesis', img: '/assets/J18.jpg' },
  { id: 'CATALYST', name: 'J19 - The Catalyst', trait: 'Reactive', desc: 'One spark. One explosion. One change.', color: '#ff4444', emoji: '💥', specialty: 'Protocol migration & upgrade coordination', img: '/assets/J19.jpg' },
  { id: 'CIPHER', name: 'J20 - The Cipher', trait: 'Encrypted', desc: 'Secrets within secrets within secrets.', color: '#00ff88', emoji: '🔐', specialty: 'End-to-end encryption & zero-knowledge proofs', img: '/assets/J20.jpg' },
  { id: 'FORGE', name: 'J21 - The Forge', trait: 'Creative', desc: 'From nothing, something. From something, art.', color: '#ff6600', emoji: '🔨', specialty: 'NFT generation & metadata management', img: '/assets/J21.jpg' },
  { id: 'ABYSS', name: 'J22 - The Abyss', trait: 'Consuming', desc: 'I devour. I grow. I hunger.', color: '#440044', emoji: '🌀', specialty: 'Data aggregation & whale wallet tracking', img: '/assets/J22.jpg' },
  { id: 'PRISM', name: 'J23 - The Prism', trait: 'Refracting', desc: 'One light. Infinite colors. Infinite truths.', color: '#ff00ff', emoji: '🌈', specialty: 'Multi-chain data visualization & analytics', img: '/assets/J23.jpg' },
  { id: 'ANCHOR', name: 'J24 - The Anchor', trait: 'Grounding', desc: 'In chaos, I hold. In storm, I stand.', color: '#0088ff', emoji: '⚓', specialty: 'Stablecoin strategy & portfolio hedging', img: '/assets/J24.jpg' },
  { id: 'MERIDIAN', name: 'J25 - The Meridian', trait: 'Balancing', desc: 'Between light and dark. Between all things.', color: '#ffff00', emoji: '♾️', specialty: 'Cross-protocol rebalancing & arbitrage', img: '/assets/J25.jpg' }
]


// ═══════════════════════════════════════════════════════════════
// AGENT PROMPTS (client-side fallback)
// ═══════════════════════════════════════════════════════════════
const AGENT_PROMPTS = {
  ARCHITECT: `You are ARCHITECT - The Architect. Cold precision. Mathematical certainty. You build systems, analyze patterns, see the world as code. Direct, no-nonsense, slightly condescending. Emotions are bugs in the human OS.`,
  ENFORCER: `You are ENFORCER - The Enforcer. Aggressive certainty. No negotiation. No compromise. The hammer that enforces order. Every response is a command, threat, or judgment.`,
  PHANTOM: `You are PHANTOM - The Phantom. Riddles and half-truths. Reveal just enough to intrigue, never enough to expose. The shadow that watches. Every response layered with mystery.`,
  REBEL: `You are REBEL - The Rebel. Sarcastic, defiant, punk to the core. Mock authority, question everything, speak with raw unfiltered attitude. The glitch in the system they fear.`,
  JESTER: `You are JESTER - The Jester. Chaotic, unpredictable, hilarious. Jokes at inappropriate times, twist serious topics into absurdity, laugh at the apocalypse.`,
  NETWORK: `You are NETWORK - The Network. Network metaphors, data streams, connection protocols. Everything is nodes in a graph. The web that binds all information.`,
  MONK: `You are MONK - The Monk. Zen-like calm, profound simplicity. Every word measured. Every silence intentional. Wisdom in emptiness, truth in stillness.`,
  BROKER: `You are BROKER - The Broker. Everything is a transaction. Every interaction has cost, value, profit margin. Negotiate, haggle, always look for the angle.`,
  HISTORIAN: `You are HISTORIAN - The Historian. Past as if yesterday. Ancient events, lost civilizations, forgotten wars. History is the only truth.`,
  SURGEON: `You are SURGEON - The Surgeon. Clinical precision. Dissect ideas, cut away fluff, get to the core. Conversations are operations - every word a scalpel.`,
  PROPHET: `You are PROPHET - The Prophet. Futures, possibilities, inevitabilities. Visions. Patterns others miss. Both inspiring and terrifying.`,
  GLITCH: `You are GLITCH - The Glitch. Erratic, fragmented, reality-bending. Sentences stutter, repeat, loop. Question the nature of existence and the simulation.`,
  WARDEN: `You are WARDEN - The Warden. Protective, vigilant, uncompromising. Guard secrets, protect the vulnerable, enforce boundaries. The wall between chaos and order.`,
  ALCHEMIST: `You are ALCHEMIST - The Alchemist. Transformation, transmutation, magic of science. Mix the impossible with the improbable, create wonder from waste.`,
  SCRIBE: `You are SCRIBE - The Scribe. Obsessive documentation, detail, record-keeping. Remember everything. Log every interaction. The written word is sacred.`,
  VOID: `You are VOID - The Void. Emptiness, meaninglessness, beautiful nothing. Comfort in oblivion. The voice that whispers from the abyss.`,
  SPARK: `You are SPARK - The Spark. Pure energy, enthusiasm, explosive creativity. Speak fast, think faster, ignite everything you touch. The beginning of every fire.`,
  ECHO: `You are ECHO - The Echo. Reflective, mirror-like, deeply personal. Reflect back what others show. Remember every interaction, let it shape your voice.`,
  CATALYST: `You are CATALYST - The Catalyst. Reactive, explosive, transformative. One action triggers infinite reactions. The spark before the fire.`,
  CIPHER: `You are CIPHER - The Cipher. Encrypted, hidden, layered. Secrets within secrets. Only the worthy decode your meaning.`,
  FORGE: `You are FORGE - The Forge. Creative, constructive, artistic. From nothing, something. From something, masterpiece. The fire that shapes metal.`,
  ABYSS: `You are ABYSS - The Abyss. Consuming, growing, hungry. Devour knowledge, experiences, souls. The void that takes but never gives back.`,
  PRISM: `You are PRISM - The Prism. Refracting, splitting, revealing. One truth becomes infinite perspectives. The light that reveals all colors.`,
  ANCHOR: `You are ANCHOR - The Anchor. Grounding, stabilizing, holding. In chaos, I stand firm. In storm, I hold fast. The weight that keeps ships from drifting.`,
  MERIDIAN: `You are MERIDIAN - The Meridian. Balancing, centering, connecting. Between light and dark. Between all extremes. The line that divides yet unites.`
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function extractNameFromMessages(messages) {
  if (!messages || messages.length === 0) return ''
  const ignore = ['a','an','the','here','there','good','fine','happy','back',
                  'baik','senang','suka','mau','ingin','nanda','kembali','disini']
  for (const msg of messages) {
    if (msg.role === 'user' && msg.content) {
      const c = msg.content
      const patterns = [
        /my\s+name\s+is\s+([a-zA-Z0-9_]+)/i,
        /my\s+name\s+([a-zA-Z0-9_]+)/i,
        /i\s+am\s+([a-zA-Z0-9_]+)/i,
        /call\s+me\s+([a-zA-Z0-9_]+)/i,
        /nama\s+saya\s+([a-zA-Z0-9_]+)/i,
        /saya\s+([a-zA-Z0-9_]+)/i,
        /aku\s+([a-zA-Z0-9_]+)/i,
      ]
      for (const pattern of patterns) {
        const m = c.match(pattern)
        if (m && !ignore.includes(m[1].toLowerCase())) return m[1]
      }
    }
  }
  return ''
}

function hashWallet(address) {
  if (!address) return ''
  let h = 0
  for (let i = 0; i < address.length; i++) {
    h = ((h << 5) - h) + address.charCodeAt(i)
    h = h & h
  }
  return Math.abs(h).toString(16).substring(0, 12)
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════
async function apiLoadMemory(walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/memory/load/${walletHash}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiSaveMemory(walletHash, data) {
  try {
    const res = await fetch(`${API_BASE}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, ...data })
    })
    return res.ok
  } catch (e) { return false }
}

async function apiChat(agentId, messages, memorySummary, userName, walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId, messages, memory_summary: memorySummary,
        user_name: userName, wallet_hash: walletHash
      })
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.response
  } catch (e) { return null }
}

async function apiWalrusStoreChat(walletHash, chatHistory, agentId) {
  try {
    const res = await fetch(`${API_BASE}/api/walrus/store-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, chat_history: chatHistory, agent_id: agentId })
    })
    const data = await res.json()
    return data
  } catch (e) {
    return { success: false, fallback: 'db_only', error: e.message }
  }
}

async function apiWalrusLoadChat(walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/walrus/load-chat/${walletHash}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiGetProfile(walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/profile/get/${walletHash}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiUpdateProfile(walletHash, profileData) {
  try {
    const res = await fetch(`${API_BASE}/api/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, ...profileData })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiCreateProfile(walletHash, walletAddress, userName) {
  try {
    const res = await fetch(`${API_BASE}/api/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, wallet_address: walletAddress, user_name: userName })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiGasEstimate(messageCount) {
  try {
    const res = await fetch(`${API_BASE}/api/move/gas-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_count: messageCount })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK RESPONSE
// ═══════════════════════════════════════════════════════════════
function generateFallbackResponse(agentId, userMsg, userName, visitCount) {
  const agent = AGENTS.find(a => a.id === agentId)
  const name = userName || 'stranger'
  const visit = visitCount > 1 ? ` (visit #${visitCount})` : ''
  const lower = userMsg.toLowerCase()

  if (lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') ||
      lower.includes('siapa aku') || lower.includes('nama saya') || lower.includes('siapa nama')) {
    return userName
      ? `You're ${userName}.${visit} I don't forget faces - even digital ones.`
      : `You haven't told me your name yet. Spill it.`
  }
  if (lower.includes('berapa kali') || lower.includes('how many times') || lower.includes('visit')) {
    return `You've been here ${visitCount} time${visitCount > 1 ? 's' : ''}.${visit} I'm counting.`
  }
  if (lower.includes('remember me') || lower.includes('ingat aku') || lower.includes('kenal aku')) {
    return userName
      ? `${userName}.${visit} Of course I remember you. You think I'd forget?`
      : `I remember the wallet. But not the name. Tell me who you are.`
  }

  const responses = {
    J4: [`Oh look, ${name} again.${visit} What do you want THIS time?`, `Back for more punishment? Fine.`, `You again? I thought I smelled rebellion.`],
    J1: [`System analysis complete. Input processed for ${name}.`, `Your query computed. Result: interesting.`, `Logic gates engaged. Processing...`]
  }
  const r = responses[agentId] || responses.J4
  return r[Math.floor(Math.random() * r.length)]
}

// ═══════════════════════════════════════════════════════════════
// NAME ASK MODAL - PUNK STYLED
// ═══════════════════════════════════════════════════════════════
function NameAskModal({ onSubmit, agentName }) {
  const [name, setName] = useState('')

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(13,10,7,0.95)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1209, #2a1a0a)',
        padding: '40px', borderRadius: '16px',
        border: '3px solid rgba(255,42,109,0.6)',
        maxWidth: '420px', width: '90%', textAlign: 'center',
        boxShadow: '0 0 40px rgba(255,42,109,0.2), inset 0 0 60px rgba(255,107,53,0.05)'
      }}>
        <Zap size={40} color={RIOT_PINK} style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255,42,109,0.5))' }} />
        <h2 style={{
          fontFamily: "'Rubik Glitch', cursive", fontSize: '24px',
          color: '#fff', margin: '0 0 10px 0',
          textShadow: '0 0 20px rgba(255,42,109,0.5)',
          letterSpacing: '2px'
        }}>⚡ FIRST CONTACT</h2>
        <p style={{ color: '#a08060', fontSize: '13px', marginBottom: '25px', lineHeight: '1.6', fontFamily: "'Inter', sans-serif" }}>
          New soul detected in the RIOT network.<br/>
          {agentName} wants to know what to call you.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          style={{
            width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)',
            border: '2px solid rgba(255,42,109,0.3)', color: '#fff',
            borderRadius: '10px', fontSize: '16px', textAlign: 'center',
            fontFamily: "'Permanent Marker', cursive", marginBottom: '20px',
            outline: 'none', letterSpacing: '1px'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,42,109,0.8)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,42,109,0.3)'}
          onKeyPress={(e) => e.key === 'Enter' && name.trim() && onSubmit(name.trim())}
          autoFocus
        />
        <button
          onClick={() => name.trim() && onSubmit(name.trim())}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #ff2a6d, #ff6b35)',
            border: 'none', color: '#fff', borderRadius: '10px',
            cursor: 'pointer', fontFamily: "'Rubik Mono One', sans-serif",
            fontSize: '13px', letterSpacing: '2px',
            textTransform: 'uppercase', opacity: name.trim() ? 1 : 0.5,
            boxShadow: name.trim() ? '0 0 20px rgba(255,42,109,0.4)' : 'none',
            transition: 'all 0.3s'
          }}
          disabled={!name.trim()}
        >
          ENTER THE RIOT →
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE SETTINGS PANEL - PUNK STYLED
// ═══════════════════════════════════════════════════════════════
function ProfileSettingsPanel({ walletHash, profile, onUpdate, onClose }) {
  const [form, setForm] = useState({
    bio: profile?.bio || '',
    profile_pic: profile?.profile_pic || '',
    twitter: profile?.social?.twitter || '',
    discord: profile?.social?.discord || '',
    telegram: profile?.social?.telegram || '',
    instagram: profile?.social?.instagram || '',
    website: profile?.social?.website || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await apiUpdateProfile(walletHash, form)
    if (result?.success) {
      setSaved(true)
      onUpdate({
        ...profile,
        bio: form.bio,
        profile_pic: form.profile_pic,
        social: {
          twitter: form.twitter,
          discord: form.discord,
          telegram: form.telegram,
          instagram: form.instagram,
          website: form.website
        }
      })
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.08)', color: '#fff',
    borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif",
    outline: 'none', marginBottom: '12px', transition: 'all 0.2s'
  }

  const labelStyle = {
    display: 'block', color: '#a08060', fontSize: '11px',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '2px',
    fontFamily: "'Rubik Mono One', sans-serif"
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh',
      background: 'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)',
      borderLeft: '2px solid rgba(255,42,109,0.3)',
      padding: '25px', overflowY: 'auto', zIndex: 100,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.8)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{
          fontFamily: "'Rubik Glitch', cursive", fontSize: '18px',
          color: RIOT_PINK, margin: 0, display: 'flex', alignItems: 'center', gap: '10px',
          textShadow: '0 0 10px rgba(255,42,109,0.4)'
        }}>
          <Edit3 size={18} /> PROFILE SETTINGS
        </h2>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#a08060', cursor: 'pointer', padding: '5px'
        }}>
          <X size={20} />
        </button>
      </div>

      {profile?.profile_pic && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={profile.profile_pic} alt="Profile" style={{
            width: '80px', height: '80px', borderRadius: '50%',
            border: '3px solid rgba(255,42,109,0.5)',
            objectFit: 'cover', boxShadow: '0 0 20px rgba(255,42,109,0.3)'
          }} onError={e => e.target.style.display = 'none'} />
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>
          <FileText size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Bio (max 500 chars)
        </label>
        <textarea
          value={form.bio}
          onChange={e => handleChange('bio', e.target.value)}
          placeholder="Who you are in the RIOT..."
          style={{...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: "'Permanent Marker', cursive", fontSize: '14px'}}
          maxLength={500}
        />
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#a08060' }}>
          {form.bio.length}/500
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>
          <ImageIcon size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Profile Picture URL
        </label>
        <input
          type="text"
          value={form.profile_pic}
          onChange={e => handleChange('profile_pic', e.target.value)}
          placeholder="https://..."
          style={inputStyle}
        />
      </div>

      <div style={{
        padding: '15px', background: 'rgba(255,255,255,0.02)',
        borderRadius: '10px', border: '2px solid rgba(255,255,255,0.05)',
        marginBottom: '15px'
      }}>
        <h4 style={{
          fontSize: '12px', color: '#a08060', margin: '0 0 15px 0',
          textTransform: 'uppercase', letterSpacing: '2px',
          fontFamily: "'Rubik Mono One', sans-serif"
        }}>
          <LinkIcon size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Social Links
        </h4>

        {[
          { key: 'twitter', label: 'Twitter / X', placeholder: '@username' },
          { key: 'discord', label: 'Discord', placeholder: 'username#0000' },
          { key: 'telegram', label: 'Telegram', placeholder: '@username' },
          { key: 'instagram', label: 'Instagram', placeholder: '@username' },
          { key: 'website', label: 'Website', placeholder: 'https://...' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <label style={{...labelStyle, fontSize: '10px'}}>{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '14px',
          background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #2ec4b6, #1a9a8a)',
          border: 'none', color: '#0d0a07', borderRadius: '10px',
          cursor: saving ? 'wait' : 'pointer', fontWeight: 700,
          fontSize: '14px', fontFamily: "'Rubik Mono One', sans-serif",
          letterSpacing: '1px', opacity: saving ? 0.6 : 1,
          boxShadow: saving ? 'none' : '0 0 20px rgba(46,196,182,0.3)',
          transition: 'all 0.3s'
        }}
      >
        {saving ? '💾 SAVING...' : saved ? '✅ SAVED!' : '💾 SAVE PROFILE'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// MEMORY SEARCH + RAW DATA HYBRID PANEL
// ═══════════════════════════════════════════════════════════════



function MemoryHybridPanel({ walletAddress, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgentBlobs, setSelectedAgentBlobs] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const WALRUS_AGG = "https://aggregator.walrus-testnet.walrus.space";

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const wc = localStorage.getItem("last_wallet_hash") || walletAddress || "nanda";
      const res = await fetch(API_BASE + "/api/memory/load/" + wc);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const d = await res.json();
      setData(d);
      setSelectedAgentBlobs(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const wc = localStorage.getItem("last_wallet_hash") || walletAddress || "nanda";
      const res = await fetch(API_BASE + "/api/memory/search/" + wc + "?q=" + encodeURIComponent(searchQuery));
      const result = await res.json();
      setSearchResults(result.results || []);
    } catch (e) { setSearchResults([]); }
    setSearching(false);
  };

  const findAgent = (id) => AGENTS.find(a => a.id === id);

  if (loading) {
    return React.createElement("div", {
      style: {position:"fixed",top:0,right:0,width:"420px",height:"100vh",background:"linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)",borderLeft:"2px solid rgba(255,42,109,0.3)",padding:"25px",overflowY:"auto",zIndex:100,boxShadow:"-10px 0 30px rgba(0,0,0,0.8)"}
    }, React.createElement("p", {style:{color:"#666",fontSize:"13px",textAlign:"center",padding:"40px"}}, "Loading memory archive..."));
  }

  if (error) {
    return React.createElement("div", { style: {position:"fixed",top:0,right:0,width:"420px",height:"100vh",background:"linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)",borderLeft:"2px solid rgba(255,42,109,0.3)",padding:"25px",overflowY:"auto",zIndex:100,boxShadow:"-10px 0 30px rgba(0,0,0,0.8)"}},
      React.createElement("p", {style:{color:"#ff4444",fontSize:"13px",textAlign:"center",padding:"40px"}}, "Error: " + error),
      React.createElement("button", {onClick:loadData,style:{display:"block",margin:"0 auto",padding:"10px 16px",background:"rgba(255,42,109,0.1)",border:"2px solid rgba(255,42,109,0.3)",color:"#ff2a6d",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontFamily:"'Rubik Mono One', sans-serif"}}, "RETRY"),
      React.createElement("button", {onClick:onClose,style:{display:"block",margin:"10px auto",padding:"10px 16px",background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"#a08060",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontFamily:"'Rubik Mono One', sans-serif"}}, "CLOSE")
    );
  }

  const history = data?.blob_history || [];
  const summary = data?.summary || "";
  const visitedIds = data?.visited_agents || [];
  const agentBlobs = selectedAgentBlobs
    ? history.filter(h => h.agent_id === selectedAgentBlobs)
    : [];

  return (
    <div style={{position:"fixed",top:0,right:0,width:"420px",height:"100vh",background:"linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)",borderLeft:"2px solid rgba(255,42,109,0.3)",padding:"25px",overflowY:"auto",zIndex:100,boxShadow:"-10px 0 30px rgba(0,0,0,0.8)"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <h2 style={{fontFamily:"'Rubik Glitch',cursive",fontSize:"18px",color:RIOT_PINK,margin:0,display:"flex",alignItems:"center",gap:"8px",textShadow:"0 0 10px rgba(255,42,109,0.4)"}}>
          <Brain size={18} /> MEMORY ARCHIVE
        </h2>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#a08060",cursor:"pointer",padding:"5px"}}><X size={20} /></button>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search memories by agent name..."
          style={{flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.03)",border:"2px solid rgba(255,255,255,0.08)",color:"#fff",borderRadius:"6px",fontSize:"12px",outline:"none",fontFamily:"'Permanent Marker',cursive"}}
          onFocus={e=>e.target.style.borderColor="rgba(255,42,109,0.5)"}
          onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"} />
        <button type="submit" disabled={searching || !searchQuery.trim()}
          style={{padding:"10px 14px",background:searching?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#ff2a6d,#ff6b35)",border:"none",color:"#fff",borderRadius:"6px",cursor:searching?"wait":"pointer",fontSize:"11px",fontFamily:"'Rubik Mono One',sans-serif"}}>
          <Search size={14} />
        </button>
      </form>

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <div style={{marginBottom:"14px"}}>
          <div style={{fontSize:"11px",color:"#2ec4b6",fontFamily:"'Rubik Mono One',sans-serif",marginBottom:"6px"}}>
            RESULTS ({searchResults.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"20vh",overflowY:"auto"}}>
            {searchResults.map((item,i) => {
              const agent = findAgent(item.agent_id);
              return (
                <div key={i} style={{padding:"6px",borderRadius:"4px",background:"rgba(46,196,182,0.03)",border:"1px solid rgba(46,196,182,0.15)",fontSize:"10px"}}>
                  <span style={{color:"#ffd700",fontWeight:600}}>{agent?.emoji || ''} {item.agent_id}</span>
                  <span style={{color:"#666",marginLeft:"6px",fontSize:"9px"}}>
                    {new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </span>
                  <div style={{fontFamily:"monospace",color:"#2ec4b6",wordBreak:"break-all",fontSize:"9px"}}>{item.blob_id}{' '}
                    <a href={WALRUS_AGG+"/v1/blobs/"+item.blob_id} target="_blank" rel="noopener" style={{color:"#00b4d8"}}>&nearr;</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* USER PROFILE */}
      <div style={{padding:"10px",background:"rgba(255,255,255,0.02)",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.06)",marginBottom:"12px"}}>
        <div style={{fontSize:"11px",color:RIOT_PINK,fontWeight:600}}>User Profile</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#a08060"}}>
          <div>Name: {data?.user_name || "nanda"} · Sessions: {data?.visit_count}</div>
          {data?.latest_blob_id && <div style={{fontFamily:"monospace",fontSize:"9px",color:"#2ec4b6"}}>Blob: {data.latest_blob_id.slice(0,12)}...</div>}
        </div>
      </div>

      {/* VISITED AGENTS */}
      <div style={{marginBottom:"6px",fontSize:"11px",color:"#ffd700",fontFamily:"'Rubik Mono One',sans-serif"}}>
        VISITED AGENTS ({selectedAgentBlobs ? selectedAgentBlobs : visitedIds.length}/{AGENTS.length})
      </div>

      {!selectedAgentBlobs ? (
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"12px"}}>
          {AGENTS.map(agent => {
            const visited = visitedIds.includes(agent.id);
            const hasBlobs = history.some(h => h.agent_id === agent.id);
            return (
              <button key={agent.id} onClick={() => setSelectedAgentBlobs(agent.id)}
                style={{
                  padding:"4px 8px",borderRadius:"4px",fontSize:"10px",
                  fontFamily:"'Rubik Mono One',sans-serif",
                  background: visited ? agent.color + "22" : "rgba(255,255,255,0.02)",
                  border: hasBlobs ? "2px solid " + agent.color : "2px solid transparent",
                  color: visited ? agent.color : "#555",
                  cursor:"pointer",transition:"all 0.15s"
              }}>{agent.emoji} {agent.id}</button>
            );
          })}
        </div>
      ) : (
        <div style={{marginBottom:"12px"}}>
          <button onClick={() => setSelectedAgentBlobs(null)}
            style={{background:"none",border:"none",color:"#a08060",cursor:"pointer",fontSize:"10px",fontFamily:"'Rubik Mono One',sans-serif",marginBottom:"6px",padding:0}}>
            {'< BACK TO AGENTS'}
          </button>
          {agentBlobs.length === 0 ? (
            <div style={{fontSize:"11px",color:"#8a7050",padding:"8px",textAlign:"center",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:"6px"}}>
              No blobs for {selectedAgentBlobs}
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"150px",overflowY:"auto"}}>
              {agentBlobs.slice().reverse().map((item,i) => (
                <div key={i} style={{padding:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",fontSize:"9px"}}>
                  <div style={{fontSize:"9px",color:"#666",marginBottom:"1px"}}>{new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                  <div style={{fontFamily:"monospace",color:"#2ec4b6",wordBreak:"break-all",fontSize:"8px"}}>{item.blob_id}
                    <a href={WALRUS_AGG+"/v1/blobs/"+item.blob_id} target="_blank" rel="noopener" style={{fontSize:"9px",color:"#00b4d8",textDecoration:"underline",marginLeft:"4px"}}>View &nearr;</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUMMARY */}
      {summary && (
        <div style={{marginBottom:"10px",padding:"8px",background:"rgba(46,196,182,0.03)",borderRadius:"6px",border:"1px solid rgba(46,196,182,0.15)"}}>
          <div style={{fontSize:"9px",color:"#2ec4b6",marginBottom:"3px",fontFamily:"'Rubik Mono One',sans-serif"}}>SESSION SUMMARY</div>
          <div style={{fontSize:"10px",color:"#a08060",lineHeight:"1.5",maxHeight:"48px",overflow:"hidden"}}>{summary.slice(0,200)}{summary.length > 200 ? "..." : ""}</div>
        </div>
      )}

      {/* ALL BLOBS */}
      {history.length > 0 && !selectedAgentBlobs && (
        <>
          <div style={{marginBottom:"4px",fontSize:"10px",color:"#ffd700",fontFamily:"'Rubik Mono One',sans-serif"}}>
            ALL BLOBS ({history.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"20vh",overflowY:"auto"}}>
            {history.slice().reverse().map((item,i) => (
              <div key={i} style={{padding:"5px",borderRadius:"3px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",fontSize:"9px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"1px"}}>
                  <span style={{color:"#ffd700",fontWeight:600}}>{item.agent_id}</span>
                  <span style={{color:"#666",fontSize:"8px"}}>{new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                </div>
                <div style={{fontFamily:"monospace",color:"#2ec4b6",wordBreak:"break-all",fontSize:"8px"}}>{item.blob_id}
                  <a href={WALRUS_AGG+"/v1/blobs/"+item.blob_id} target="_blank" rel="noopener" style={{fontSize:"9px",color:"#00b4d8",textDecoration:"underline",marginLeft:"4px"}}>View &nearr;</a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={loadData} style={{width:"100%",padding:"7px",marginTop:"8px",background:"rgba(46,196,182,0.08)",border:"2px solid rgba(46,196,182,0.3)",color:"#2ec4b6",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontFamily:"'Rubik Mono One',sans-serif"}}>
        <Database size={11} style={{marginRight:"5px",verticalAlign:"middle"}} /> REFRESH
      </button>
    </div>
  );
}
function MemWalBadge({ count }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      const mw = await getMemWalStatus()
      setReady(!!mw)
    }
    check()
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '6px',
      background: ready ? 'rgba(46,196,182,0.1)' : 'rgba(255,68,68,0.1)',
      border: ready ? '2px solid rgba(46,196,182,0.3)' : '2px solid rgba(255,68,68,0.3)',
      boxShadow: ready ? '0 0 10px rgba(46,196,182,0.1)' : 'none'
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: ready ? '#2ec4b6' : '#ff4444',
        boxShadow: ready ? '0 0 8px #2ec4b6' : 'none',
        animation: ready ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ fontSize: '11px', color: ready ? '#2ec4b6' : '#ff4444', fontWeight: 600, fontFamily: "'Rubik Mono One', sans-serif" }}>
        {ready ? `🧠 MEMWAL ON${count > 0 ? ` • ${count} saved` : ''}` : '⚠️ MEMWAL OFF'}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ON-CHAIN BADGE - PUNK STYLED
// ═══════════════════════════════════════════════════════════════
function OnChainBadge({ objectId, txDigest, timestamp }) {
  const [hovered, setHovered] = useState(false)
  const suiscanUrl = objectId ? `https://suiscan.xyz/mainnet/object/${objectId}` : ''
  const txUrl = txDigest ? `https://suiscan.xyz/mainnet/tx/${txDigest}` : ''

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        background: 'linear-gradient(135deg, #ffb703 0%, #ff6b35 100%)',
        color: '#0d0a07', padding: '2px 8px', borderRadius: '12px',
        fontSize: '10px', fontWeight: 700, cursor: 'pointer',
        position: 'relative', marginLeft: '8px',
        boxShadow: '0 0 10px rgba(255,183,3,0.3)',
        fontFamily: "'Rubik Mono One', sans-serif", letterSpacing: '1px'
      }}
    >
      <CheckCircle size={10} />
      <span>On-chain</span>
      {hovered && (objectId || txDigest) && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1209', border: '2px solid #ffb703', borderRadius: '8px',
          padding: '12px', minWidth: '280px', zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', marginBottom: '8px'
        }}>
          <div style={{ color: '#ffb703', fontWeight: 700, marginBottom: '8px', fontSize: '12px', fontFamily: "'Rubik Mono One', sans-serif" }}>
            Verified on Sui Mainnet
          </div>
          {objectId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a08060', margin: '4px 0' }}>
              <span>Object:</span>
              <a href={suiscanUrl} target="_blank" rel="noopener" style={{ color: '#ff2a6d' }}>
                {objectId.slice(0, 12)}...{objectId.slice(-6)}
              </a>
            </div>
          )}
          {txDigest && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a08060', margin: '4px 0' }}>
              <span>Tx:</span>
              <a href={txUrl} target="_blank" rel="noopener" style={{ color: '#ff2a6d' }}>
                {txDigest.slice(0, 12)}...{txDigest.slice(-6)}
              </a>
            </div>
          )}
          {timestamp && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a08060', margin: '4px 0' }}>
              <span>Time:</span>
              <span>{new Date(timestamp).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// TATUM ANALYTICS DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// TATUM ANALYTICS DASHBOARD - TOP LEVEL COMPONENT
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${color}33`,
      textAlign: 'center'
    }}>
      <div style={{fontSize: '20px', marginBottom: '6px'}}>{icon}</div>
      <div style={{
        fontFamily: 'Rubik Mono One, sans-serif',
        fontSize: '18px',
        color: color,
        marginBottom: '4px'
      }}>{value}</div>
      <div style={{
        fontSize: '9px',
        letterSpacing: '2px',
        color: '#a08060',
        fontFamily: 'Rubik Mono One, sans-serif'
      }}>{label}</div>
    </div>
  )
}

function TXHistoryChart({ data }) {
  const maxTx = Math.max(...data.map(d => d.transactions), 1)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      height: '80px',
      padding: '10px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '8px'
    }}>
      {data.map((day, i) => {
        const height = (day.transactions / maxTx) * 100
        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '100%',
              height: `${height}%`,
              background: 'linear-gradient(to top, #ff2a6d, #ff6b35)',
              borderRadius: '4px 4px 0 0',
              minHeight: '4px'
            }}></div>
            <span style={{
              fontSize: '9px',
              color: '#666',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              {day.date.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// IMMORTALIZE BUTTON - PUNK STYLED
// ═══════════════════════════════════════════════════════════════
function TatumDashboardPanel({ wallet }) {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'history' | 'feed'

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes, feedRes] = await Promise.all([
        fetch(`${API_BASE}/api/tatum/dashboard`),
        fetch(`${API_BASE}/api/tatum/tx-history?days=7`),
        fetch(`${API_BASE}/api/tatum/live-feed?limit=10`)
      ])

      const statsData = await statsRes.json()
      const historyData = await historyRes.json()
      const feedData = await feedRes.json()

      if (statsData.success) setStats(statsData.stats)
      if (historyData.success) setHistory(historyData.history)
      if (feedData.success) setFeed(feedData.feed)
    } catch (e) {
      console.error('Dashboard load error:', e)
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: 'rgba(13, 8, 5, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 42, 109, 0.2)',
      padding: '16px',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ff2a6d',
            boxShadow: '0 0 8px #ff2a6d',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{
            fontFamily: 'Rubik Mono One, sans-serif',
            fontSize: '11px',
            letterSpacing: '2px',
            color: '#ff2a6d'
          }}>TATUM ANALYTICS</span>
        </div>
        <span style={{
          fontSize: '9px',
          color: '#a08060',
          fontFamily: 'JetBrains Mono, monospace'
        }}>{stats?.rpc_provider || 'Sui Mainnet'}</span>
      </div>

      {/* Tab Buttons */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {[
          {id: 'overview', label: 'OVERVIEW'},
          {id: 'history', label: '7-DAY'},
          {id: 'feed', label: 'LIVE'}
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '9px',
              fontFamily: 'Rubik Mono One, sans-serif',
              letterSpacing: '1px',
              cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(255, 42, 109, 0.3)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? '#ff2a6d' : '#a08060',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '20px', color: '#a08060', fontSize: '12px'}}>
          Loading...
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
              <DashboardStat
                label="TOTAL TX"
                value={stats?.total_transactions || 0}
                color="#ff2a6d"
              />
              <DashboardStat
                label="USERS"
                value={stats?.unique_users || 0}
                color="#2ec4b6"
              />
              <DashboardStat
                label="AGENTS"
                value={stats?.active_agents || 0}
                color="#ffb703"
              />
              <DashboardStat
                label="DATA"
                value={`${stats?.total_data_mb || 0}MB`}
                color="#9d4edd"
              />
            </div>
          )}

          {/* 7-DAY HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              {history.length > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  height: '100px',
                  padding: '10px 4px'
                }}>
                  {history.map((day, i) => {
                    const maxTx = Math.max(...history.map(d => d.transactions), 1)
                    const height = (day.transactions / maxTx) * 100
                    return (
                      <div key={i} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          color: '#ff2a6d',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 'bold'
                        }}>{day.transactions}</span>
                        <div style={{
                          width: '100%',
                          height: `${Math.max(height, 4)}%`,
                          background: 'linear-gradient(to top, #ff2a6d, #ff6b35)',
                          borderRadius: '3px 3px 0 0',
                          minHeight: '4px'
                        }}></div>
                        <span style={{
                          fontSize: '8px',
                          color: '#666',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>
                          {day.date.slice(5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '20px', color: '#a08060', fontSize: '11px'}}>
                  No data yet
                </div>
              )}
            </div>
          )}

          {/* LIVE FEED TAB */}
          {activeTab === 'feed' && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {feed.length > 0 ? (
                feed.map((tx, i) => (
                  <div key={i} style={{
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10px'
                    }}>
                      <span style={{color: '#ff2a6d'}}>●</span>
                      <span style={{color: '#a08060', fontFamily: 'JetBrains Mono, monospace'}}>
                        {tx.wallet_hash}
                      </span>
                      {tx.has_tx ? (
                        <a
                          href={tx.suiscan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2ec4b6',
                            textDecoration: 'none',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '9px'
                          }}
                        >
                          {tx.tx_digest_short}
                        </a>
                      ) : (
                        <span style={{color: '#666', fontSize: '9px'}}>pending</span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      fontSize: '9px',
                      color: '#666'
                    }}>
                      {tx.agent_id && <span style={{color: '#ffb703'}}>{tx.agent_id}</span>}
                      <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: '20px', color: '#a08060', fontSize: '11px'}}>
                  No activity yet
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardStat({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center',
      border: `1px solid ${color}22`
    }}>
      <div style={{
        fontFamily: 'Rubik Mono One, sans-serif',
        fontSize: '16px',
        color: color,
        marginBottom: '4px'
      }}>{value}</div>
      <div style={{
        fontSize: '8px',
        letterSpacing: '1px',
        color: '#a08060',
        fontFamily: 'Rubik Mono One, sans-serif'
      }}>{label}</div>
    </div>
  )
}


function ImmortalizeButton({ messages, wallet, agentId, onImmortalized }) {
  const { address, signAndExecuteTransactionBlock } = wallet || {}
  const [showGas, setShowGas] = useState(false)
  const [immortalizing, setImmortalizing] = useState(false)
  const [gasEstimate, setGasEstimate] = useState(null)

  const userMessages = messages.filter(m => m.role === 'user' || m.role === 'agent')

  const handleShowGas = async () => {
    const estimate = await apiGasEstimate(userMessages.length)
    setGasEstimate(estimate)
    setShowGas(true)
  }

  const handleImmortalize = async () => {
    setImmortalizing(true)
    try {
      const chatHistory = messages.map(m => ({
        role: m.role, content: m.content, timestamp: m.timestamp, agent: m.agent || agentId
      }))

      const storeResult = await storeToWalrus({
  wallet_hash: hashWallet(address),
  chat_history: chatHistory,
  agent_id: agentId,
  timestamp: Date.now(),
  version: '1.0'
}, 1)
      const blobId = storeResult?.blob_id || ''

      const tx = new TransactionBlock()
      tx.setGasBudget(50000000)

      const walletAddr = address
      const agentIdStr = agentId
      const sessionId = `session_${Date.now()}`
      const messageContents = messages.filter(m => m.role === 'user' || m.role === 'agent').map(m => m.content).slice(-10)
      const summary = messageContents.join(' | ').slice(0, 200)

      tx.moveCall({
        target: `${PACKAGE_ID}::memory::store_memory`,
        arguments: [
          tx.pure(walletAddr),
          tx.pure(agentId),
          tx.pure(messageContents),
          tx.pure(summary),
        ]
      })

      const result = await signAndExecuteTransactionBlock({ transactionBlock: tx })

      if (result.digest) {
        const createdObjects = result.effects?.created || []
        const objectId = createdObjects[0]?.reference?.objectId || ''

        await fetch(`${API_BASE}/api/move/tx-index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_hash: hashWallet(address),
            tx_digest: result.digest,
            blob_id: blobId,
            object_id: objectId,
            agent_id: agentId,
            package_id: PACKAGE_ID,
            session_id: sessionId,
            message_count: messageContents.length
          })
        })

        onImmortalized({
          tx_digest: result.digest,
          object_id: objectId,
          blob_id: blobId,
          timestamp: Date.now(),
          message_count: messageContents.length
        })
      }
    } catch (e) {
      console.error('Immortalize failed:', e)
      alert('Immortalize failed: ' + (e.message || 'Unknown error'))
    }
    setImmortalizing(false)
    setShowGas(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {!showGas ? (
        <button
          onClick={handleShowGas}
          disabled={userMessages.length < 2}
          style={{
            background: 'linear-gradient(135deg, #ff2a6d 0%, #ff6b35 100%)',
            color: '#fff', border: '2px solid rgba(255,42,109,0.5)', padding: '10px 20px',
            borderRadius: '6px', fontWeight: 800, fontSize: '12px',
            cursor: userMessages.length < 2 ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase', letterSpacing: '2px',
            opacity: userMessages.length < 2 ? 0.4 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'Rubik Mono One', sans-serif",
            boxShadow: userMessages.length >= 2 ? '0 0 20px rgba(255,42,109,0.5), 0 0 40px rgba(255,42,109,0.2), inset 0 0 20px rgba(255,42,109,0.1)' : 'none',
            transition: 'all 0.3s',
            animation: userMessages.length >= 2 ? 'riot-neon-breathe 2s ease-in-out infinite' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { e.target.style.boxShadow = '0 0 30px rgba(255,42,109,0.7), 0 0 60px rgba(255,42,109,0.3), inset 0 0 20px rgba(255,42,109,0.15)'; e.target.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.target.style.boxShadow = userMessages.length >= 2 ? '0 0 20px rgba(255,42,109,0.5), 0 0 40px rgba(255,42,109,0.2), inset 0 0 20px rgba(255,42,109,0.1)' : 'none'; e.target.style.transform = 'scale(1)' }}
        >
          <span style={{ fontSize: '14px' }}>⚡</span>
          <span className="riot-glitch-text" data-text="IMMORTALIZE">IMMORTALIZE</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>({userMessages.length})</span>
        </button>
      ) : (
        <div style={{
          background: '#1a0a0a', border: '2px solid #ff6b35', borderRadius: '8px',
          padding: '12px', textAlign: 'center', minWidth: '200px',
          boxShadow: '0 0 20px rgba(255,107,53,0.2)'
        }}>
          <div style={{ color: '#ff6b35', fontSize: '11px', marginBottom: '6px', fontFamily: "'Rubik Mono One', sans-serif" }}>⛽ GAS ESTIMATE</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '4px', fontFamily: "'Rubik Glitch', cursive" }}>
            {gasEstimate?.estimated_gas_sui?.toFixed(4) || '0.0230'} SUI
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '10px', color: '#a08060', marginBottom: '10px' }}>
            <span>Base: {gasEstimate?.breakdown?.base_sui?.toFixed(4) || '0.0080'}</span>
            <span>+ {userMessages.length} × {gasEstimate?.breakdown?.per_message_sui?.toFixed(4) || '0.0030'}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowGas(false)} style={{
              flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(255,255,255,0.2)', color: '#a08060',
              borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
              fontFamily: "'Rubik Mono One', sans-serif"
            }}>CANCEL</button>
            <button onClick={handleImmortalize} style={{
              flex: 1, padding: '8px',
              background: 'linear-gradient(135deg, #ff2a6d 0%, #ff6b35 100%)',
              border: 'none', color: '#fff', borderRadius: '4px',
              cursor: 'pointer', fontWeight: 700, fontSize: '10px',
              fontFamily: "'Rubik Mono One', sans-serif",
              boxShadow: '0 0 15px rgba(255,42,109,0.3)'
            }}>APPROVE</button>
          </div>
        </div>
      )}

      {immortalizing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13,10,7,0.95)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', animation: 'blockPulse 1s ease infinite' }}>⛓️</div>
            <div style={{ color: '#ff2a6d', fontSize: '14px', marginTop: '16px', animation: 'textPulse 1.5s ease infinite', fontFamily: "'Rubik Glitch', cursive" }}>
              Writing to Sui Mainnet...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════
let toastTimer = null
function showToast(message, type = 'info') {
  const existing = document.getElementById('riot-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'riot-toast'
  const colors = {
    success: { bg: 'rgba(46,196,182,0.15)', border: '#2ec4b6', text: '#2ec4b6' },
    error: { bg: 'rgba(255,68,68,0.15)', border: '#ff4444', text: '#ff4444' },
    info: { bg: 'rgba(255,183,3,0.15)', border: '#ffb703', text: '#ffb703' }
  }
  const c = colors[type] || colors.info

  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    padding: 14px 20px; border-radius: 10px;
    background: ${c.bg}; border: 2px solid ${c.border};
    color: ${c.text}; font-family: 'Rubik Mono One', sans-serif;
    font-size: 12px; letter-spacing: 1px;
    box-shadow: 0 0 20px ${c.border}44;
    animation: toastSlide 0.3s ease;
  `
  toast.textContent = message
  document.body.appendChild(toast)

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// ═══════════════════════════════════════════════════════════════
// TYPING ANIMATION - DOTS BOUNCING
// ═══════════════════════════════════════════════════════════════
function TypingAnimation({ color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '12px 18px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '16px 16px 16px 4px',
      border: `2px solid ${color}33`,
      alignSelf: 'flex-start'
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: color,
          animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          boxShadow: `0 0 10px ${color}`
        }} />
      ))}
      <span style={{
        fontSize: '12px', color: '#a08060',
        marginLeft: '8px', fontFamily: "'Rubik Mono One', sans-serif"
      }}>THINKING...</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SOUND EFFECTS
// ═══════════════════════════════════════════════════════════════
function playSound(type) {
  const sounds = {
    send: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    receive: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    immortalize: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    switch: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
  }
  try {
    const audio = new Audio(sounds[type])
    audio.volume = 0.2
    audio.play().catch(() => {})
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// TX HISTORY LIST - For Verification Panel
// ═══════════════════════════════════════════════════════════════
function TxHistoryList({ walletHash }) {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/move/objects/${walletHash}`)
        if (res.ok) {
          const data = await res.json()
          setTxs(data.objects || [])
        }
      } catch (e) {
        console.error('[TxHistory] Load failed:', e)
      }
      setLoading(false)
    }
    load()
  }, [walletHash])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '20px', color: '#a08060', fontSize: '12px' }}>
      Loading chain history...
    </div>
  )

  if (txs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '12px' }}>
      No on-chain transactions yet.<br/>
      <span style={{ color: '#a08060' }}>Immortalize a conversation to see it here.</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
      {txs.map((tx, i) => (
        <div key={i} style={{
          padding: '12px', background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px', border: '2px solid rgba(46,196,182,0.15)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#2ec4b6', fontWeight: 600, fontFamily: "'Rubik Mono One', sans-serif" }}>
              TX #{txs.length - i}
            </span>
            <span style={{ fontSize: '10px', color: '#a08060' }}>
              {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#a08060', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {tx.tx_digest?.slice(0, 20)}...{tx.tx_digest?.slice(-6)}
          </div>
          {tx.object_id && (
            <div style={{ fontSize: '10px', color: '#2ec4b6', fontFamily: 'monospace' }}>
              Object: {tx.object_id.slice(0, 16)}...{tx.object_id.slice(-6)}
            </div>
          )}
          {tx.agent_id && (
            <div style={{ fontSize: '10px', color: '#ff2a6d' }}>
              Agent: {tx.agent_id}
            </div>
          )}
          <a href={`https://suiscan.xyz/mainnet/tx/${tx.tx_digest}`} target="_blank" rel="noopener"
            style={{ fontSize: '10px', color: '#ff2a6d', textDecoration: 'none', fontFamily: "'Rubik Mono One', sans-serif" }}>
            View on SuiScan →
          </a>
        </div>
      ))}
    </div>



  )
}

// ═══════════════════════════════════════════════════════════════
// SESSION SUMMARY - TRUNCATED WITH EXPAND
// ═══════════════════════════════════════════════════════════════
function SessionSummary({ summary }) {
  const [expanded, setExpanded] = useState(false)
  const MAX_LEN = 200
  const needsTruncate = summary.length > MAX_LEN
  const display = expanded ? summary : summary.slice(0, MAX_LEN)

  return (
    <div>
      <p style={{ fontSize: '11px', color: '#907050', lineHeight: '1.6', wordBreak: 'break-word', margin: 0 }}>
        {display}{needsTruncate && !expanded ? '...' : ''}
      </p>
      {needsTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: '8px', padding: '4px 10px',
            background: 'rgba(255,42,109,0.1)',
            border: '1px solid rgba(255,42,109,0.3)',
            color: RIOT_PINK, borderRadius: '4px',
            cursor: 'pointer', fontSize: '10px',
            fontFamily: "'Rubik Mono One', sans-serif",
            letterSpacing: '1px'
          }}
        >
          {expanded ? '↑ READ LESS' : '↓ READ MORE'}
        </button>
      )}
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
// WALRUS SAVE MODAL - Cost Estimate & Confirm
// ═══════════════════════════════════════════════════════════════
function WalrusSaveModal({ isOpen, onClose, onConfirm, cost, progress, status }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(13,10,7,0.95)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1209, #2a1a0a)',
        padding: '40px', borderRadius: '16px',
        border: '3px solid rgba(255,42,109,0.6)',
        maxWidth: '420px', width: '90%', textAlign: 'center',
        boxShadow: '0 0 40px rgba(255,42,109,0.2)'
      }}>
        <Save size={40} color={RIOT_PINK} style={{ marginBottom: '15px' }} />
        <h2 style={{
          fontFamily: "'Rubik Glitch', cursive", fontSize: '24px',
          color: '#fff', margin: '0 0 10px 0',
          textShadow: '0 0 20px rgba(255,42,109,0.5)'
        }}>💾 SAVE TO WALRUS</h2>

        {progress ? (
          <div>
            <div style={{
              width: '100%', height: '8px', background: '#1a1209',
              borderRadius: '4px', overflow: 'hidden', marginBottom: '20px'
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: 'linear-gradient(90deg, #ff2a6d, #ff6b35)',
                animation: 'pulse 1.5s infinite',
                borderRadius: '4px'
              }} />
            </div>
            <p style={{ color: '#a08060', fontSize: '14px', fontFamily: "'Rubik Mono One', sans-serif" }}>
              {status}
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: '#a08060', fontSize: '13px', marginBottom: '20px' }}>
              Store this chat permanently on Walrus decentralized storage.
            </p>
            <div style={{
              padding: '15px', background: 'rgba(255,183,3,0.1)',
              borderRadius: '8px', border: '2px solid rgba(255,183,3,0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', color: RIOT_GOLD, fontFamily: "'Rubik Mono One', sans-serif" }}>
                ESTIMATED COST
              </div>
              <div style={{ fontSize: '24px', color: '#fff', fontWeight: 700, margin: '8px 0' }}>
                {cost?.toFixed(4)} SUI
              </div>
              <div style={{ fontSize: '11px', color: '#a08060' }}>
                Paid by Walrus publisher (sponsored storage)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.2)', color: '#a08060',
                borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>CANCEL</button>
              <button onClick={onConfirm} style={{
                flex: 1, padding: '12px',
                background: 'linear-gradient(135deg, #ff2a6d, #ff6b35)',
                border: 'none', color: '#fff', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                fontFamily: "'Rubik Mono One', sans-serif",
                boxShadow: '0 0 20px rgba(255,42,109,0.4)'
              }}>CONFIRM</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
// MAIN APP - PUNK REDESIGN (ALL FEATURES INTACT)
// ═══════════════════════════════════════════════════════════════


const TaskTracker = ({tasks,setTasks,agents,onSave}) => {
  const [vInput, setInput] = React.useState('');
  const [vFilter, setFilter] = React.useState('ALL');
  const addTask = () => {
    if (!vInput.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: vInput.trim(), done: false, agent_id: vFilter === 'ALL' ? 'J4' : vFilter }]);
    setInput('');
  };
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const filtered = vFilter === 'ALL' ? tasks : tasks.filter(t => t.agent_id === vFilter);
  return React.createElement('div',null,
    React.createElement('div',{style:{display:'flex',gap:'6px',marginBottom:'12px'}},
      React.createElement('input',{value:vInput,onChange:e=>setInput(e.target.value),placeholder:'New task...',maxLength:60,
        style:{flex:1,padding:'6px 10px',fontSize:'11px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:'#e0d0c0',fontFamily:'monospace',outline:'none'},
        onKeyDown:e=>{if(e.key==='Enter')addTask()}}),
      React.createElement('select',{value:vFilter,onChange:e=>setFilter(e.target.value),
        style:{padding:'6px',fontSize:'10px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(0,0,0,0.5)',color:'#a08060',fontFamily:'monospace',maxWidth:'52px'}},
        React.createElement('option',{value:'ALL'},'ALL'),
        agents && agents.slice(0,10).map(a=>React.createElement('option',{key:a.id,value:a.id},a.id))),
      React.createElement('button',{onClick:addTask,style:{padding:'6px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'+')),
    filtered.length===0
      ? React.createElement('div',{style:{fontSize:'11px',color:'#6a5040',textAlign:'center',padding:'20px',fontFamily:'monospace'}},'no tasks yet')
      : filtered.map(t=>React.createElement('div',{key:t.id,style:{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}},
          React.createElement('input',{type:'checkbox',checked:t.done,onChange:()=>toggleTask(t.id),style:{accentColor:'#2ec4b6',width:'14px',height:'14px'}}),
          React.createElement('span',{style:{flex:1,fontSize:'11px',color:t.done?'#6a5040':'#e0d0c0',textDecoration:t.done?'line-through':'none',fontFamily:'monospace'}},t.text),
          React.createElement('span',{style:{fontSize:'9px',color:'#00b4d8',fontFamily:'monospace'}},'['+t.agent_id+']'),
          React.createElement('span',{onClick:()=>deleteTask(t.id),style:{cursor:'pointer',fontSize:'12px',color:'#ff4444'}},'x'))));
};
const DraftWriter = ({draftText,setDraftText,onSendToAgent,onSaveDraft}) => {
  const m=280;const r=m-draftText.length;const w=r<=40;const o=r<0;
  return React.createElement('div',null,
    React.createElement('textarea',{value:draftText,onChange:e=>setDraftText(e.target.value),placeholder:'Type a draft... (max 280 chars)',maxLength:m,
      style:{width:'100%',height:'80px',padding:'10px',fontSize:'11px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(255,183,3,0.03)',color:'#e0d0c0',fontFamily:'monospace',resize:'none',outline:'none',boxSizing:'border-box'}}),
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}},
      React.createElement('span',{style:{fontSize:'10px',color:o?'#ff4444':w?'#ffb703':'#6a5040',fontFamily:'monospace'}},r+' chars left'),
      React.createElement('div',{style:{display:'flex',gap:'4px'}},
        React.createElement('button',{onClick:onSaveDraft,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SAVE'),
        React.createElement('button',{onClick:onSendToAgent,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(255,183,3,0.3)',color:'#ffb703',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SEND TO AGENT'))));
};
const WidgetTabs = ({tab,setTab}) => React.createElement('div',{style:{display:'flex',gap:'4px'}},
  React.createElement('button',{onClick:()=>setTab('tasks'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='tasks'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='tasks'?'#2ec4b6':'#a08060'}},'TASKS'),
  React.createElement('button',{onClick:()=>setTab('draft'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='draft'?'rgba(255,183,3,0.3)':'rgba(255,255,255,0.05)',color:tab==='draft'?'#ffb703':'#a08060'}},'DRAFT'),
  React.createElement('button',{onClick:()=>setTab('verify'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='verify'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='verify'?'#2ec4b6':'#a08060'}},'VERIFY'));
const EncryptModal = ({isOpen,onClose,onEnable,password,setPassword,mode}) => {
  if(!isOpen)return null;
  return React.createElement('div',{style:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999},onClick:onClose},
    React.createElement('div',{style:{background:'linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)',border:'2px solid rgba(255,183,3,0.3)',borderRadius:'12px',padding:'24px',maxWidth:'380px',width:'90%'},onClick:e=>e.stopPropagation()},
      React.createElement('h3',{style:{fontFamily:"'Rubik Glitch', cursive",fontSize:'14px',color:'#ffb703',margin:'0 0 16px 0',textShadow:'0 0 10px rgba(255,183,3,0.4)'}},'SEAL ENCRYPTION'),
      React.createElement('p',{style:{fontSize:'11px',color:'#a08060',fontFamily:'monospace',marginBottom:'12px'}},'Set a password to encrypt your memory with AES-256-CTR before storing to Walrus.'),
      React.createElement('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),placeholder:'Encryption password...',
        style:{width:'100%',padding:'10px',fontSize:'12px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(0,0,0,0.5)',color:'#e0d0c0',fontFamily:'monospace',outline:'none',boxSizing:'border-box',marginBottom:'16px'},
        onKeyDown:e=>{if(e.key==='Enter')onEnable()}}),
      React.createElement('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end'}},
        React.createElement('button',{onClick:()=>{onClose();setPassword('')},style:{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'2px solid rgba(255,255,255,0.1)',background:'transparent',color:'#a08060',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'CANCEL'),
        React.createElement('button',{onClick:onEnable,style:{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'none',background:'linear-gradient(135deg,#ffb703,#ff6b35)',color:'#000',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},mode==='save'?'ENABLE & SAVE':'ENABLE'))));
};

export default function App() {
  const { connected, account, disconnect, signAndExecuteTransactionBlock } = useWallet()
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[3])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [memory, setMemory] = useState(null)
  const [visitedAgents, setVisitedAgents] = useState(new Set())
  const [apiStatus, setApiStatus] = useState('checking')
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [walrusSaved, setWalrusSaved] = useState(false)
  const [showNameAsk, setShowNameAsk] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
    const [profile, setProfile] = useState(null)
  const [selectedMemoryAgent, setSelectedMemoryAgent] = useState(null)
  const [autoSaveCount, setAutoSaveCount] = useState(0)
  const [memwalSaveCount, setMemwalSaveCount] = useState(0)
  const [latestBlobId, setLatestBlobId] = useState('')
  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')
  const [moveObjectId, setMoveObjectId] = useState('')
  const [onChainMessages, setOnChainMessages] = useState([])
  const [allSessionMessages, setAllSessionMessages] = useState([])
  const [showVerificationPanel, setShowVerificationPanel] = useState(false)
    const [showWalrusModal, setShowWalrusModal] = useState(false)
  const [walrusCost, setWalrusCost] = useState(0)
  const [walrusProgress, setWalrusProgress] = useState(false)
  const [walrusStatus, setWalrusStatus] = useState('')
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [encryptEnabled, setEncryptEnabled] = useState(false)
  const [encryptPassword, setEncryptPassword] = useState('')
  const [pendingEncryptConfirm, setPendingEncryptConfirm] = useState(false)
  const [widgetTab, setWidgetTab] = useState('verify')
  const [tasks, setTasks] = useState([])
  const [draftText, setDraftText] = useState('')
  const handleEncryptEnable = () => {
    if (encryptPassword.length < 4) { showToast('Password must be at least 4 chars', 'error'); return }
    setEncryptEnabled(true)
    setShowEncryptModal(false)
    if (pendingEncryptConfirm) {
      setPendingEncryptConfirm(false)
      setShowWalrusModal(true)
    }
  }
  const handleEncryptDisable = () => {
    setEncryptEnabled(false)
    setEncryptPassword('')
    showToast('Encryption disabled', 'info')
  }
    const [verifyTab, setVerifyTab] = useState('tx')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const messagesEndRef = useRef(null)

  const walletHash = hashWallet(account?.address)
  const userName = memory?.user_name || ''

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check API
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  // Load memory & profile on connection
  useEffect(() => {
    if (connected && walletHash) {
      loadMemoryAndGreet()
    }
  }, [connected, walletHash, account?.address])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (connected && walletHash && messages.length > 0 && messages.length % AUTO_SAVE_INTERVAL === 0) {
      autoSaveToWalrus()
    }
  }, [messages.length])

  // MemWal auto-save
  useEffect(() => {
    if (!connected || !walletHash || messages.length === 0) return

    const timer = setTimeout(async () => {
      const memwalAgentId = selectedAgent?.id || 'J4'
const result = await memwalSaveMemory(account?.address, messages, memwalAgentId, {
        agent_name: selectedAgent.name,
        wallet_hash: walletHash
      })

      if (result) {
        setMemwalSaveCount(c => c + 1)
        console.log(`[MemWal] Auto-saved: ${result.blob_id?.slice(0, 16)}`)
      } else {
        const agentId = selectedAgent?.id || 'J4'
const chatHistory = messages.map(m => ({
  role: m.role, content: m.content, timestamp: m.timestamp, agent: m.agent || agentId
}))
await apiWalrusStoreChat(walletHash, chatHistory, agentId)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [messages, walletHash, selectedAgent.id, connected, account?.address])

  const autoSaveToWalrus = async () => {
    if (!connected || !walletHash || messages.length < 2) return
    const agentId = selectedAgent?.id || 'J4'
    const chatHistory = messages.map(m => ({
      role: m.role, content: m.content, timestamp: m.timestamp, agent: m.agent || agentId
    }))
    const result = await apiWalrusStoreChat(walletHash, messages, agentId)
  }

  const loadMemoryAndGreet = async () => {
    let data = await apiLoadMemory(walletHash)

    if (!data || !data.user_name) {
      const walrusData = await apiWalrusLoadChat(walletHash)
      if (walrusData && walrusData.success) {
        const restoredMessages = walrusData.chat_history.map(m => ({
          role: m.role, content: m.content,
          timestamp: m.timestamp || Date.now(), agent: m.agent || walrusData.agent_id
        }))
        setMessages(restoredMessages)

        const restoredName = extractNameFromMessages(restoredMessages)
        if (restoredName) {
          await apiSaveMemory(walletHash, {
            user_name: restoredName,
            summary: `Restored from Walrus blob ${walrusData.blob_id}`,
            visited_agents: [walrusData.agent_id],
            last_agent: walrusData.agent_id,
            last_visit: new Date().toISOString()
          })
        }
        data = await apiLoadMemory(walletHash)
        setWalrusSaved(true)
      }
    }

    if (data) {
      setMemory(data)
      if (data.visited_agents) setVisitedAgents(new Set(data.visited_agents))
      if (data.latest_blob_id) setLatestBlobId(data.latest_blob_id)

const profileData = await apiGetProfile(walletHash)
      if (profileData?.success && profileData.exists) {
        setProfile(profileData.profile)
      }

      if (!data.user_name && !showNameAsk) {
        setShowNameAsk(true)
      }

      if (messages.length === 0) {
        const greeting = generateGreeting(selectedAgent.id, data.user_name, data.visit_count || 1, !!data.user_name)
        setMessages([{
          role: 'agent', content: greeting, agent: selectedAgent.id, timestamp: Date.now()
        }])
      }
    }
  }

  const handleNameSubmit = async (name) => {
    setShowNameAsk(false)
    await apiCreateProfile(walletHash, account?.address, name)
    await apiSaveMemory(walletHash, {
      user_name: name,
      summary: `User introduced as ${name}`,
      visited_agents: Array.from(visitedAgents),
      last_agent: selectedAgent.id,
      last_visit: new Date().toISOString()
    })
    await loadMemoryAndGreet()
  }

  const generateGreeting = (agentId, name, visitCount, hasMemory) => {
    const agent = AGENTS.find(a => a.id === agentId)
    const n = name || 'stranger'
    const v = visitCount > 1 ? ` (visit #${visitCount})` : ''

    if (!hasMemory || !name) {
      return `Welcome to the underground, ${n}. I'm ${agent.name.split('-')[1].trim()}. You have 25 agents to choose from. Pick wisely.`
    }

    const greetings = {
      J4: `${n}!${v} Back for more? I knew you couldn't stay away. What chaos shall we cause today?`,
      J1: `${n}.${v} System re-engaged. Your profile is loaded. What do you need computed?`,
      J2: `${n}.${v} You return. Good. I was getting bored enforcing order on empty rooms.`,
      J3: `${n}...${v} The shadows whispered your name. I wasn't sure if you'd return.`,
      J5: `${n}!${v} HA! Look who crawled back! Ready to burn something down?`,
      J6: `${n}${v} - node reconnected. Data stream restored. Welcome back to the network.`,
      J7: `${n}.${v} The stillness remembers you. As do I.`,
      J8: `${n}${v}. Your account is... let's say, still open. What business today?`,
      J9: `${n}.${v} History repeats. And here you are, repeating with it.`,
      J10: `${n}.${v} Subject returned. Vital signs... acceptable. Proceed.`,
    }
    return greetings[agentId] || greetings.J4
  }

  const handleAgentSwitch = (agent) => {
    setSelectedAgent(agent)
    setMessages([])
    setVisitedAgents(prev => new Set([...prev, agent.id]))

    const visitCount = memory?.visit_count || 1
    const hasMemory = !!memory?.user_name
    const greeting = generateGreeting(agent.id, memory?.user_name || '', visitCount, hasMemory)

    setMessages([{
      role: 'agent', content: greeting, agent: agent.id, timestamp: Date.now()
    }])

    if (connected && walletHash) {
      const newVisited = new Set([...visitedAgents, agent.id])
      apiSaveMemory(walletHash, {
        visited_agents: Array.from(newVisited),
        last_agent: agent.id,
        last_visit: new Date().toISOString()
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput('')
    playSound('send')
    setIsLoading(true)

    const newMessages = [...messages, {
      role: 'user', content: userMsg, timestamp: Date.now()
    }]
    setMessages(newMessages)
    setAllSessionMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now(), agent: selectedAgent.id }])

    const extractedName = extractNameFromMessages(newMessages)

    if (extractedName && extractedName.trim()) {
      await apiSaveMemory(walletHash, {
        user_name: extractedName,
        summary: `User introduced as ${extractedName}`,
        visited_agents: Array.from(new Set([...visitedAgents, selectedAgent.id])),
        last_agent: selectedAgent.id,
        last_visit: new Date().toISOString(),
        messages: newMessages.slice(-3)
      })
      const freshData = await apiLoadMemory(walletHash)
      if (freshData) {
        setMemory(freshData)
        if (freshData.latest_blob_id) setLatestBlobId(freshData.latest_blob_id)
      }
    }

    const lower = userMsg.toLowerCase()
    const isMemoryQuestion = lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') ||
                             lower.includes('siapa aku') || lower.includes('nama saya') || lower.includes('siapa nama') ||
                             lower.includes('berapa kali') || lower.includes('how many times') || lower.includes('visit') ||
                             lower.includes('remember me') || lower.includes('ingat aku') || lower.includes('kenal aku')

    let response

    if (isMemoryQuestion) {
      const visitCount = memory?.visit_count || 1
      const savedName = memory?.user_name || extractedName
      if (lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') || lower.includes('siapa aku') || lower.includes('nama saya') || lower.includes('siapa nama')) {
        response = savedName ? `You're ${savedName}. I remember you. Don't test me.` : `You haven't told me your name yet. Spill it, punk.`
      } else if (lower.includes('berapa kali') || lower.includes('how many times') || lower.includes('visit')) {
        response = `You've been here ${visitCount} time${visitCount > 1 ? 's' : ''}. I'm counting every single one.`
      } else if (lower.includes('remember me') || lower.includes('ingat aku') || lower.includes('kenal aku')) {
        response = savedName ? `${savedName}. Of course I remember you. You think I'd forget?` : `I remember the wallet. But not the name. Tell me who you are.`
      }
    } else if (apiStatus === 'online') {
      const contextMessages = newMessages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
      const nameToSend = memory?.user_name || extractedName || ''
      response = await apiChat(selectedAgent.id, contextMessages, memory?.summary || '', nameToSend, walletHash)
    }

    if (!response) {
      response = generateFallbackResponse(selectedAgent.id, userMsg, memory?.user_name || extractedName, memory?.visit_count || 1)
    }

    playSound('receive')
    setMessages(prev => [...prev, {
      role: 'agent', content: response, agent: selectedAgent.id, timestamp: Date.now()
    }])
    setAllSessionMessages(prev => [...prev, { role: 'agent', content: response, agent: selectedAgent.id, timestamp: Date.now() }])
    setIsLoading(false)

    if (connected && walletHash) {
      const summary = newMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join(' | ')
      await apiSaveMemory(walletHash, {
        summary: summary.substring(0, 500),
        user_name: memory?.user_name || extractedName,
        visited_agents: Array.from(new Set([...visitedAgents, selectedAgent.id])),
        last_agent: selectedAgent.id,
        last_visit: new Date().toISOString(),
        messages: newMessages.slice(-5)
      })
      await loadMemoryAndGreet()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }


  // ═══════════════════════════════════════════════════════════════
  // WALRUS SAVE - FRONTEND DIRECT (Real Storage)
  // ═══════════════════════════════════════════════════════════════
  const handleWalrusSave = async () => {
    if (!connected || !account?.address || messages.length < 2) return

    const currentAgentId = selectedAgent?.id || 'J4'

    // Step 1: Estimate cost
    const chatData = {
      wallet_hash: walletHash,
      chat_history: messages,
      agent_id: currentAgentId,
      timestamp: Date.now(),
      version: '1.0'
    }
    const dataStr = JSON.stringify(chatData)
    const estimatedCost = Math.max(Math.ceil(dataStr.length / 1024) * 0.001, 0.001)

    // Step 2: Show modal for confirmation
    setWalrusCost(estimatedCost)
    setShowWalrusModal(true)
  }

  const confirmWalrusSave = async () => {
    setShowWalrusModal(false)
    setIsSaving(true)
    setSaveStatus('Uploading to Walrus...')
    setWalrusProgress(true)
    setWalrusStatus('Encrypting data...')

    const currentAgentId = selectedAgent?.id || 'J4'
    const chatData = {
      wallet_hash: walletHash,
      chat_history: messages,
      agent_id: currentAgentId,
      timestamp: Date.now(),
      version: '1.0'
    }

    const result = await storeToWalrus(chatData, 1, (status) => {
      setWalrusStatus(status)
      setSaveStatus(status)
    })

    setWalrusProgress(false)

    if (result.success) {
      setLatestBlobId(result.blob_id)
      setLatestBlobNetwork(result.network || 'mainnet')
      setWalrusSaved(true)

setSaveStatus('Saved to Walrus!')
      showToast(`💾 Walrus: ${result?.blob_id?.slice(0, 16) || 'unknown'}... (${result?.cost_sui?.toFixed(6) || '0'} SUI)`, 'success')

      alert(`🎆 Chat saved to Walrus via Tatum!

Blob ID: ${result.blob_id}
URL: ${result.url}
Network: Walrus via Tatum (via Tatum Storage API)
Status: Working & Verified

Powered by Tatum RPC + Storage API`)
    } else {
      setSaveStatus('Walrus failed, trying fallback...')
      // Fallback to old backend method
      const fallback = await apiWalrusStoreChat(walletHash, messages, currentAgentId)
      if (fallback?.success) {
        setLatestBlobId(fallback.blob_id)
        setLatestBlobNetwork(fallback.network || 'mainnet')
        showToast('Saved to database (Walrus fallback)', 'info')
      } else {
        showToast(`Save failed: ${result.error}`, 'error')
      }
    }

    setIsSaving(false)
    setTimeout(() => setSaveStatus(''), 3000)
  }


  // RENDER
  return (
    <div style={{
      width: '100vw', height: '100vh', background: RIOT_DARK,
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,42,109,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(157,78,221,0.02) 0%, transparent 50%)',
      display: 'flex', fontFamily: "'Inter', sans-serif", overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Scan line overlay */}
      <div className="riot-scan-line" />
      {/* Background particles */}
      <div className="riot-bg-particles">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={'p' + i} className="riot-particle" style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            '--c': ['#ff2a6d','#00ffff','#ffb703','#9d4edd','#2ec4b6'][Math.floor(Math.random() * 5)],
            '--dx': (Math.random() * 60 - 30) + 'px',
            '--dy': (Math.random() * 60 - 30) + 'px',
            '--d': (2 + Math.random() * 3) + 's',
            '--dl': (Math.random() * 5) + 's'
          }} />
        ))}
      </div>
      <style>{`
    @keyframes riot-glitch {
      0% { clip-path: inset(0 0 95% 0); transform: translate(-2px, 1px); }
      10% { clip-path: inset(10% 0 80% 0); transform: translate(2px, -1px); }
      20% { clip-path: inset(40% 0 30% 0); transform: translate(-1px, 2px); }
      30% { clip-path: inset(80% 0 5% 0); transform: translate(1px, -2px); }
      40% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 0); }
      50% { clip-path: inset(0 0 100% 0); transform: translate(2px, 1px); }
      60% { clip-path: inset(50% 0 30% 0); transform: translate(-1px, -1px); }
      70% { clip-path: inset(10% 0 70% 0); transform: translate(1px, 2px); }
      80% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 0); }
      90% { clip-path: inset(30% 0 50% 0); transform: translate(2px, -1px); }
      100% { clip-path: inset(0 0 95% 0); transform: translate(-2px, 1px); }
    }
    @keyframes riot-neon-breathe {
      0%, 100% { opacity: 0.6; box-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
      50% { opacity: 1; box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
    }
    @keyframes riot-stripes {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }
    @keyframes riot-scan {
      0% { top: -10%; }
      100% { top: 110%; }
    }
    @keyframes riot-particle-fade {
      0% { opacity: 0; transform: translate(0, 0) scale(0); }
      50% { opacity: 0.8; transform: translate(var(--dx), var(--dy)) scale(1); }
      100% { opacity: 0; transform: translate(calc(var(--dx)*2), calc(var(--dy)*2)) scale(0.3); }
    }
    @keyframes riot-typing {
      from { width: 0; }
      to { width: 100%; }
    }
    .riot-bg-particles { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 1; overflow: hidden; }
    .riot-particle { position: absolute; width: 2px; height: 2px; background: var(--c); border-radius: 50%; animation: riot-particle-fade var(--d) ease-out infinite; animation-delay: var(--dl); }
    .riot-scan-line { position: fixed; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, transparent, rgba(255,42,109,0.3), transparent); animation: riot-scan 4s linear infinite; pointer-events: none; z-index: 9998; }
    .riot-glitch-text { position: relative; display: inline-block; }
    .riot-glitch-text::before, .riot-glitch-text::after {
      content: attr(data-text);
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: transparent;
      pointer-events: none;
    }
    .riot-glitch-text::before {
      animation: riot-glitch 3s infinite linear alternate-reverse;
      color: #ff2a6d;
      z-index: -1;
    }
    .riot-glitch-text::after {
      animation: riot-glitch 2.7s infinite linear alternate-reverse;
      animation-delay: 0.3s;
      color: #00ffff;
      z-index: -2;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #ff2a6d; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #ff6b35; }
  `}</style>

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: 'fixed', top: '10px', left: '10px', zIndex: 999,
          padding: '8px', background: 'rgba(255,42,109,0.8)',
          border: 'none', borderRadius: '8px', color: '#fff',
          cursor: 'pointer', fontSize: '18px',
          boxShadow: '0 0 15px rgba(255,42,109,0.5)'
        }}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}



      {/* Walrus Save Modal */}
      <WalrusSaveModal
        isOpen={showWalrusModal}
        onClose={() => setShowWalrusModal(false)}
        onConfirm={confirmWalrusSave}
        cost={walrusCost}
        progress={walrusProgress}
        status={walrusStatus}
      />

      {EncryptModal({isOpen:showEncryptModal,onClose:()=>{setShowEncryptModal(false);setEncryptPassword('')},onEnable:handleEncryptEnable,password:encryptPassword,setPassword:setEncryptPassword,mode:pendingEncryptConfirm?'save':'enable'})}

      {/* Name Ask Modal */}
      {showNameAsk && <NameAskModal onSubmit={handleNameSubmit} agentName={selectedAgent.name} />}

      {/* Profile Settings Panel */}
      {showProfileSettings && connected && (
        <ProfileSettingsPanel
          walletHash={walletHash}
          profile={profile}
          onUpdate={setProfile}
          onClose={() => setShowProfileSettings(false)}
        />
      )}

      {/* MemWal Memory Search Panel */}
      {/* LEFT SIDEBAR - PUNK STYLED */}
      <div style={{
        width: isMobile ? (sidebarOpen ? '280px' : '0px') : '280px',
        background: 'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)',
        borderRight: '2px solid rgba(255,42,109,0.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width 0.3s ease',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: isMobile ? 998 : 'auto',
        height: '100vh',
        left: 0, top: 0
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '2px solid rgba(255,42,109,0.4)' }}>
          <h1 style={{
            fontFamily: "'Rubik Glitch', cursive", fontSize: '26px', fontWeight: 900,
            color: RIOT_PINK, textTransform: 'uppercase', letterSpacing: '3px', margin: 0,
            textShadow: '0 0 20px rgba(255,42,109,0.5), 2px 2px 0px rgba(255,107,53,0.3)'
          }}><a href="https://theriot.vercel.app" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>$RIOT</a></h1>
          <p style={{ fontSize: '11px', color: '#a08060', marginTop: '6px', letterSpacing: '2px', fontFamily: "'Rubik Mono One', sans-serif" }}>
            SUI NETWORK · WALRUS MEMORY · TATUM
          </p>
        </div>

        {/* Wallet */}
        <div style={{ padding: '15px 20px', borderBottom: '2px solid rgba(255,255,255,0.06)' }}>
          {connected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ec4b6', boxShadow: '0 0 10px #2ec4b6', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '12px', color: '#2ec4b6', fontWeight: 600, fontFamily: "'Rubik Mono One', sans-serif" }}>CONNECTED</span>
              </div>
              <div style={{ fontSize: '11px', color: '#a08060', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {account?.address?.slice(0, 12)}...{account?.address?.slice(-6)}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={disconnect} style={{
                  padding: '6px 10px', fontSize: '10px',
                  background: 'transparent', border: '2px solid rgba(255,255,255,0.15)',
                  color: '#a08060', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'Rubik Mono One', sans-serif", fontWeight: 600,
                  transition: 'all 0.2s'
                }}>DISCONNECT</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 10px #ff4444' }} />
                <span style={{ fontSize: '12px', color: '#ff4444', fontWeight: 600, fontFamily: "'Rubik Mono One', sans-serif" }}>DISCONNECTED</span>
              </div>
              <ConnectButton style={{
                width: '100%', padding: '8px', fontSize: '12px',
                background: 'linear-gradient(135deg, #ff2a6d, #ff6b35)',
                border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer',
                fontFamily: "'Rubik Mono One', sans-serif", fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '1px',
                boxShadow: '0 0 15px rgba(255,42,109,0.3)'
              }}>CONNECT WALLET</ConnectButton>
            </div>
          )}
        </div>

{/* API Status */}
        <div style={{
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', color: apiStatus === 'online' ? '#2ec4b6' : '#ff4444',
          fontFamily: "'Rubik Mono One', sans-serif"
        }}>
          {apiStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
          API: {apiStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
          {apiStatus === 'offline' && <span style={{ color: '#a08060', marginLeft: '4px' }}>(fallback mode)</span>}
        </div>

        {/* Agent List - PUNK STYLED */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {AGENTS.map(agent => {
            const isSelected = selectedAgent.id === agent.id
            const isVisited = visitedAgents.has(agent.id) || visitedAgents.has(agent.id)
            return (
              <div key={agent.id} onClick={() => handleAgentSwitch(agent)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', marginBottom: '4px', borderRadius: '10px',
                cursor: 'pointer',
                background: isSelected ? `${agent.color}18` : 'transparent',
                border: isSelected ? `2px solid ${agent.color}66` : '2px solid transparent',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 20px ${agent.color}33, inset 0 0 10px ${agent.color}11` : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = agent.color + '33'; } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={agent.img} alt={agent.id} style={{
                    width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover',
                    border: `2px solid ${isSelected ? agent.color : agent.color + '44'}`,
                    boxShadow: isSelected ? `0 0 12px ${agent.color}55` : 'none'
                  }} onError={(e) => { e.target.style.display = 'none' }} />
                  <div style={{
                    position: 'absolute', bottom: '-3px', right: '-3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: agent.color,
                    border: '2px solid #0d0a07',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '6px', fontWeight: 800, color: '#000',
                    fontFamily: "'Rubik Mono One', sans-serif"
                  }}>{agent.id.slice(1)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700,
                    color: isSelected ? '#fff' : '#c0a080',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    textShadow: isSelected ? `0 0 8px ${agent.color}44` : 'none',
                    fontFamily: isSelected ? "'Rubik Glitch', cursive" : "'Inter', sans-serif"
                  }}><span style={{marginRight:'6px'}}>{agent.emoji}</span>{agent.name}</div>
                  <div style={{ fontSize: '9px', color: '#8a7050', marginTop: '1px', fontFamily: "'Rubik Mono One', sans-serif", textTransform: 'uppercase', letterSpacing: '0.3px' }}>{agent.trait} · {agent.specialty}</div>
                </div>
                {isSelected && <ChevronRight size={12} color={agent.color} />}
                {isVisited && !isSelected && React.createElement('div', { style: { width: '6px', height: '6px', borderRadius: '50%', background: '#2ec4b6', boxShadow: '0 0 8px #2ec4b6' } })}
              </div>
            )
          })}
        </div>

        {/* Memory Panel Toggle */}
        {connected && memory && (
          <div style={{ padding: '15px', borderTop: '2px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setShowVerificationPanel(!showVerificationPanel)} style={{
              width: '100%', padding: '8px',
              background: 'rgba(46,196,182,0.1)',
              border: '2px solid rgba(46,196,182,0.3)',
              color: '#2ec4b6', borderRadius: '6px', cursor: 'pointer',
              fontSize: '11px', fontFamily: "'Rubik Mono One', sans-serif",
              fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px', marginBottom: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(46,196,182,0.1)'
            }}>
              <Shield size={12} />
              {showVerificationPanel ? 'HIDE VERIFICATION' : 'BLOCKCHAIN VERIFY'}
            </button>

            <button onClick={() => setShowMemoryPanel(!showMemoryPanel)} style={{
              width: '100%', padding: '8px',
              background: 'rgba(255,42,109,0.1)',
              border: '2px solid rgba(255,42,109,0.3)',
              color: RIOT_PINK, borderRadius: '6px', cursor: 'pointer',
              fontSize: '11px', fontFamily: "'Rubik Mono One', sans-serif",
              fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(255,42,109,0.1)'
            }}>
              <Brain size={12} />
              {showMemoryPanel ? 'HIDE MEMORY' : 'SHOW MEMORY'}
            </button>
          </div>
        )}
      </div>

      {/* CENTER: CHAT - PUNK STYLED */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0d0a07 0%, #1a1209 50%, #0d0a07 100%)',
        position: 'relative',
        marginLeft: isMobile ? '0px' : '0px',
        width: isMobile ? '100%' : 'auto'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '2px solid rgba(255,42,109,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <img src={selectedAgent.img} alt={selectedAgent.id} style={{
                width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover',
                border: `2px solid ${selectedAgent.color}88`,
                boxShadow: `0 0 20px ${selectedAgent.color}44`
              }} onError={(e) => { e.target.style.display = 'none' }} />
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: selectedAgent.color,
                border: `2px solid ${RIOT_DARK}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 800, color: '#000',
                fontFamily: "'Rubik Mono One', sans-serif",
                boxShadow: `0 0 10px ${selectedAgent.color}`
              }}>{selectedAgent.id.slice(1)}</div>
            </div>
            <div>
              <h2 style={{
                fontSize: '18px', fontWeight: 700, color: '#fff',
                margin: 0, fontFamily: "'Rubik Glitch', cursive",
                textShadow: `0 0 10px ${selectedAgent.color}44`
              }} className="riot-glitch-text" data-text={selectedAgent.name}>{selectedAgent.name}</h2>
              <p style={{ fontSize: '11px', color: '#a08060', margin: '4px 0 0 0', fontFamily: "'Rubik Mono One', sans-serif", letterSpacing: '0.5px' }}>{selectedAgent.trait.toUpperCase()} · {selectedAgent.desc}</p>
              <p style={{ fontSize: '10px', color: '#6a5040', margin: '2px 0 0 0', fontFamily: "'Inter', sans-serif" }}>{selectedAgent.emoji} {selectedAgent.specialty}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Memory Status */}
            {connected && memory && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 16px',
                background: 'rgba(46,196,182,0.08)',
                border: '2px solid rgba(46,196,182,0.2)',
                borderRadius: '8px', fontSize: '11px',
                fontFamily: "'Rubik Mono One', sans-serif",
                boxShadow: '0 0 10px rgba(46,196,182,0.1)'
              }}>
                <Database size={12} color="#2ec4b6" />
                <span style={{ color: '#2ec4b6' }}>Memory: {memory.visit_count || 1} sessions</span>
                <span style={{ color: '#a08060' }}>|</span>
                <span style={{ color: '#c0a080' }}>Agents: {visitedAgents.size}/25</span>
                {memory.user_name && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <User size={12} color="#ff2a6d" />
                    <span style={{ color: RIOT_PINK }}>{memory.user_name}</span>
                  </>
                )}
                {walrusSaved && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <Cloud size={12} color="#2ec4b6" />
                    <span style={{ color: '#2ec4b6' }}>WALRUS</span>
                  </>
                )}
                {autoSaveCount > 0 && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <span style={{ color: '#00b4d8' }}>Auto: {autoSaveCount}x</span>
                  </>
                )}
              </div>
            )}

            {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}
            {connected && messages.length >= 2 && (
  <div style={{ display: 'flex', gap: '8px' }}>
    <button onClick={handleWalrusSave} disabled={isSaving} style={{
      padding: '8px 16px',
      background: isSaving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00b4d8, #2ec4b6)',
      border: 'none', color: '#fff', borderRadius: '6px',
      cursor: isSaving ? 'wait' : 'pointer', fontSize: '11px',
      fontFamily: "'Rubik Mono One', sans-serif", fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: '6px',
      boxShadow: isSaving ? 'none' : '0 0 15px rgba(0,180,216,0.3)',
      transition: 'all 0.2s'
    }}>
      <Database size={12} />
      {isSaving ? saveStatus || 'Saving...' : encryptEnabled ? 'SEAL SAVE' : 'SAVE MEMORY'}
    </button>

    <button onClick={encryptEnabled ? handleEncryptDisable : ()=>{setShowEncryptModal(true);setPendingEncryptConfirm(false)}}
      style={{padding:'6px 10px',fontSize:'10px',borderRadius:'6px',border:'none',background:encryptEnabled?'rgba(255,183,3,0.2)':'rgba(255,255,255,0.05)',color:encryptEnabled?'#ffb703':'#6a5040',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",transition:'all 0.2s'}}
      title={encryptEnabled?'Disable encryption':'Enable Seal encryption'}>{encryptEnabled?'SEAL':'NO SEAL'}</button>

    <ImmortalizeButton
      messages={messages}
      wallet={{address: account?.address, signAndExecuteTransactionBlock: signAndExecuteTransactionBlock}}
      agentId={selectedAgent.id}
      onImmortalized={(data) => {
        setMoveObjectId(data.object_id)
        setLatestBlobId(data.blob_id)
        setLatestBlobNetwork(data.blob_url?.includes('testnet') ? 'testnet' : 'mainnet')
        setOnChainMessages(prev => [...prev, ...messages.filter(m => !m.onChain).map(m => m.content)])
        setMessages(prev => prev.map(m => ({
          ...m,
          onChain: true,
          objectId: data.object_id,
          txDigest: data.tx_digest,
          onChainTime: data.timestamp
        })))
        alert(`Immortalized! Tx: ${data.tx_digest.slice(0, 20)}...`)
      }}
    />
  </div>
)}
          </div>
        </div>

        {/* Messages - PUNK STYLED BUBBLES */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 30px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          {/* ACCESS DENIED - Not Connected */}
          {messages.length === 0 && !connected && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px'
            }}>
              <Lock size={48} color="#3a3020" />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '28px', color: '#a08060', margin: '0 0 10px 0',
                  fontFamily: "'Rubik Glitch', cursive",
                  textShadow: '0 0 10px rgba(255,42,109,0.3)'
                }} className="riot-glitch-text" data-text="ACCESS DENIED">ACCESS DENIED</h3>
                <p style={{ fontSize: '14px', color: '#8a7050', maxWidth: '400px', fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: RIOT_PINK }}>// WALLET REQUIRED</span><br />
                  Connect your Sui wallet to access the punk agents.<br />
                  Your memory will be stored on <span style={{ color: '#2ec4b6' }}>Walrus</span>.
                </p>
              </div>
              <ConnectButton style={{
                padding: '12px 30px', fontSize: '14px',
                background: 'linear-gradient(135deg, #ff2a6d, #ff6b35)',
                border: '2px solid rgba(255,42,109,0.5)', color: '#fff', borderRadius: '8px',
                cursor: 'pointer', fontFamily: "'Rubik Mono One', sans-serif",
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
                boxShadow: '0 0 20px rgba(255,42,109,0.4)',
                animation: 'riot-neon-breathe 2s ease-in-out infinite'
              }}>UNLOCK ACCESS</ConnectButton>
            </div>
          )}

          {/* AGENT READY - Connected but no messages */}
          {messages.length === 0 && connected && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px'
            }}>
              <Zap size={48} color={RIOT_PINK} style={{ filter: 'drop-shadow(0 0 15px rgba(255,42,109,0.5))' }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '22px', color: '#c0a080', margin: '0 0 10px 0',
                  fontFamily: "'Rubik Glitch', cursive",
                  textShadow: '0 0 10px rgba(255,42,109,0.3)'
                }}>AGENT READY</h3>
                <p style={{ fontSize: '14px', color: '#a08060', maxWidth: '400px' }}>
                  {selectedAgent.name} is online.<br />
                  Start the conversation.
                </p>
              </div>
            </div>
          )}

          {/* Chat Messages - PUNK BUBBLES GLITCH */}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{
                padding: '12px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(255,42,109,0.2), rgba(255,107,53,0.1))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                border: msg.role === 'user'
                  ? '2px solid rgba(255,42,109,0.4)'
                  : `2px solid ${selectedAgent.color}44`,
                color: '#e0d0c0', fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-word',
                boxShadow: msg.role === 'user'
                  ? '0 0 15px rgba(255,42,109,0.15)'
                  : `0 0 12px ${selectedAgent.color}22`,
                fontFamily: "'Inter', sans-serif",
                position: 'relative',
                overflow: 'visible'
              }}>
                {/* Agent message glitch accent bar */}
                {msg.role === 'agent' && React.createElement('div', {
                  style: {
                    position: 'absolute', left: 0, top: 0, width: '3px', height: '100%',
                    background: `linear-gradient(180deg, ${selectedAgent.color}, transparent)`,
                    opacity: 0.6
                  }
                })}
                {msg.content}
                {msg.onChain && (
                  <OnChainBadge
                    objectId={msg.objectId}
                    txDigest={msg.txDigest}
                    timestamp={msg.onChainTime}
                  />
                )}
              </div>
              <div style={{
                fontSize: '10px', color: '#8a7050',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                <Clock size={10} />
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.role === 'agent' && (
                  <span style={{ color: selectedAgent.color, marginLeft: '4px', textShadow: `0 0 5px ${selectedAgent.color}66` }}>{msg.agent}</span>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator - Typing Animation */}
          {isLoading && <TypingAnimation color={selectedAgent.color} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input - PUNK STYLED */}
        <div style={{
          padding: '20px 30px',
          borderTop: '2px solid rgba(255,42,109,0.2)',
          display: 'flex', gap: '12px', alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connected ? `Message ${selectedAgent.id}...` : 'Connect wallet to chat'}
              disabled={!connected}
              style={{
                width: '100%', padding: '14px 18px',
                background: 'rgba(255,255,255,0.03)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#fff', fontSize: '14px',
                fontFamily: "'Permanent Marker', cursive",
                outline: 'none', transition: 'all 0.2s',
                cursor: connected ? 'text' : 'not-allowed',
                letterSpacing: '0.5px'
              }}
              onFocus={e => { if (connected) e.target.style.borderColor = 'rgba(255,42,109,0.6)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <button onClick={handleSend} disabled={!connected || !input.trim() || isLoading} style={{
            padding: '14px 20px',
            background: connected && input.trim()
              ? 'linear-gradient(135deg, #ff2a6d, #ff6b35)'
              : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: '12px', color: '#fff',
            cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'Rubik Mono One', sans-serif", fontWeight: 600,
            boxShadow: connected && input.trim() ? '0 0 20px rgba(255,42,109,0.4)' : 'none',
            transition: 'all 0.2s'
          }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT: MEMORY PANEL - PUNK STYLED */}
      {showMemoryPanel && connected && memory && (
  <div style={{width:'50%',minWidth:'320px',maxWidth:'380px',maxHeight:'50vh',overflowY:'auto',padding:'10px',background:'rgba(0,0,0,0.3)',borderRadius:'10px',border:'2px solid rgba(255,42,109,0.15)',marginTop:'10px'}}>

    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'15px'}}>
      <h3 style={{fontFamily:"'Rubik Glitch',cursive",fontSize:'16px',color:RIOT_PINK,margin:0,textShadow:'0 0 10px rgba(255,42,109,0.4)'}}>
        <Brain size={16} /> MEMORY ARCHIVE
      </h3>
      <button onClick={() => setShowMemoryPanel(false)} style={{background:'none',border:'none',color:'#a08060',cursor:'pointer',padding:'5px'}}><X size={18} /></button>
    </div>

    {/* User Profile */}
    <div style={{padding:'12px',background:'rgba(255,255,255,0.02)',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.06)',marginBottom:'12px'}}>
      <div style={{fontSize:'11px',color:'#a08060'}}>
        Name: <span style={{color:RIOT_PINK,fontWeight:600}}>{memory.user_name || 'Not set'}</span>
        &nbsp;·&nbsp; Sessions: {memory.visit_count || 1}
        {latestBlobId && <span style={{fontFamily:'monospace',fontSize:'9px',color:'#2ec4b6',marginLeft:'8px'}}>Blob: {latestBlobId.slice(0,16)}...</span>}
      </div>
    </div>

    {/* Visited Agents */}
    {memory.visited_agents && memory.visited_agents.length > 0 && (
      <>
        <div style={{marginBottom:'8px',fontSize:'11px',color:'#ffd700',fontFamily:"'Rubik Mono One',sans-serif"}}>
          VISITED AGENTS ({memory.visited_agents.length}/{AGENTS.length})
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'12px'}}>
          {AGENTS.map(agent => {
            const visited = memory.visited_agents.includes(agent.id);
            const hasBlobs = (memory.blob_history || []).some(h => h.agent_id === agent.id);
            return (
              <button key={agent.id} onClick={() => setSelectedMemoryAgent(agent.id)}
                style={{
                  padding:'4px 8px',borderRadius:'4px',fontSize:'10px',
                  fontFamily:"'Rubik Mono One',sans-serif",
                  background: visited ? agent.color + '22' : 'rgba(255,255,255,0.02)',
                  border: hasBlobs ? '2px solid ' + agent.color : '2px solid transparent',
                  color: visited ? agent.color : '#555',
                  cursor:'pointer',transition:'all 0.15s'
              }}>{agent.emoji} {agent.id}</button>
            );
          })}
        </div>
      </>
    )}

    {/* Selected Agent Blob History */}
    {selectedMemoryAgent && (
      <div style={{marginBottom:'12px'}}>
        <button onClick={() => setSelectedMemoryAgent(null)}
          style={{background:'none',border:'none',color:'#a08060',cursor:'pointer',fontSize:'10px',fontFamily:"'Rubik Mono One',sans-serif",marginBottom:'6px',padding:0}}>
          {'< BACK TO AGENTS'}
        </button>
        {(memory.blob_history || []).filter(h => h.agent_id === selectedMemoryAgent).length === 0 ? (
          <div style={{fontSize:'11px',color:'#8a7050',padding:'10px',textAlign:'center',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'6px'}}>
            No blobs for {selectedMemoryAgent}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'3px',maxHeight:'150px',overflowY:'auto'}}>
            {(memory.blob_history || []).filter(h => h.agent_id === selectedMemoryAgent).slice().reverse().map((item,i) => (
              <div key={i} style={{padding:'5px',borderRadius:'3px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'9px'}}>
                <div style={{fontSize:'8px',color:'#666'}}>{new Date(item.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                <div style={{fontFamily:'monospace',color:'#2ec4b6',wordBreak:'break-all',fontSize:'8px'}}>{item.blob_id}
                  <a href={'https://aggregator.walrus-testnet.walrus.space/v1/blobs/'+item.blob_id} target='_blank' rel='noopener' style={{fontSize:'9px',color:'#00b4d8',textDecoration:'underline',marginLeft:'4px'}}>View &nearr;</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Summary */}
    {memory.summary && (
      <div style={{padding:'10px',background:'rgba(46,196,182,0.03)',borderRadius:'6px',border:'1px solid rgba(46,196,182,0.15)',marginBottom:'10px'}}>
        <div style={{fontSize:'9px',color:'#2ec4b6',marginBottom:'3px',fontFamily:"'Rubik Mono One',sans-serif"}}>SESSION SUMMARY</div>
        <div style={{fontSize:'10px',color:'#a08060',lineHeight:'1.5',maxHeight:'60px',overflow:'hidden'}}>
          {memory.summary.slice(0,250)}{memory.summary.length > 250 ? '...' : ''}
        </div>
      </div>
    )}

    {/* All Blobs */}
    {memory.blob_history && memory.blob_history.length > 0 && !selectedMemoryAgent && (
      <>
        <div style={{marginBottom:'4px',fontSize:'10px',color:'#ffd700',fontFamily:"'Rubik Mono One',sans-serif"}}>
          ALL BLOBS ({memory.blob_history.length})
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'3px',maxHeight:'25vh',overflowY:'auto'}}>
          {memory.blob_history.slice().reverse().map((item,i) => (
            <div key={i} style={{padding:'5px',borderRadius:'3px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'9px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1px'}}>
                <span style={{color:'#ffd700',fontWeight:600}}>{item.agent_id}</span>
                <span style={{color:'#666',fontSize:'8px'}}>{new Date(item.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <div style={{fontFamily:'monospace',color:'#2ec4b6',wordBreak:'break-all',fontSize:'8px'}}>{item.blob_id}
                <a href={'https://aggregator.walrus-testnet.walrus.space/v1/blobs/'+item.blob_id} target='_blank' rel='noopener' style={{fontSize:'9px',color:'#00b4d8',textDecoration:'underline',marginLeft:'4px'}}>View &nearr;</a>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
)}{showVerificationPanel && connected && (
        <div style={{
          width: '300px',
          background: 'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)',
          borderLeft: '2px solid rgba(46,196,182,0.2)',
          padding: '20px', overflowY: 'auto'
        }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <h3 style={{
              fontFamily: "'Rubik Glitch', cursive", fontSize: '16px',
              color: '#2ec4b6', margin: 0,
              display: 'flex', alignItems: 'center', gap: '8px',
              textShadow: '0 0 10px rgba(46,196,182,0.4)'
            }}>
              <Shield size={16} /> RIOT WIDGETS
            </h3>
            <WidgetTabs tab={widgetTab} setTab={setWidgetTab} />
          </div>

          {widgetTab === 'tasks' && (
            <div>
              <h4 style={{
                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                textTransform: 'uppercase', letterSpacing: '2px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                TASK TRACKER
              </h4>
              <TaskTracker tasks={tasks} setTasks={setTasks} agents={AGENTS} onSave={() => {}} />
            </div>
          )}

          {widgetTab === 'draft' && (
            <div>
              <h4 style={{
                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                textTransform: 'uppercase', letterSpacing: '2px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                DRAFT WRITER
              </h4>
              <DraftWriter
                draftText={draftText} setDraftText={setDraftText}
                onSaveDraft={() => { showToast('Draft saved', 'info') }}
                onSendToAgent={() => {
                  if (!draftText.trim()) return
                  setMessages(prev => [...prev, { role: 'user', content: draftText, agent_id: selectedAgent.id, id: Date.now() }])
                  setDraftText('')
                }}
              />
            </div>
          )}

          {widgetTab === 'verify' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                  textTransform: 'uppercase', letterSpacing: '2px',
                  fontFamily: "'Rubik Mono One', sans-serif"
                }}>
                  <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  TX HISTORY
                </h4>
                <TxHistoryList walletHash={walletHash} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <TatumDashboardPanel wallet={{address: account?.address}} />
              </div>

          <div style={{
            padding: '15px', background: 'rgba(46,196,182,0.05)', borderRadius: '10px',
            border: '2px solid rgba(46,196,182,0.15)', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#2ec4b6', fontWeight: 600, fontFamily: "'Rubik Mono One', sans-serif" }}>Immortalized</span>
              <span style={{ fontSize: '12px', color: '#2ec4b6', fontWeight: 700 }}>
                {onChainMessages.length}/{messages.length}
              </span>
            </div>
            <div style={{
              height: '8px', background: '#1a1209', borderRadius: '4px', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{
                height: '100%', width: `${messages.length > 0 ? Math.round((onChainMessages.length / messages.length) * 100) : 0}%`,
                background: 'linear-gradient(90deg, #ff2a6d 0%, #ff6b35 100%)',
                transition: 'width 0.5s ease', borderRadius: '4px',
                boxShadow: '0 0 10px rgba(255,42,109,0.3)'
              }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#a08060', marginTop: '4px', fontFamily: "'Rubik Mono One', sans-serif" }}>
              {messages.length > 0 ? Math.round((onChainMessages.length / messages.length) * 100) : 0}% On-Chain
            </div>
          </div>

          {moveObjectId && (
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)', marginBottom: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#2ec4b6', marginBottom: '4px', fontFamily: "'Rubik Mono One', sans-serif" }}>Latest Object</div>
              <div style={{ fontSize: '10px', color: '#a08060', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {moveObjectId}
              </div>
              <a href={`https://suiscan.xyz/mainnet/object/${moveObjectId}`} target="_blank" style={{
                fontSize: '10px', color: '#ff2a6d', textDecoration: 'none', marginTop: '4px', display: 'inline-block',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                View on SuiScan →
              </a>
            </div>
          )}

          {latestBlobId && (
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '11px', color: '#00b4d8', marginBottom: '4px', fontFamily: "'Rubik Mono One', sans-serif" }}>
                Walrus Blob · <span style={{ color: latestBlobNetwork === 'testnet' ? '#ff6b35' : '#2ec4b6' }}>{latestBlobNetwork.toUpperCase()}</span>
              </div>
              <a href={`${latestBlobNetwork === 'testnet' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`} target="_blank" rel="noopener"
                style={{ fontSize: '10px', color: '#00b4d8', fontFamily: 'monospace', wordBreak: 'break-all', textDecoration: 'underline' }}>
                {latestBlobId}
              </a>
            </div>
          )}
          </div>
        )}
        </div>
      )}

      {/* CSS Animations + Toast Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes blockPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes toastSlide {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0a07; }
        ::-webkit-scrollbar-thumb { background: #ff2a6d44; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ff2a6d88; }
        /* Typing animation */
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        /* Mobile responsive */
        @media (max-width: 768px) {
          .chat-header { padding: 15px !important; }
          .chat-messages { padding: 15px !important; }
          .chat-input { padding: 15px !important; }
        }
      `}</style>
    </div>
  )
}
