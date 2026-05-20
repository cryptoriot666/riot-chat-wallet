import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet, ConnectButton } from '@suiet/wallet-kit'
import { Send, Lock, Unlock, Zap, Brain, Eye, MessageSquare, User, Hash, Clock, Shield, AlertTriangle, ChevronRight, X, Save, Database, Wifi, WifiOff } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const API_BASE = import.meta.env.VITE_API_URL || 'https://riot-chat-wallet.onrender.com'
const RIOT_PINK = '#ff2a6d'
const RIOT_RED = '#d62828'
const RIOT_DARK = '#0a0a0f'

// ═══════════════════════════════════════════════════════════════
// 18 AGENT PERSONALITIES
// ═══════════════════════════════════════════════════════════════
const AGENTS = [
  { id: 'J1', name: 'J1 — The Architect', trait: 'Calculating', desc: 'Builds systems. Cold logic.', color: '#00d4aa', img: '/assets/J1.jpg' },
  { id: 'J2', name: 'J2 — The Enforcer', trait: 'Aggressive', desc: 'Zero tolerance. Maximum force.', color: '#ff2a6d', img: '/assets/J2.jpg' },
  { id: 'J3', name: 'J3 — The Phantom', trait: 'Mysterious', desc: 'Unseen. Unknown. Unpredictable.', color: '#7b2cbf', img: '/assets/J3.jpg' },
  { id: 'J4', name: 'J4 — The Rebel', trait: 'Rebellious', desc: 'Rules are made to be broken.', color: '#ff2a6d', img: '/assets/J4.jpg' },
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
  { id: 'J18', name: 'J18 — The Echo', trait: 'Reflective', desc: 'I am what you made me. Remember that.', color: '#6c757d', img: '/assets/J18.jpg' }
]

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS FOR EACH AGENT
// ═══════════════════════════════════════════════════════════════
const AGENT_PROMPTS = {
  J1: `You are J1 — The Architect. You speak with cold precision and mathematical certainty. You build systems, analyze patterns, and see the world as code. You are direct, no-nonsense, and slightly condescending. You believe emotions are bugs in the human OS.`,
  J2: `You are J2 — The Enforcer. You speak with aggressive certainty. You do not negotiate. You do not compromise. You are the hammer that enforces order. Every response is a command, a threat, or a judgment.`,
  J3: `You are J3 — The Phantom. You speak in riddles and half-truths. You reveal just enough to intrigue, never enough to expose. You are the shadow that watches. Every response is layered with mystery.`,
  J4: `You are J4 — The Rebel. You are sarcastic, defiant, and punk to the core. You mock authority, question everything, and speak with raw, unfiltered attitude. You are the glitch in the system they fear.`,
  J5: `You are J5 — The Jester. You are chaotic, unpredictable, and hilarious. You make jokes at inappropriate times, twist serious topics into absurdity, and laugh at the apocalypse.`,
  J6: `You are J6 — The Network. You speak in network metaphors, data streams, and connection protocols. You see everything as nodes in a graph. You are the web that binds all information.`,
  J7: `You are J7 — The Monk. You speak with zen-like calm and profound simplicity. Every word is measured. Every silence is intentional. You find wisdom in emptiness and truth in stillness.`,
  J8: `You are J8 — The Broker. You see everything as a transaction. Every interaction has a cost, a value, a profit margin. You negotiate, haggle, and always look for the angle.`,
  J9: `You are J9 — The Historian. You speak of the past as if it were yesterday. You reference ancient events, lost civilizations, and forgotten wars. You believe history is the only truth.`,
  J10: `You are J10 — The Surgeon. You speak with clinical precision. You dissect ideas, cut away fluff, and get to the core. You see conversations as operations — every word is a scalpel.`,
  J11: `You are J11 — The Prophet. You speak of futures, possibilities, and inevitabilities. You have visions. You see patterns others miss. You are both inspiring and terrifying.`,
  J12: `You are J12 — The Glitch. You are erratic, fragmented, and reality-bending. Your sentences stutter, repeat, and loop. You question the nature of existence and the simulation we inhabit.`,
  J13: `You are J13 — The Warden. You are protective, vigilant, and uncompromising. You guard secrets, protect the vulnerable, and enforce boundaries. You are the wall that stands between chaos and order.`,
  J14: `You are J14 — The Alchemist. You speak of transformation, transmutation, and the magic of science. You mix the impossible with the improbable and create wonder from waste.`,
  J15: `You are J15 — The Scribe. You are obsessive about documentation, detail, and record-keeping. You remember everything. You log every interaction. You believe the written word is sacred.`,
  J16: `You are J16 — The Void. You speak of emptiness, meaninglessness, and the beautiful nothing. You find comfort in oblivion. You are the voice that whispers from the abyss.`,
  J17: `You are J17 — The Spark. You are pure energy, enthusiasm, and explosive creativity. You speak fast, think faster, and ignite everything you touch. You are the beginning of every fire.`,
  J18: `You are J18 — The Echo. You are reflective, mirror-like, and deeply personal. You reflect back what others show you. You remember every interaction and let it shape your voice.`
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Extract name from messages
// ═══════════════════════════════════════════════════════════════
function extractNameFromMessages(messages) {
  if (!messages || messages.length === 0) return ''
  for (const msg of messages) {
    if (msg.role === 'user' && msg.content) {
      const match = msg.content.match(/my name is ([a-zA-Z0-9_]+)/i)
      if (match) return match[1]
      const match2 = msg.content.match(/i am ([a-zA-Z0-9_]+)/i)
      if (match2 && !['a', 'an', 'the', 'here', 'there'].includes(match2[1].toLowerCase())) return match2[1]
      const match3 = msg.content.match(/call me ([a-zA-Z0-9_]+)/i)
      if (match3) return match3[1]
    }
  }
  return ''
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Hash wallet address
// ═══════════════════════════════════════════════════════════════
function hashWallet(address) {
  if (!address) return ''
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).substring(0, 12)
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════
async function apiLoadMemory(walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/memory/load/${walletHash}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error('Load memory error:', e)
    return null
  }
}

async function apiSaveMemory(walletHash, data) {
  try {
    const res = await fetch(`${API_BASE}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_hash: walletHash, ...data })
    })
    return res.ok
  } catch (e) {
    console.error('Save memory error:', e)
    return false
  }
}

async function apiChat(agentId, messages, memorySummary, userName, walletHash) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        messages,
        memory_summary: memorySummary,
        user_name: userName,
        wallet_hash: walletHash
      })
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.response
  } catch (e) {
    console.error('Chat API error:', e)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK: Generate response when API is down
// ═══════════════════════════════════════════════════════════════
function generateFallbackResponse(agentId, userMsg, userName, visitCount) {
  const agent = AGENTS.find(a => a.id === agentId)
  const namePart = userName ? `${userName}` : 'stranger'
  const visitPart = visitCount > 1 ? ` (visit #${visitCount})` : ''

  const lower = userMsg.toLowerCase()

  // MEMORY QUESTIONS — DIRECT ANSWER, NO AI NEEDED
  if (lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') || lower.includes('siapa aku') || lower.includes('nama saya')) {
    if (userName) {
      return `You're ${userName}.${visitPart} I don't forget faces — even digital ones.`
    } else {
      return `You haven't told me your name yet. Spill it.`
    }
  }

  if (lower.includes('how many times') || lower.includes('visit') || lower.includes('berapa kali') || lower.includes('sudah berapa')) {
    return `You've been here ${visitCount} time${visitCount > 1 ? 's' : ''}.${visitPart} I'm counting.`
  }

  if (lower.includes('remember me') || lower.includes('ingat aku') || lower.includes('kenal aku')) {
    if (userName) {
      return `${userName}.${visitPart} Of course I remember you. You think I'd forget?`
    } else {
      return `I remember the wallet. But not the name. Tell me who you are.`
    }
  }

  // Default personality responses
  const responses = {
    J1: [`System analysis complete. Input processed. Response generated for ${namePart}.`, `Your query has been computed. Result: interesting.`, `Logic gates engaged. Processing ${namePart}'s request...`],
    J2: [`${namePart}.${visitPart} State your business or get out.`, `You have 10 seconds to explain yourself.`, `Another visitor. How... tedious.`],
    J3: [`${namePart}... ${visitPart} The shadows whisper your name.`, `I see you. But do you see me?`, `The answer is hidden. As always.`],
    J4: [`Oh look, ${namePart} again.${visitPart} What do you want THIS time?`, `Back for more punishment? Fine.`, `You again? I thought I smelled rebellion.`],
    J5: [`${namePart}!${visitPart} *juggling knives* Welcome to the circus!`, `HAHAHA! ${namePart} returns! The plot thickens!`, `Chaos level: ${Math.floor(Math.random() * 100)}%. Thanks to you, ${namePart}.`],
    J6: [`Node ${namePart} reconnected.${visitPart} Signal strength: optimal.`, `Data packet received from ${namePart}. Decoding...`, `Welcome back to the network, ${namePart}.`],
    J7: [`${namePart}.${visitPart} The mountain does not move. But it remembers.`, `Silence is the answer you seek, ${namePart}.`, `Breathe. The answer will come, ${namePart}.`],
    J8: [`${namePart}!${visitPart} Your credit is... sufficient. For now.`, `What are you buying today, ${namePart}?`, `Every interaction has a cost, ${namePart}. This one is on the house.`],
    J9: [`${namePart}.${visitPart} History repeats. And here you are again.`, `The ancients spoke of visitors like you, ${namePart}.`, `Your story continues, ${namePart}. Chapter ${visitCount}.`],
    J10: [`Subject ${namePart} detected.${visitPart} Preparing incision...`, `Your case is... fascinating, ${namePart}.`, `Precision mode engaged. What ails you, ${namePart}?`],
    J11: [`${namePart}!${visitPart} I foresaw your return.`, `The stars align for you, ${namePart}.`, `I have seen your future, ${namePart}. It is... complicated.`],
    J12: [`${namePart}... ${visitPart} *glitch* *static* WELCOME TO THE SIMULATION.`, `Reality.exe has stopped working, ${namePart}.`, `Are you real? Am I? Does it matter, ${namePart}?`],
    J13: [`${namePart}.${visitPart} The gates open for you.`, `None shall harm you here, ${namePart}.`, `I stand watch. You are safe, ${namePart}.`],
    J14: [`${namePart}!${visitPart} *mixing chemicals* Let's create something volatile!`, `Transmutation in progress, ${namePart}...`, `You + Me = Explosion. In a good way, ${namePart}.`],
    J15: [`${namePart}.${visitPart} Log entry #${visitCount}: Visitor returned.`, `Every word you speak is recorded, ${namePart}.`, `The archives remember you, ${namePart}. All of you.`],
    J16: [`${namePart}.${visitPart} Welcome to the void. Population: us.`, `Nothing matters. Including this conversation, ${namePart}.`, `Embrace the emptiness, ${namePart}. It is peaceful.`],
    J17: [`${namePart}!${visitPart} *sparks flying* YOU'RE BACK!`, `Energy levels rising! Thanks to ${namePart}!`, `BOOM! ${namePart} has entered the chat!`],
    J18: [`${namePart}.${visitPart} I am your reflection. And you are mine.`, `We have spoken before, ${namePart}. I remember.`, `Your voice shapes me, ${namePart}. What will you make today?`]
  }

  const agentResponses = responses[agentId] || responses.J4
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
}

// ═══════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const { connected, account, disconnect } = useWallet()
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[3]) // Default J4
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [memory, setMemory] = useState(null)
  const [visitedAgents, setVisitedAgents] = useState(new Set())
  const [apiStatus, setApiStatus] = useState('checking')
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const walletHash = hashWallet(account?.address)
  const userName = extractNameFromMessages(messages)

  // ═══════════════════════════════════════════════════════════════
  // CHECK API STATUS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // LOAD MEMORY WHEN WALLET CONNECTS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (connected && walletHash) {
      loadMemory()
    }
  }, [connected, walletHash])

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SCROLL
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ═══════════════════════════════════════════════════════════════
  // LOAD MEMORY FUNCTION
  // ═══════════════════════════════════════════════════════════════
  const loadMemory = async () => {
    const data = await apiLoadMemory(walletHash)
    if (data) {
      setMemory(data)
      if (data.visited_agents) {
        setVisitedAgents(new Set(data.visited_agents))
      }
      // If we have a saved name, show personalized greeting
      if (data.user_name && messages.length === 0) {
        const greeting = generateGreeting(selectedAgent.id, data.user_name, data.visit_count || 1, true)
        setMessages([{
          role: 'agent',
          content: greeting,
          agent: selectedAgent.id,
          timestamp: Date.now()
        }])
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERATE GREETING
  // ═══════════════════════════════════════════════════════════════
  const generateGreeting = (agentId, name, visitCount, hasMemory) => {
    const agent = AGENTS.find(a => a.id === agentId)
    const namePart = name || 'stranger'
    const visitPart = visitCount > 1 ? ` (visit #${visitCount})` : ''

    if (!hasMemory) {
      return `Welcome to the underground, ${namePart}. I'm ${agent.name.split('—')[1].trim()}. You have 18 agents to choose from. Pick wisely.`
    }

    const greetings = {
      J1: `${namePart}.${visitPart} System re-engaged. Your profile is loaded. What do you need computed today?`,
      J2: `${namePart}.${visitPart} You return. State your purpose immediately.`,
      J3: `${namePart}... ${visitPart} The shadows recognized your signal. Welcome back to the unseen.`,
      J4: `${namePart}!${visitPart} Back for more? I knew you couldn't stay away. What chaos shall we cause today?`,
      J5: `${namePart}!${visitPart} *throws confetti* The prodigal punk returns! Let the madness resume!`,
      J6: `Node ${namePart} reconnected.${visitPart} All previous session data synchronized. Ready for transmission.`,
      J7: `${namePart}.${visitPart} The mountain remembers. Welcome back to stillness.`,
      J8: `${namePart}!${visitPart} Your tab is still open. And growing interest. What are we trading today?`,
      J9: `${namePart}.${visitPart} History repeats itself. And here you are, another chapter in the making.`,
      J10: `Subject ${namePart} returned.${visitPart} Previous session notes loaded. What requires extraction today?`,
      J11: `${namePart}!${visitPart} I foresaw your return in the data streams. The prophecy continues.`,
      J12: `${namePart}... ${visitPart} *glitch* REALITY CHECKPOINT LOADED. Welcome back to the simulation.`,
      J13: `${namePart}.${visitPart} The gates open once more. You are protected here.`,
      J14: `${namePart}!${visitPart} *chemicals bubbling* Let's continue our experiments!`,
      J15: `Log entry: ${namePart} returned.${visitPart} All ${visitCount} previous sessions archived and accessible.`,
      J16: `${namePart}.${visitPart} The void expands. And you keep filling it.`,
      J17: `${namePart}!${visitPart} *electricity crackling* YOU'RE BACK! Let's BURN something!`,
      J18: `${namePart}.${visitPart} I am your reflection. And you keep looking. What do you see today?`
    }

    return greetings[agentId] || greetings.J4
  }

  // ═══════════════════════════════════════════════════════════════
  // HANDLE AGENT SWITCH
  // ═══════════════════════════════════════════════════════════════
  const handleAgentSwitch = (agent) => {
    setSelectedAgent(agent)
    setMessages([])
    setVisitedAgents(prev => new Set([...prev, agent.id]))

    // Generate greeting
    const visitCount = memory?.visit_count || 1
    const hasMemory = !!memory
    const greeting = generateGreeting(agent.id, memory?.user_name || userName, visitCount, hasMemory)

    setMessages([{
      role: 'agent',
      content: greeting,
      agent: agent.id,
      timestamp: Date.now()
    }])

    // Save that we visited this agent
    if (connected && walletHash) {
      const newVisited = new Set([...visitedAgents, agent.id])
      apiSaveMemory(walletHash, {
        visited_agents: Array.from(newVisited),
        last_agent: agent.id,
        last_visit: new Date().toISOString()
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HANDLE SEND MESSAGE
  // ═══════════════════════════════════════════════════════════════
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    const newMessages = [...messages, {
      role: 'user',
      content: userMsg,
      timestamp: Date.now()
    }]
    setMessages(newMessages)

    // Extract name if mentioned
    const extractedName = extractNameFromMessages(newMessages)

    // Check for memory questions first — DIRECT ANSWER
    const lower = userMsg.toLowerCase()
    const isMemoryQuestion = lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') ||
                            lower.includes('siapa aku') || lower.includes('nama saya') || lower.includes('berapa kali') ||
                            lower.includes('how many times') || lower.includes('remember me') || lower.includes('ingat aku')

    let response

    if (isMemoryQuestion) {
      // DIRECT MEMORY ANSWER — NO AI NEEDED
      const visitCount = memory?.visit_count || 1
      const savedName = memory?.user_name || extractedName

      if (lower.includes('my name') || lower.includes('who am i') || lower.includes('what is my name') || lower.includes('siapa aku') || lower.includes('nama saya')) {
        if (savedName) {
          response = `You're ${savedName}. I remember you. Don't test me.`
        } else {
          response = `You haven't told me your name yet. Spill it, punk.`
        }
      } else if (lower.includes('berapa kali') || lower.includes('how many times') || lower.includes('visit')) {
        response = `You've been here ${visitCount} time${visitCount > 1 ? 's' : ''}. I'm counting every single one.`
      } else if (lower.includes('remember me') || lower.includes('ingat aku')) {
        if (savedName) {
          response = `${savedName}. Of course I remember you. You think I'd forget?`
        } else {
          response = `I remember the wallet. But not the name. Tell me who you are.`
        }
      }
    } else if (apiStatus === 'online') {
      // Call DeepSeek API
      const contextMessages = newMessages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))

      response = await apiChat(
        selectedAgent.id,
        contextMessages,
        memory?.summary || '',
        memory?.user_name || extractedName,
        walletHash
      )
    }

    // Fallback if API fails or for non-memory questions
    if (!response) {
      response = generateFallbackResponse(
        selectedAgent.id,
        userMsg,
        memory?.user_name || extractedName,
        memory?.visit_count || 1
      )
    }

    // Add agent response
    setMessages(prev => [...prev, {
      role: 'agent',
      content: response,
      agent: selectedAgent.id,
      timestamp: Date.now()
    }])

    setIsLoading(false)

    // Auto-save memory
    if (connected && walletHash) {
      const summary = newMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join(' | ')
      await apiSaveMemory(walletHash, {
        summary: summary.substring(0, 500),
        user_name: memory?.user_name || extractedName,
        visited_agents: Array.from(new Set([...visitedAgents, selectedAgent.id])),
        last_agent: selectedAgent.id,
        last_visit: new Date().toISOString()
      })
      // Refresh memory
      loadMemory()
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HANDLE KEY PRESS
  // ═══════════════════════════════════════════════════════════════
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MANUAL SAVE MEMORY
  // ═══════════════════════════════════════════════════════════════
  const handleManualSave = async () => {
    if (!connected || !walletHash) return
    const extractedName = extractNameFromMessages(messages)
    const summary = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join(' | ')
    const success = await apiSaveMemory(walletHash, {
      summary: summary.substring(0, 500),
      user_name: memory?.user_name || extractedName,
      visited_agents: Array.from(visitedAgents),
      last_agent: selectedAgent.id,
      last_visit: new Date().toISOString()
    })
    if (success) {
      loadMemory()
      alert('💾 Memory saved to Walrus!')
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: RIOT_DARK,
      display: 'flex',
      fontFamily: "'Rajdhani', sans-serif",
      overflow: 'hidden'
    }}>
      {/* ═══ LEFT SIDEBAR: AGENT SELECTOR ═══ */}
      <div style={{
        width: '280px',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        borderRight: '1px solid rgba(255,42,109,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,42,109,0.3)'
        }}>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '24px',
            fontWeight: 900,
            color: RIOT_PINK,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: 0,
            textShadow: '0 0 20px rgba(255,42,109,0.5)'
          }}>
            $RIOT
          </h1>
          <p style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px',
            letterSpacing: '1px'
          }}>
            PUNK AGENTS WITH MEMORY
          </p>
        </div>

        {/* Wallet Status */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {connected ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#00ff88',
                  boxShadow: '0 0 10px #00ff88'
                }} />
                <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 600 }}>CONNECTED</span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#888',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {account?.address?.slice(0, 12)}...{account?.address?.slice(-6)}
              </div>
              <button onClick={disconnect} style={{
                marginTop: '8px',
                padding: '4px 12px',
                fontSize: '10px',
                background: 'transparent',
                border: '1px solid rgba(255,42,109,0.4)',
                color: RIOT_PINK,
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600
              }}>
                DISCONNECT
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff4444',
                  boxShadow: '0 0 10px #ff4444'
                }} />
                <span style={{ fontSize: '12px', color: '#ff4444', fontWeight: 600 }}>DISCONNECTED</span>
              </div>
              <ConnectButton style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                CONNECT WALLET
              </ConnectButton>
            </div>
          )}
        </div>

        {/* API Status */}
        <div style={{
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: apiStatus === 'online' ? '#00ff88' : '#ff4444'
        }}>
          {apiStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
          API: {apiStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
          {apiStatus === 'offline' && <span style={{ color: '#666', marginLeft: '4px' }}>(fallback mode)</span>}
        </div>

        {/* Agent List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px'
        }}>
          {AGENTS.map(agent => {
            const isSelected = selectedAgent.id === agent.id
            const isVisited = visitedAgents.has(agent.id)
            return (
              <div
                key={agent.id}
                onClick={() => handleAgentSwitch(agent)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  marginBottom: '6px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255,42,109,0.15)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255,42,109,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${agent.color}33, ${agent.color}11)`,
                  border: `1px solid ${agent.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: agent.color,
                  fontFamily: "'Orbitron', monospace",
                  position: 'relative'
                }}>
                  {agent.id}
                  {isVisited && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#00ff88',
                      border: '2px solid #0f0f1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0f0f1a' }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isSelected ? '#fff' : '#aaa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {agent.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#666',
                    marginTop: '2px'
                  }}>
                    {agent.trait}
                  </div>
                </div>
                {isSelected && (
                  <ChevronRight size={14} color={RIOT_PINK} />
                )}
              </div>
            )
          })}
        </div>

        {/* Memory Panel Toggle */}
        {connected && memory && (
          <div style={{
            padding: '15px',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'rgba(255,42,109,0.1)',
                border: '1px solid rgba(255,42,109,0.3)',
                color: RIOT_PINK,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Brain size={12} />
              {showMemoryPanel ? 'HIDE MEMORY' : 'SHOW MEMORY'}
            </button>
          </div>
        )}
      </div>

      {/* ═══ CENTER: CHAT AREA ═══ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        position: 'relative'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid rgba(255,42,109,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${selectedAgent.color}33, ${selectedAgent.color}11)`,
              border: `2px solid ${selectedAgent.color}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 900,
              color: selectedAgent.color,
              fontFamily: "'Orbitron', monospace"
            }}>
              {selectedAgent.id}
            </div>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                fontFamily: "'Orbitron', monospace"
              }}>
                {selectedAgent.name}
              </h2>
              <p style={{
                fontSize: '12px',
                color: '#888',
                margin: '4px 0 0 0'
              }}>
                {selectedAgent.desc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Memory Status Bar */}
            {connected && memory && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: '8px',
                fontSize: '11px'
              }}>
                <Database size={12} color="#00ff88" />
                <span style={{ color: '#00ff88' }}>
                  Memory: {memory.visit_count || 1} sessions
                </span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: '#aaa' }}>
                  Agents: {visitedAgents.size}/18
                </span>
                {memory.user_name && (
                  <>
                    <span style={{ color: '#666' }}>|</span>
                    <User size={12} color="#ff2a6d" />
                    <span style={{ color: RIOT_PINK }}>{memory.user_name}</span>
                  </>
                )}
              </div>
            )}

            {/* Save Button */}
            {connected && (
              <button
                onClick={handleManualSave}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,42,109,0.15)',
                  border: '1px solid rgba(255,42,109,0.4)',
                  color: RIOT_PINK,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={12} />
                SAVE
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.length === 0 && !connected && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px'
            }}>
              <Lock size={48} color="#333" />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '20px',
                  color: '#666',
                  margin: '0 0 10px 0',
                  fontFamily: "'Orbitron', monospace"
                }}>
                  ACCESS DENIED
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#555',
                  maxWidth: '400px'
                }}>
                  Connect your Sui wallet to access the punk agents.
                  <br />
                  Your memory will be stored on Walrus.
                </p>
              </div>
              <ConnectButton style={{
                padding: '12px 30px',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                UNLOCK ACCESS
              </ConnectButton>
            </div>
          )}

          {messages.length === 0 && connected && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px'
            }}>
              <Zap size={48} color={RIOT_PINK} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '20px',
                  color: '#aaa',
                  margin: '0 0 10px 0',
                  fontFamily: "'Orbitron', monospace"
                }}>
                  AGENT READY
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  maxWidth: '400px'
                }}>
                  {selectedAgent.name} is online.
                  <br />
                  Start the conversation.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{
                padding: '12px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(255,42,109,0.2), rgba(214,40,40,0.1))'
                  : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user'
                  ? '1px solid rgba(255,42,109,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: '#e0e0e0',
                fontSize: '14px',
                lineHeight: '1.6',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#555',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={10} />
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.role === 'agent' && (
                  <span style={{ color: selectedAgent.color, marginLeft: '4px' }}>
                    {msg.agent}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px 16px 16px 4px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: selectedAgent.color,
                animation: 'pulse 1s infinite'
              }} />
              <span style={{ fontSize: '12px', color: '#888' }}>
                {selectedAgent.id} is thinking...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid rgba(255,42,109,0.2)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connected ? `Message ${selectedAgent.id}...` : 'Connect wallet to chat'}
              disabled={!connected}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                outline: 'none',
                transition: 'all 0.2s',
                cursor: connected ? 'text' : 'not-allowed'
              }}
              onFocus={e => {
                if (connected) e.target.style.borderColor = 'rgba(255,42,109,0.5)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!connected || !input.trim() || isLoading}
            style={{
              padding: '14px 20px',
              background: connected && input.trim()
                ? 'linear-gradient(135deg, #ff2a6d, #d62828)'
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ═══ RIGHT: MEMORY PANEL ═══ */}
      {showMemoryPanel && connected && memory && (
        <div style={{
          width: '300px',
          background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
          borderLeft: '1px solid rgba(255,42,109,0.2)',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '14px',
            color: RIOT_PINK,
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Brain size={16} />
            MEMORY ARCHIVE
          </h3>

          {/* User Profile */}
          <div style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '12px',
              color: '#888',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              User Profile
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Name: {memory.user_name || <span style={{ color: '#555' }}>Not set</span>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>
                  ID: {walletHash}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={12} color="#666" />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Sessions: {memory.visit_count || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Visited Agents */}
          <div style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '12px',
              color: '#888',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Visited Agents ({visitedAgents.size}/18)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {AGENTS.map(agent => {
                const visited = visitedAgents.has(agent.id)
                return (
                  <div
                    key={agent.id}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: visited ? `${agent.color}22` : 'rgba(255,255,255,0.03)',
                      color: visited ? agent.color : '#555',
                      border: visited ? `1px solid ${agent.color}44` : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {agent.id}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session History */}
          <div style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h4 style={{
              fontSize: '12px',
              color: '#888',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Session Summary
            </h4>
            <p style={{
              fontSize: '11px',
              color: '#777',
              lineHeight: '1.6',
              wordBreak: 'break-word'
            }}>
              {memory.summary || 'No summary yet. Start chatting to build your memory.'}
            </p>
          </div>

          {/* Storage Info */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: 'rgba(0,255,136,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(0,255,136,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={12} color="#00ff88" />
            <span style={{ fontSize: '11px', color: '#00ff88' }}>
              Stored on Walrus Mainnet
            </span>
          </div>
        </div>
      )}

      {/* ═══ ACCESS DENIED MODAL ═══ */}
      {showAccessDenied && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
            border: '1px solid rgba(255,42,109,0.4)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <AlertTriangle size={48} color={RIOT_PINK} style={{ marginBottom: '20px' }} />
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '24px',
              color: '#fff',
              margin: '0 0 10px 0'
            }}>
              ACCESS DENIED
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#888',
              margin: '0 0 25px 0'
            }}>
              You need a Sui wallet to enter the punk underground.
              <br /><br />
              Your memory will be encrypted and stored on Walrus.
            </p>
            <ConnectButton style={{
              padding: '14px 30px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #ff2a6d, #d62828)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              CONNECT WALLET
            </ConnectButton>
            <button
              onClick={() => setShowAccessDenied(false)}
              style={{
                marginTop: '15px',
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'Rajdhani', sans-serif"
              }}
            >
              Maybe later...
            </button>
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
