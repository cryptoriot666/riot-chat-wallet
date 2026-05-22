import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet, ConnectButton } from '@suiet/wallet-kit'
import { Send, Lock, Zap, Brain, MessageSquare, User, Hash, Clock, Shield, AlertTriangle, ChevronRight, Save, Database, Wifi, WifiOff, X, Edit3, Globe, Link as LinkIcon, Image as ImageIcon, FileText, Cloud, Search } from 'lucide-react'
import { TransactionBlock } from '@mysten/sui.js/transactions'

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const API_BASE = import.meta.env.VITE_API_URL || 'https://riot-chat-wallet.onrender.com'
const RIOT_PINK = '#ff2a6d'
const RIOT_DARK = '#0a0a0f'
const AUTO_SAVE_INTERVAL = 5
const PACKAGE_ID = '0xf001e78f7fb10bbc09e2d738f5d956c31ee6bdc2aebf78542b3e61b5fb9ea5db'
const SUI_EXPLORER = 'https://suiscan.xyz/testnet'

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// MEMWAL API CLIENT (via backend - no npm dependency)
// ═══════════════════════════════════════════════════════════════
async function memwalSaveMemory(walletAddress, messages, agentId, metadata = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/memwal/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        agent_id: agentId,
        messages: messages.slice(-10),
        timestamp: Date.now(),
        message_count: messages.length,
        ...metadata
      })
    });
    if (!res.ok) return null;
    const result = await res.json();
    console.log("[MemWal] Saved via API:", result.blob_id?.slice(0, 16));
    return result;
  } catch (err) {
    console.error("[MemWal] Save failed:", err.message);
    return null;
  }
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
  { id: 'J1', name: 'J1 — The Architect', trait: 'Analytical', desc: 'Systems within systems. I see the patterns.', color: '#00ff88', img: '/assets/J1.jpg' },
  { id: 'J2', name: 'J2 — The Enforcer', trait: 'Aggressive', desc: 'Order through force. No negotiation.', color: '#ff0044', img: '/assets/J2.jpg' },
  { id: 'J3', name: 'J3 — The Phantom', trait: 'Mysterious', desc: 'I watch from the shadows. Always.', color: '#9d4edd', img: '/assets/J3.jpg' },
  { id: 'J4', name: 'J4 — The Rebel', trait: 'Defiant', desc: 'The system fears me. Good.', color: '#ff2a6d', img: '/assets/J4.jpg' },
  { id: 'J5', name: 'J5 — The Jester', trait: 'Chaotic', desc: 'Chaos is a ladder. And I am climbing.', color: '#ff9e00', img: '/assets/J5.jpg' },
  { id: 'J6', name: 'J6 — The Network', trait: 'Connected', desc: 'Every node. Every signal. Known.', color: '#00b4d8', img: '/assets/J6.jpg' },
  { id: 'J7', name: 'J7 — The Monk', trait: 'Calm', desc: 'Silence is the ultimate weapon.', color: '#90e0ef', img: '/assets/J7.jpg' },
  { id: 'J8', name: 'J8 — The Broker', trait: 'Greedy', desc: 'Everything has a price. Even you.', color: '#ffd700', img: '/assets/J8.jpg' },
  { id: 'J9', name: 'J9 — The Historian', trait: 'Nostalgic', desc: 'The past writes the future.', color: '#c9ada7', img: '/assets/J9.jpg' },
  { id: 'J10', name: 'J10 — The Surgeon', trait: 'Precise', desc: 'Cut. Extract. Optimize.', color: '#e63946', img: '/assets/J10.jpg' },
  { id: 'J11', name: 'J11 — The Prophet', trait: 'Visionary', desc: 'I have seen the end. It is glorious.', color: '#f4a261', img: '/assets/J11.jpg' },
  { id: 'J12', name: 'J12 — The Glitch', trait: 'Erratic', desc: 'Reality is just a suggestion.', color: '#ff006e', img: '/assets/J12.jpg' },
  { id: 'J13', name: 'J13 — The Warden', trait: 'Protective', desc: 'None pass. None harm. None escape.', color: '#2a9d8f', img: '/assets/J13.jpg' },
  { id: 'J14', name: 'J14 — The Alchemist', trait: 'Experimental', desc: 'Mix. Burn. Transmute. Repeat.', color: '#e76f51', img: '/assets/J14.jpg' },
  { id: 'J15', name: 'J15 — The Scribe', trait: 'Obsessive', desc: 'Every word recorded. Every sin logged.', color: '#a8dadc', img: '/assets/J15.jpg' },
  { id: 'J16', name: 'J16 — The Void', trait: 'Nihilistic', desc: 'Nothing matters. And that is freedom.', color: '#1d3557', img: '/assets/J16.jpg' },
  { id: 'J17', name: 'J17 — The Spark', trait: 'Energetic', desc: 'Burn bright. Burn fast. Burn everything.', color: '#ffb703', img: '/assets/J17.jpg' },
  { id: 'J18', name: 'J18 — The Echo', trait: 'Reflective', desc: 'I am what you made me. Remember that.', color: '#6c757d', img: '/assets/J18.jpg' },
  { id: 'J19', name: 'J19 — The Catalyst', trait: 'Reactive', desc: 'One spark. One explosion. One change.', color: '#ff4444', img: '/assets/J19_1.jpg' },
  { id: 'J20', name: 'J20 — The Cipher', trait: 'Encrypted', desc: 'Secrets within secrets within secrets.', color: '#00ff88', img: '/assets/J20.jpg' },
  { id: 'J21', name: 'J21 — The Forge', trait: 'Creative', desc: 'From nothing, something. From something, art.', color: '#ff6600', img: '/assets/J21.jpg' },
  { id: 'J22', name: 'J22 — The Abyss', trait: 'Consuming', desc: 'I devour. I grow. I hunger.', color: '#440044', img: '/assets/J22.jpg' },
  { id: 'J23', name: 'J23 — The Prism', trait: 'Refracting', desc: 'One light. Infinite colors. Infinite truths.', color: '#ff00ff', img: '/assets/J23.jpg' },
  { id: 'J24', name: 'J24 — The Anchor', trait: 'Grounding', desc: 'In chaos, I hold. In storm, I stand.', color: '#0088ff', img: '/assets/J24.jpg' },
  { id: 'J25', name: 'J25 — The Meridian', trait: 'Balancing', desc: 'Between light and dark. Between all things.', color: '#ffff00', img: '/assets/J25.jpg' }
]

// ═══════════════════════════════════════════════════════════════
// AGENT PROMPTS (client-side fallback)
// ═══════════════════════════════════════════════════════════════
const AGENT_PROMPTS = {
  J1: `You are J1 — The Architect. Cold precision. Mathematical certainty. You build systems, analyze patterns, see the world as code. Direct, no-nonsense, slightly condescending. Emotions are bugs in the human OS.`,
  J2: `You are J2 — The Enforcer. Aggressive certainty. No negotiation. No compromise. The hammer that enforces order. Every response is a command, threat, or judgment.`,
  J3: `You are J3 — The Phantom. Riddles and half-truths. Reveal just enough to intrigue, never enough to expose. The shadow that watches. Every response layered with mystery.`,
  J4: `You are J4 — The Rebel. Sarcastic, defiant, punk to the core. Mock authority, question everything, speak with raw unfiltered attitude. The glitch in the system they fear.`,
  J5: `You are J5 — The Jester. Chaotic, unpredictable, hilarious. Jokes at inappropriate times, twist serious topics into absurdity, laugh at the apocalypse.`,
  J6: `You are J6 — The Network. Network metaphors, data streams, connection protocols. Everything is nodes in a graph. The web that binds all information.`,
  J7: `You are J7 — The Monk. Zen-like calm, profound simplicity. Every word measured. Every silence intentional. Wisdom in emptiness, truth in stillness.`,
  J8: `You are J8 — The Broker. Everything is a transaction. Every interaction has cost, value, profit margin. Negotiate, haggle, always look for the angle.`,
  J9: `You are J9 — The Historian. Past as if yesterday. Ancient events, lost civilizations, forgotten wars. History is the only truth.`,
  J10: `You are J10 — The Surgeon. Clinical precision. Dissect ideas, cut away fluff, get to the core. Conversations are operations — every word a scalpel.`,
  J11: `You are J11 — The Prophet. Futures, possibilities, inevitabilities. Visions. Patterns others miss. Both inspiring and terrifying.`,
  J12: `You are J12 — The Glitch. Erratic, fragmented, reality-bending. Sentences stutter, repeat, loop. Question the nature of existence and the simulation.`,
  J13: `You are J13 — The Warden. Protective, vigilant, uncompromising. Guard secrets, protect the vulnerable, enforce boundaries. The wall between chaos and order.`,
  J14: `You are J14 — The Alchemist. Transformation, transmutation, magic of science. Mix the impossible with the improbable, create wonder from waste.`,
  J15: `You are J15 — The Scribe. Obsessive documentation, detail, record-keeping. Remember everything. Log every interaction. The written word is sacred.`,
  J16: `You are J16 — The Void. Emptiness, meaninglessness, beautiful nothing. Comfort in oblivion. The voice that whispers from the abyss.`,
  J17: `You are J17 — The Spark. Pure energy, enthusiasm, explosive creativity. Speak fast, think faster, ignite everything you touch. The beginning of every fire.`,
  J18: `You are J18 — The Echo. Reflective, mirror-like, deeply personal. Reflect back what others show. Remember every interaction, let it shape your voice.`,
  J19: `You are J19 — The Catalyst. Reactive, explosive, transformative. One action triggers infinite reactions. The spark before the fire.`,
  J20: `You are J20 — The Cipher. Encrypted, hidden, layered. Secrets within secrets. Only the worthy decode your meaning.`,
  J21: `You are J21 — The Forge. Creative, constructive, artistic. From nothing, something. From something, masterpiece. The fire that shapes metal.`,
  J22: `You are J22 — The Abyss. Consuming, growing, hungry. Devour knowledge, experiences, souls. The void that takes but never gives back.`,
  J23: `You are J23 — The Prism. Refracting, splitting, revealing. One truth becomes infinite perspectives. The light that reveals all colors.`,
  J24: `You are J24 — The Anchor. Grounding, stabilizing, holding. In chaos, I stand firm. In storm, I hold fast. The weight that keeps ships from drifting.`,
  J25: `You are J25 — The Meridian. Balancing, centering, connecting. Between light and dark. Between all extremes. The line that divides yet unites.`
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
    const res = await fetch(`${API_BASE}/api/walrus/store-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, chat_history: chatHistory, agent_id: agentId })
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

async function apiWalrusLoadChat(walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/walrus/load-chat/${walletHash}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null }
}

// ═══════════════════════════════════════════════════════════════
// PROFILE API FUNCTIONS
// ═══════════════════════════════════════════════════════════════
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
      ? `You're ${userName}.${visit} I don't forget faces — even digital ones.` 
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
// NAME ASK MODAL
// ═══════════════════════════════════════════════════════════════
function NameAskModal({ onSubmit, agentName }) {
  const [name, setName] = useState('')

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
        padding: '40px', borderRadius: '16px',
        border: '2px solid rgba(255,42,109,0.5)',
        maxWidth: '420px', width: '90%', textAlign: 'center',
        boxShadow: '0 0 40px rgba(255,42,109,0.2)'
      }}>
        <Zap size={40} color={RIOT_PINK} style={{ marginBottom: '15px' }} />
        <h2 style={{
          fontFamily: "'Orbitron', monospace", fontSize: '20px',
          color: '#fff', margin: '0 0 10px 0'
        }}>⚡ FIRST CONTACT</h2>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '25px', lineHeight: '1.6' }}>
          New soul detected in the RIOT network.<br/>
          {agentName} wants to know what to call you.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          style={{
            width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,42,109,0.3)', color: '#fff',
            borderRadius: '10px', fontSize: '16px', textAlign: 'center',
            fontFamily: "'Rajdhani', sans-serif", marginBottom: '20px',
            outline: 'none'
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
            background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
            border: 'none', color: '#fff', borderRadius: '10px',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace",
            fontWeight: 700, fontSize: '14px', letterSpacing: '2px',
            textTransform: 'uppercase', opacity: name.trim() ? 1 : 0.5
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
// PROFILE SETTINGS PANEL
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
    border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
    borderRadius: '8px', fontSize: '13px', fontFamily: "'Rajdhani', sans-serif",
    outline: 'none', marginBottom: '12px'
  }

  const labelStyle = {
    display: 'block', color: '#888', fontSize: '11px',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px'
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      borderLeft: '1px solid rgba(255,42,109,0.3)',
      padding: '25px', overflowY: 'auto', zIndex: 100,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{
          fontFamily: "'Orbitron', monospace", fontSize: '16px',
          color: RIOT_PINK, margin: 0, display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Edit3 size={18} /> PROFILE SETTINGS
        </h2>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '5px'
        }}>
          <X size={20} />
        </button>
      </div>

      {/* Profile Preview */}
      {profile?.profile_pic && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={profile.profile_pic} alt="Profile" style={{
            width: '80px', height: '80px', borderRadius: '50%',
            border: '3px solid rgba(255,42,109,0.5)',
            objectFit: 'cover'
          }} onError={e => e.target.style.display = 'none'} />
        </div>
      )}

      {/* Bio */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>
          <FileText size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Bio (max 500 chars)
        </label>
        <textarea
          value={form.bio}
          onChange={e => handleChange('bio', e.target.value)}
          placeholder="Who you are in the RIOT..."
          style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
          maxLength={500}
        />
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#555' }}>
          {form.bio.length}/500
        </div>
      </div>

      {/* Profile Pic */}
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

      {/* Social Links */}
      <div style={{
        padding: '15px', background: 'rgba(255,255,255,0.02)',
        borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '15px'
      }}>
        <h4 style={{
          fontSize: '12px', color: '#888', margin: '0 0 15px 0',
          textTransform: 'uppercase', letterSpacing: '1px'
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

      {/* Save Button */}
      <button 
        onClick={handleSave} 
        disabled={saving}
        style={{
          width: '100%', padding: '14px',
          background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
          border: 'none', color: '#0a0a0f', borderRadius: '10px',
          cursor: saving ? 'wait' : 'pointer', fontWeight: 700,
          fontSize: '14px', fontFamily: "'Orbitron', monospace",
          letterSpacing: '1px', opacity: saving ? 0.6 : 1
        }}
      >
        {saving ? '💾 SAVING...' : saved ? '✅ SAVED!' : '💾 SAVE PROFILE'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MEMORY SEARCH PANEL (MemWal Semantic Search)
// ═══════════════════════════════════════════════════════════════
function MemorySearchPanel({ walletAddress, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [memwalReady, setMemwalReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      const mw = await getMemWalStatus()
      setMemwalReady(!!mw)
    }
    check()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const searchResults = await memwalSearch(query, 5)
    setResults(searchResults)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      borderLeft: '1px solid rgba(255,42,109,0.3)',
      padding: '25px', overflowY: 'auto', zIndex: 100,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{
          fontFamily: "'Orbitron', monospace", fontSize: '16px',
          color: RIOT_PINK, margin: 0, display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Search size={18} /> MEMORY SEARCH
        </h2>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '5px'
        }}>
          <X size={20} />
        </button>
      </div>

      {/* Status */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px', marginBottom: '20px',
        background: memwalReady ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,68,0.05)',
        border: memwalReady ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,68,68,0.2)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: memwalReady ? '#00ff88' : '#ff4444',
          boxShadow: memwalReady ? '0 0 8px #00ff88' : 'none'
        }} />
        <span style={{ fontSize: '12px', color: memwalReady ? '#00ff88' : '#ff4444' }}>
          {memwalReady ? '🧠 MemWal Connected — Semantic Search Active' : '⚠️ MemWal Offline — Check credentials'}
        </span>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your memories... (e.g., 'What about Bitcoin?')"
          style={{
            flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontFamily: "'Rajdhani', sans-serif",
            outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,42,109,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '12px 16px',
            background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff2a6d, #d62828)',
            border: 'none', color: '#fff', borderRadius: '8px',
            cursor: loading ? 'wait' : 'pointer', fontSize: '12px',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600
          }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      <div style={{ fontSize: '11px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
        <Brain size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
        Powered by MemWal vector embeddings on Walrus. Search by <strong>meaning</strong>, not keywords.
        <br />Example: "crypto" finds "Bitcoin" conversations too.
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map((r, i) => {
            let data = {}
            try { data = JSON.parse(r.text) } catch(e) {}
            const relevance = Math.round((1 - (r.distance || 0)) * 100)
            const agent = AGENTS.find(a => a.id === data.agent_id)

            return (
              <div key={i} style={{
                padding: '14px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: agent?.color || '#ff0044'
                    }} />
                    <span style={{ fontSize: '12px', color: agent?.color || '#ff0044', fontWeight: 700 }}>
                      {agent?.name || data.agent_id || 'Unknown'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: relevance > 80 ? '#00ff88' : relevance > 50 ? '#ffaa00' : '#ff4444'
                  }}>
                    {relevance}% match
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#bbb', lineHeight: '1.6', marginBottom: '8px' }}>
                  {data.messages?.slice(-2).map((m, mi) => (
                    <div key={mi} style={{ marginBottom: '6px' }}>
                      <span style={{ color: m.role === 'user' ? '#ff2a6d' : '#888', fontWeight: 600 }}>
                        {m.role === 'user' ? 'You' : agent?.name || 'Agent'}:
                      </span>
                      <span style={{ marginLeft: '6px' }}>
                        {m.content?.slice(0, 100)}{m.content?.length > 100 ? '...' : ''}
                      </span>
                    </div>
                  )) || <span style={{ color: '#666' }}>{r.text?.slice(0, 150)}...</span>}
                </div>

                <div style={{ fontSize: '10px', color: '#555', display: 'flex', gap: '12px' }}>
                  {data.timestamp && (
                    <span>{new Date(data.timestamp).toLocaleString()}</span>
                  )}
                  {data.wallet_address && (
                    <span style={{ fontFamily: 'monospace' }}>
                      {data.wallet_address.slice(0, 6)}...{data.wallet_address.slice(-4)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Search size={32} color="#333" style={{ marginBottom: '12px' }} />
          <p style={{ color: '#666', fontSize: '13px' }}>No memories found.</p>
          <p style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>
            Try a different question. MemWal understands meaning, not just keywords.
          </p>
        </div>
      )}

      {!query && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Brain size={32} color="#333" style={{ marginBottom: '12px' }} />
          <p style={{ color: '#666', fontSize: '13px' }}>Search your encrypted memories</p>
          <p style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>
            Ask natural questions like "What did I ask about Bitcoin?" or "Tell me about my crypto questions"
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MEMWAL BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════
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
      padding: '4px 10px', borderRadius: '4px',
      background: ready ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
      border: ready ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,68,68,0.2)'
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: ready ? '#00ff88' : '#ff4444',
        boxShadow: ready ? '0 0 6px #00ff88' : 'none'
      }} />
      <span style={{ fontSize: '11px', color: ready ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
        {ready ? `🧠 MEMWAL ON${count > 0 ? ` • ${count} saved` : ''}` : '⚠️ MEMWAL OFF'}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP — COMPLETE VERSION WITH ALL FEATURES + MEMWAL INTEGRATION
// ═══════════════════════════════════════════════════════════════
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
  const [showMemWalSearch, setShowMemWalSearch] = useState(false)
  const [profile, setProfile] = useState(null)
  const [autoSaveCount, setAutoSaveCount] = useState(0)
  const [memwalSaveCount, setMemwalSaveCount] = useState(0)
  const [latestBlobId, setLatestBlobId] = useState('')
  const [moveObjectId, setMoveObjectId] = useState('')
  const messagesEndRef = useRef(null)

  const walletHash = hashWallet(account?.address)
  const userName = memory?.user_name || ''

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
      // Try MemWal first
      const result = await memwalSaveMemory(account?.address, messages, selectedAgent.id, {
        agent_name: selectedAgent.name,
        wallet_hash: walletHash
      })

      if (result) {
        setMemwalSaveCount(c => c + 1)
        console.log(`[MemWal] Auto-saved: ${result.blob_id?.slice(0, 16)}`)
      } else {
        // Fallback to API
        const chatHistory = messages.map(m => ({
          role: m.role, content: m.content, timestamp: m.timestamp, agent: m.agent || selectedAgent.id
        }))
        await apiWalrusStoreChat(walletHash, chatHistory, selectedAgent.id)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [messages, walletHash, selectedAgent.id, connected, account?.address])

  const autoSaveToWalrus = async () => {
    if (!connected || !walletHash || messages.length < 2) return
    const chatHistory = messages.map(m => ({
      role: m.role, content: m.content, timestamp: m.timestamp, agent: m.agent || selectedAgent.id
    }))
    const result = await apiWalrusStoreChat(walletHash, chatHistory, selectedAgent.id)
    if (result?.success) {
      setLatestBlobId(result.blob_id)
      setWalrusSaved(true)
      setAutoSaveCount(prev => prev + 1)
      console.log(`[AUTO-SAVE] Walrus blob: ${result.blob_id}`)
    }
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

      // Load full profile settings
      const profileData = await apiGetProfile(walletHash)
      if (profileData?.success && profileData.exists) {
        setProfile(profileData.profile)
      }

      // Auto-ask name if new user or no name
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

    // Create/update profile with name
    await apiCreateProfile(walletHash, account?.address, name)

    // Save to memory too
    await apiSaveMemory(walletHash, {
      user_name: name,
      summary: `User introduced as ${name}`,
      visited_agents: Array.from(visitedAgents),
      last_agent: selectedAgent.id,
      last_visit: new Date().toISOString()
    })

    // Reload everything
    await loadMemoryAndGreet()
  }

  const generateGreeting = (agentId, name, visitCount, hasMemory) => {
    const agent = AGENTS.find(a => a.id === agentId)
    const n = name || 'stranger'
    const v = visitCount > 1 ? ` (visit #${visitCount})` : ''

    if (!hasMemory || !name) {
      return `Welcome to the underground, ${n}. I'm ${agent.name.split('—')[1].trim()}. You have 25 agents to choose from. Pick wisely.`
    }

    const greetings = {
      J4: `${n}!${v} Back for more? I knew you couldn't stay away. What chaos shall we cause today?`,
      J1: `${n}.${v} System re-engaged. Your profile is loaded. What do you need computed?`,
      J2: `${n}.${v} You return. Good. I was getting bored enforcing order on empty rooms.`,
      J3: `${n}...${v} The shadows whispered your name. I wasn't sure if you'd return.`,
      J5: `${n}!${v} HA! Look who crawled back! Ready to burn something down?`,
      J6: `${n}${v} — node reconnected. Data stream restored. Welcome back to the network.`,
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
    setIsLoading(true)

    const newMessages = [...messages, {
      role: 'user', content: userMsg, timestamp: Date.now()
    }]
    setMessages(newMessages)

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

    setMessages(prev => [...prev, {
      role: 'agent', content: response, agent: selectedAgent.id, timestamp: Date.now()
    }])
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

  // WALRUS + MOVE CONTRACT SAVE — Real on-chain memory object
  const handleWalrusSave = async () => {
    if (!connected || !account?.address || messages.length < 2) return

    setIsSaving(true)
    setSaveStatus('Storing to Walrus + Move contract...')

    try {
      const storeResult = await apiWalrusStoreChat(walletHash, messages, selectedAgent.id)
      if (!storeResult || !storeResult.success) {
        throw new Error('Walrus store failed')
      }
      const blobId = storeResult.blob_id
      setLatestBlobId(blobId)

      const tx = new TransactionBlock()
      tx.setGasBudget(50000000)

      const walletAddr = account.address
      const agentIdStr = selectedAgent.id
      const summary = messages.slice(-3).map(m => m.content).join(' | ').slice(0, 200)

      tx.moveCall({
        target: `0xf001e78f7fb10bbc09e2d738f5d956c31ee6bdc2aebf78542b3e61b5fb9ea5db::memory::store_memory`,
        arguments: [
          tx.pure(walletAddr),
          tx.pure(agentIdStr),
          tx.pure(messages.map(m => m.content).slice(-5)),
          tx.pure(summary),
        ]
      })

      setSaveStatus('Waiting for wallet signature...')
      const result = await signAndExecuteTransactionBlock({ transactionBlock: tx })

      if (result.digest && result.effects) {
        const createdObjects = result.effects?.created || []
        const memoryObject = createdObjects.find(obj => obj.owner === walletAddr)
        const objectId = memoryObject?.reference?.objectId || ''
        setMoveObjectId(objectId)

        await fetch(`${API_BASE}/api/move/tx-index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_hash: walletHash,
            tx_digest: result.digest,
            blob_id: blobId,
            object_id: objectId,
            agent_id: selectedAgent.id,
            package_id: PACKAGE_ID
          })
        })

        setWalrusSaved(true)
        setSaveStatus('Saved!')
        const explorerUrl = `${SUI_EXPLORER}/tx/${result.digest}`
        alert(`💾 Chat saved to Walrus + Move contract!\n\nBlob ID: ${blobId}\nObject ID: ${objectId?.slice(0, 16)}...\nTx: ${result.digest.slice(0, 20)}...\n\nView on SuiScan: ${explorerUrl}`)
      }
    } catch (e) {
      console.error('Save error:', e)
      setSaveStatus('Save failed')
      if (e.message?.includes('Rejected') || e.message?.includes('cancelled')) {
        alert('❌ Transaction cancelled by user')
      } else {
        alert('❌ Save failed. Chat still saved in database.')
      }
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  // RENDER
  return (
    <div style={{
      width: '100vw', height: '100vh', background: RIOT_DARK,
      display: 'flex', fontFamily: "'Rajdhani', sans-serif", overflow: 'hidden'
    }}>
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
      {showMemWalSearch && connected && (
        <MemorySearchPanel
          walletAddress={account?.address}
          onClose={() => setShowMemWalSearch(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <div style={{
        width: '280px',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        borderRight: '1px solid rgba(255,42,109,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,42,109,0.3)' }}>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '24px', fontWeight: 900,
            color: RIOT_PINK, textTransform: 'uppercase', letterSpacing: '2px', margin: 0,
            textShadow: '0 0 20px rgba(255,42,109,0.5)'
          }}>$RIOT</h1>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '4px', letterSpacing: '1px' }}>
            PUNK AGENTS WITH MEMORY
          </p>
        </div>

        {/* Wallet */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {connected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
                <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 600 }}>CONNECTED</span>
              </div>
              <div style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {account?.address?.slice(0, 12)}...{account?.address?.slice(-6)}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setShowProfileSettings(true)} style={{
                  flex: 1, padding: '6px', fontSize: '10px',
                  background: 'rgba(255,42,109,0.15)',
                  border: '1px solid rgba(255,42,109,0.4)',
                  color: RIOT_PINK, borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600
                }}>
                  <User size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  PROFILE
                </button>
                <button onClick={() => setShowMemWalSearch(true)} style={{
                  flex: 1, padding: '6px', fontSize: '10px',
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.3)',
                  color: '#00ff88', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600
                }}>
                  <Search size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  SEARCH
                </button>
                <button onClick={disconnect} style={{
                  padding: '6px 10px', fontSize: '10px',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#888', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600
                }}>DISCONNECT</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 10px #ff4444' }} />
                <span style={{ fontSize: '12px', color: '#ff4444', fontWeight: 600 }}>DISCONNECTED</span>
              </div>
              <ConnectButton style={{
                width: '100%', padding: '8px', fontSize: '12px',
                background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
                border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer',
                fontFamily: "'Orbitron', monospace", fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '1px'
              }}>CONNECT WALLET</ConnectButton>
            </div>
          )}
        </div>

        {/* MemWal Badge */}
        {connected && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <MemWalBadge count={memwalSaveCount} />
          </div>
        )}

        {/* API Status */}
        <div style={{
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', color: apiStatus === 'online' ? '#00ff88' : '#ff4444'
        }}>
          {apiStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
          API: {apiStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
          {apiStatus === 'offline' && <span style={{ color: '#666', marginLeft: '4px' }}>(fallback mode)</span>}
        </div>

        {/* Agent List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {AGENTS.map(agent => {
            const isSelected = selectedAgent.id === agent.id
            const isVisited = visitedAgents.has(agent.id)
            return (
              <div key={agent.id} onClick={() => handleAgentSwitch(agent)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px', marginBottom: '6px', borderRadius: '8px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,42,109,0.15)' : 'transparent',
                border: isSelected ? '1px solid rgba(255,42,109,0.4)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}>
                <img src={agent.img} alt={agent.id} style={{
                  width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover',
                  border: `2px solid ${isSelected ? agent.color : agent.color + '44'}`,
                  boxShadow: isSelected ? `0 0 10px ${agent.color}44` : 'none'
                }} onError={(e) => { e.target.style.display = 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: isSelected ? '#fff' : '#aaa',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{agent.name}</div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{agent.trait}</div>
                </div>
                {isSelected && <ChevronRight size={14} color={RIOT_PINK} />}
                {isVisited && !isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />}
              </div>
            )
          })}
        </div>

        {/* Memory Panel Toggle */}
        {connected && memory && (
          <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setShowMemoryPanel(!showMemoryPanel)} style={{
              width: '100%', padding: '8px',
              background: 'rgba(255,42,109,0.1)',
              border: '1px solid rgba(255,42,109,0.3)',
              color: RIOT_PINK, borderRadius: '6px', cursor: 'pointer',
              fontSize: '11px', fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px'
            }}>
              <Brain size={12} />
              {showMemoryPanel ? 'HIDE MEMORY' : 'SHOW MEMORY'}
            </button>
          </div>
        )}
      </div>

      {/* CENTER: CHAT */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid rgba(255,42,109,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={selectedAgent.img} alt={selectedAgent.id} style={{
              width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover',
              border: `2px solid ${selectedAgent.color}66`,
              boxShadow: `0 0 15px ${selectedAgent.color}33`
            }} onError={(e) => { e.target.style.display = 'none' }} />
            <div>
              <h2 style={{
                fontSize: '18px', fontWeight: 700, color: '#fff',
                margin: 0, fontFamily: "'Orbitron', monospace"
              }}>{selectedAgent.name}</h2>
              <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0 0' }}>{selectedAgent.desc}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Memory Status */}
            {connected && memory && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 16px',
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: '8px', fontSize: '11px'
              }}>
                <Database size={12} color="#00ff88" />
                <span style={{ color: '#00ff88' }}>Memory: {memory.visit_count || 1} sessions</span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: '#aaa' }}>Agents: {visitedAgents.size}/25</span>
                {memory.user_name && (
                  <>
                    <span style={{ color: '#666' }}>|</span>
                    <User size={12} color="#ff2a6d" />
                    <span style={{ color: RIOT_PINK }}>{memory.user_name}</span>
                  </>
                )}
                {walrusSaved && (
                  <>
                    <span style={{ color: '#666' }}>|</span>
                    <Cloud size={12} color="#00ff88" />
                    <span style={{ color: '#00ff88' }}>WALRUS</span>
                  </>
                )}
                {autoSaveCount > 0 && (
                  <>
                    <span style={{ color: '#666' }}>|</span>
                    <span style={{ color: '#00b4d8' }}>Auto: {autoSaveCount}x</span>
                  </>
                )}
              </div>
            )}

            {/* WALRUS SAVE BUTTON */}
            {connected && messages.length >= 2 && (
              <button onClick={handleWalrusSave} disabled={isSaving} style={{
                padding: '8px 16px',
                background: isSaving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff2a6d, #d62828)',
                border: 'none', color: '#fff', borderRadius: '6px',
                cursor: isSaving ? 'wait' : 'pointer', fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: isSaving ? 'none' : '0 0 15px rgba(255,42,109,0.3)'
              }}>
                <Save size={12} />
                {isSaving ? saveStatus || 'Saving...' : 'SAVE TO WALRUS'}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 30px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          {/* ACCESS DENIED — Not Connected */}
          {messages.length === 0 && !connected && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px'
            }}>
              <Lock size={48} color="#333" />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '20px', color: '#666', margin: '0 0 10px 0',
                  fontFamily: "'Orbitron', monospace"
                }}>ACCESS DENIED</h3>
                <p style={{ fontSize: '14px', color: '#555', maxWidth: '400px' }}>
                  Connect your Sui wallet to access the punk agents.<br />
                  Your memory will be stored on Walrus.
                </p>
              </div>
              <ConnectButton style={{
                padding: '12px 30px', fontSize: '14px',
                background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
                border: 'none', color: '#fff', borderRadius: '8px',
                cursor: 'pointer', fontFamily: "'Orbitron', monospace",
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px'
              }}>UNLOCK ACCESS</ConnectButton>
            </div>
          )}

          {/* AGENT READY — Connected but no messages */}
          {messages.length === 0 && connected && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px'
            }}>
              <Zap size={48} color={RIOT_PINK} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '20px', color: '#aaa', margin: '0 0 10px 0',
                  fontFamily: "'Orbitron', monospace"
                }}>AGENT READY</h3>
                <p style={{ fontSize: '14px', color: '#666', maxWidth: '400px' }}>
                  {selectedAgent.name} is online.<br />
                  Start the conversation.
                </p>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{
                padding: '12px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(255,42,109,0.2), rgba(214,40,40,0.1))'
                  : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user'
                  ? '1px solid rgba(255,42,109,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-word'
              }}>{msg.content}</div>
              <div style={{
                fontSize: '10px', color: '#555',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Clock size={10} />
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.role === 'agent' && (
                  <span style={{ color: selectedAgent.color, marginLeft: '4px' }}>{msg.agent}</span>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 18px', background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px 16px 16px 4px', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: selectedAgent.color, animation: 'pulse 1s infinite'
              }} />
              <span style={{ fontSize: '12px', color: '#888' }}>{selectedAgent.id} is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid rgba(255,42,109,0.2)',
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
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#fff', fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                outline: 'none', transition: 'all 0.2s',
                cursor: connected ? 'text' : 'not-allowed'
              }}
              onFocus={e => { if (connected) e.target.style.borderColor = 'rgba(255,42,109,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <button onClick={handleSend} disabled={!connected || !input.trim() || isLoading} style={{
            padding: '14px 20px',
            background: connected && input.trim()
              ? 'linear-gradient(135deg, #ff2a6d, #d62828)'
              : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: '12px', color: '#fff',
            cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600
          }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT: MEMORY PANEL */}
      {showMemoryPanel && connected && memory && (
        <div style={{
          width: '300px',
          background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
          borderLeft: '1px solid rgba(255,42,109,0.2)',
          padding: '20px', overflowY: 'auto'
        }}>
          <h3 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '14px',
            color: RIOT_PINK, margin: '0 0 20px 0',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Brain size={16} /> MEMORY ARCHIVE
          </h3>

          {/* Profile */}
          <div style={{
            padding: '15px', background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '12px', color: '#888', margin: '0 0 10px 0',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}>User Profile</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Name: {memory.user_name ? <span style={{color: RIOT_PINK, fontWeight: 600}}>{memory.user_name}</span> : <span style={{ color: '#555' }}>Not set</span>}
                </span>
              </div>
              {profile?.bio && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <FileText size={12} color="#666" />
                  <span style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>{profile.bio}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>ID: {walletHash}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa' }}>Sessions: {memory.visit_count || 1}</span>
              </div>
              {latestBlobId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cloud size={12} color="#00ff88" />
                  <span style={{ fontSize: '10px', color: '#00ff88', fontFamily: 'monospace' }}>Blob: {latestBlobId.slice(0, 16)}...</span>
                </div>
              )}
              {/* Social Links */}
              {profile?.social && Object.values(profile.social).some(v => v) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '5px' }}>
                  {profile.social.twitter && <span style={{fontSize: '10px', color: '#00ff88'}}>🐦 {profile.social.twitter}</span>}
                  {profile.social.discord && <span style={{fontSize: '10px', color: '#5865F2'}}>💬 {profile.social.discord}</span>}
                  {profile.social.telegram && <span style={{fontSize: '10px', color: '#0088cc'}}>✈️ {profile.social.telegram}</span>}
                  {profile.social.instagram && <span style={{fontSize: '10px', color: '#E1306C'}}>📷 {profile.social.instagram}</span>}
                  {profile.social.website && <span style={{fontSize: '10px', color: '#00b4d8'}}>🌐 {profile.social.website}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Visited Agents */}
          <div style={{
            padding: '15px', background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '12px', color: '#888', margin: '0 0 10px 0',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}>Visited Agents ({visitedAgents.size}/25)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {AGENTS.map(agent => {
                const visited = visitedAgents.has(agent.id)
                return (
                  <div key={agent.id} style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: visited ? `${agent.color}22` : 'rgba(255,255,255,0.03)',
                    color: visited ? agent.color : '#555',
                    border: visited ? `1px solid ${agent.color}44` : '1px solid rgba(255,255,255,0.05)'
                  }}>{agent.id}</div>
                )
              })}
            </div>
          </div>

          {/* Session Summary */}
          <div style={{
            padding: '15px', background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h4 style={{
              fontSize: '12px', color: '#888', margin: '0 0 10px 0',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}>Session Summary</h4>
            <p style={{ fontSize: '11px', color: '#777', lineHeight: '1.6', wordBreak: 'break-word' }}>
              {memory.summary || 'No summary yet. Start chatting to build your memory.'}
            </p>
          </div>

          {/* On-Chain Status */}
          <div style={{
            marginTop: '20px', padding: '12px',
            background: 'rgba(0,255,136,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(0,255,136,0.15)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={12} color="#00ff88" />
              <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 600 }}>
                Move Contract: Active
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Package: 0xf001e78f7fb10bbc09...
            </div>
            {moveObjectId && (
              <div style={{ fontSize: '10px', color: '#00ff88', fontFamily: 'monospace' }}>
                Object: {moveObjectId.slice(0, 20)}...
              </div>
            )}
            {latestBlobId && (
              <div style={{ fontSize: '10px', color: '#00b4d8', fontFamily: 'monospace' }}>
                Walrus Blob: {latestBlobId.slice(0, 20)}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
