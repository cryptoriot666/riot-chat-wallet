import { useState, useEffect, useCallback } from 'react'
import { ConnectButton, useWallet } from '@suiet/wallet-kit'

const WALRUS_API = 'https://walrus-testnet-api.com' // Ganti dengan mainnet API
const MEMORY_API = '/api' // Vercel serverless functions

const agents = [
  { id: 'j4', name: 'J4', role: 'THE FRONTMAN', trait: 'REBELLIOUS', image: 'assets/J4.jpg' },
  { id: 'j1', name: 'J1', role: 'THE STRATEGIST', trait: 'CALCULATING', image: 'assets/J1.jpg' },
  { id: 'j2', name: 'J2', role: 'THE FIRESTARTER', trait: 'AGGRESSIVE', image: 'assets/J2.jpg' },
  { id: 'j3', name: 'J3', role: 'THE SILENT WATCHER', trait: 'MYSTERIOUS', image: 'assets/J3.jpg' },
  { id: 'j5', name: 'J5', role: 'THE GLITCH', trait: 'CHAOTIC', image: 'assets/J5.jpg' },
  { id: 'j6', name: 'J6', role: 'THE CONNECTOR', trait: 'NETWORKED', image: 'assets/J6.jpg' },
  { id: 'j7', name: 'J7', role: 'THE RESET', trait: 'CALM', image: 'assets/J7.jpg' },
  { id: 'j8', name: 'J8', role: 'THE DISRUPTOR', trait: 'UNPREDICTABLE', image: 'assets/J8.jpg' },
  { id: 'j9', name: 'J9', role: 'THE VOICE', trait: 'PERSUASIVE', image: 'assets/J9.jpg' },
  { id: 'j10', name: 'J10', role: 'THE ARTIST', trait: 'CREATIVE', image: 'assets/J10.jpg' },
  { id: 'j11', name: 'J11', role: 'THE VENOM', trait: 'TOXIC', image: 'assets/J11.jpg' },
  { id: 'j12', name: 'J12', role: 'THE ROT', trait: 'PATIENT', image: 'assets/J12.jpg' },
  { id: 'j13', name: 'J13', role: 'THE GHOST', trait: 'FADING', image: 'assets/J13.jpg' },
  { id: 'j14', name: 'J14', role: 'THE FRAGMENT', trait: 'BROKEN', image: 'assets/J14.jpg' },
  { id: 'j15', name: 'J15', role: 'THE KEEPER', trait: 'PROTECTIVE', image: 'assets/J15.jpg' },
  { id: 'j16', name: 'J16', role: 'THE REFLECTION', trait: 'DUAL', image: 'assets/J16.jpg' },
  { id: 'j17', name: 'J17', role: 'THE RUMOR', trait: 'FAST', image: 'assets/J17.jpg' },
  { id: 'j18', name: 'J18', role: 'THE FLOW', trait: 'ADAPTABLE', image: 'assets/J18.jpg' }
]

// Mock memory data (replace with actual API calls)
const mockMemories = {
  '0x972a...65ff': {
    lastSession: '2 days ago',
    lastTopic: 'BTC retest analysis',
    preferences: ['neon aesthetic', 'punk culture', 'crypto trading'],
    relationship: 'Skeptical but loyal',
    sessions: 12,
    agentsVisited: ['j4', 'j1', 'j10']
  }
}

function App() {
  const { connected, account, disconnect } = useWallet()
  const [currentAgent, setCurrentAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userMemory, setUserMemory] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [isLoadingMemory, setIsLoadingMemory] = useState(false)

  // Load user memory when wallet connects
  useEffect(() => {
    if (connected && account) {
      loadUserMemory(account.address)
    } else {
      setUserMemory(null)
    }
  }, [connected, account])

  const loadUserMemory = async (address) => {
    setIsLoadingMemory(true)
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`${MEMORY_API}/get-memory`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ walletAddress: address })
      // })
      // const data = await res.json()
      
      // Mock for now
      const mockData = mockMemories[address] || {
        lastSession: null,
        lastTopic: null,
        preferences: [],
        relationship: 'New user',
        sessions: 0,
        agentsVisited: []
      }
      
      setUserMemory(mockData)
    } catch (err) {
      console.error('Failed to load memory:', err)
      setUserMemory(null)
    } finally {
      setIsLoadingMemory(false)
    }
  }

  const generateGreeting = (agent, memory) => {
    const shortAddr = account.address.slice(0,6) + '...' + account.address.slice(-4)
    
    if (!memory || memory.sessions === 0) {
      return `First time seeing you, ${shortAddr}. I'm ${agent.name}. State your business.`
    }

    const greetings = [
      `Ah, ${shortAddr}. I remember you. Last time you asked about ${memory.lastTopic}. Still holding?`,
      `Back again, ${shortAddr}? You've talked to ${memory.agentsVisited.length} of us now. Making rounds?`,
      `${shortAddr}... ${memory.relationship}. That's what the others say about you. What do you want with me?`,
      `Session #${memory.sessions + 1}, ${shortAddr}. I see you like ${memory.preferences[0] || 'causing trouble'}. Let's begin.`
    ]

    // Cross-agent memory reference
    if (memory.agentsVisited.includes(agent.id)) {
      return `Welcome back to my domain, ${shortAddr}. Last time you were here, we discussed ${memory.lastTopic}. Ready to continue?`
    }

    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  const openChat = (agent) => {
    setCurrentAgent(agent)
    
    let greeting
    if (connected && userMemory) {
      greeting = generateGreeting(agent, userMemory)
    } else if (connected) {
      greeting = `Ah, ${account.address.slice(0,6)}...${account.address.slice(-4)}. I'm ${agent.name}. State your business.`
    } else {
      greeting = `I'm ${agent.name}. Connect your wallet if you want me to remember you.`
    }
    
    setMessages([{ id: Date.now(), type: 'agent', sender: agent.name, text: greeting }])
    
    // Auto-save session summary on close (hybrid)
    setSessionSummary({
      agentId: agent.id,
      startTime: Date.now(),
      topics: [],
      preferences: []
    })
  }

  const closeChat = () => {
    // Hybrid save: auto-save summary, prompt for full
    if (connected && messages.length > 1) {
      const summary = generateSessionSummary()
      setSessionSummary(summary)
      setShowSaveModal(true)
    } else {
      setCurrentAgent(null)
    }
  }

  const generateSessionSummary = () => {
    const userMessages = messages.filter(m => m.type === 'user').map(m => m.text)
    const topics = extractTopics(userMessages)
    
    return {
      agentId: currentAgent.id,
      startTime: sessionSummary?.startTime || Date.now(),
      endTime: Date.now(),
      topics,
      messageCount: messages.length,
      userPreferences: extractPreferences(userMessages)
    }
  }

  const extractTopics = (messages) => {
    // Simple keyword extraction (replace with NLP later)
    const keywords = ['BTC', 'ETH', 'NFT', 'Walrus', 'Sui', 'trading', 'art', 'music', 'punk']
    const found = []
    keywords.forEach(kw => {
      if (messages.some(m => m.toLowerCase().includes(kw.toLowerCase()))) {
        found.push(kw)
      }
    })
    return found.length > 0 ? found : ['general']
  }

  const extractPreferences = (messages) => {
    // Extract user preferences from messages
    const prefs = []
    if (messages.some(m => m.includes('like') || m.includes('love'))) {
      prefs.push('expressed preference')
    }
    return prefs
  }

  const saveMemory = async (saveType) => {
    if (!connected || !account) return

    const data = {
      walletAddress: account.address,
      agentId: currentAgent.id,
      saveType,
      summary: sessionSummary,
      transcript: saveType === 'full' ? messages : null,
      timestamp: Date.now()
    }

    try {
      // TODO: Replace with actual API
      // await fetch(`${MEMORY_API}/save-memory`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // })

      console.log('Saving memory:', data)
      
      // Update local memory state
      setUserMemory(prev => ({
        ...prev,
        sessions: (prev?.sessions || 0) + 1,
        lastSession: 'just now',
        lastTopic: sessionSummary.topics[0],
        agentsVisited: [...new Set([...(prev?.agentsVisited || []), currentAgent.id])]
      }))

      setShowSaveModal(false)
      setCurrentAgent(null)
    } catch (err) {
      console.error('Failed to save memory:', err)
      alert('Failed to save memory. Please try again.')
    }
  }

  const discardMemory = () => {
    setShowSaveModal(false)
    setCurrentAgent(null)
  }

  const sendMessage = () => {
    if (!inputText.trim()) return
    const msg = inputText.trim()
    setInputText('')
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', sender: 'YOU', text: msg }])
    setIsTyping(true)

    // Update session summary topics
    setSessionSummary(prev => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...extractTopics([msg])])]
    }))

    setTimeout(() => {
      setIsTyping(false)
      const responses = generateAgentResponse(msg, currentAgent, userMemory)
      const response = responses[Math.floor(Math.random() * responses.length)]
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'agent', sender: currentAgent.name, text: response }])
    }, 1500)
  }

  const generateAgentResponse = (userMsg, agent, memory) => {
    // Cross-agent memory reference
    if (memory && memory.preferences.length > 0 && Math.random() > 0.7) {
      return `I heard from the others that you're into ${memory.preferences[0]}. ${getAgentResponse(agent.id)}`
    }
    
    if (userMsg.toLowerCase().includes('remember') && memory) {
      return `Of course I remember. You've had ${memory.sessions} sessions with us. Last topic: ${memory.lastTopic || 'nothing specific'}.`
    }

    const baseResponses = [
      "The RIOT collection is expanding. 25 punk agents strong, each with unique traits stored permanently on Walrus.",
      "We are autonomous. We don't sleep. We analyze market signals and evolve through on-chain memory.",
      "Interesting signal. The collective is processing your input.",
      "Sui is our native territory. Low gas, parallel execution, and Walrus for permanent agent memory."
    ]
    
    return baseResponses[Math.floor(Math.random() * baseResponses.length)]
  }

  const getAgentResponse = (agentId) => {
    const responses = {
      j4: 'The riot grows. What do you want?',
      j1: 'State your objective.',
      j10: 'Want me to create something for you?'
    }
    return responses[agentId] || 'What else?'
  }

  // Auto-save on idle (5 minutes)
  useEffect(() => {
    if (!currentAgent || !connected) return
    
    const idleTimer = setTimeout(() => {
      if (messages.length > 1) {
        const summary = generateSessionSummary()
        // Auto-save summary silently
        console.log('Auto-saving summary:', summary)
        // TODO: Call API to save summary
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearTimeout(idleTimer)
  }, [currentAgent, messages, connected])

  return (
    <div>
      {/* Header */}
      <div className="header">
        <a href="https://theriot.vercel.app" className="back-link">&larr; Back</a>
        <h1 className="glitch">$RIOT</h1>
        <p>A Collection of Punks. Permanent Memory. One Riot.</p>
        <div className="badge">WALLET IDENTITY + WALRUS MEMORY</div>
      </div>

      {/* Wallet Bar */}
      <div className="wallet-section">
        <div className="wallet-bar">
          <div className="wallet-status">
            <div className={`wallet-icon ${connected ? 'connected' : ''}`}>
              {connected ? '✅' : '🔐'}
            </div>
            <div className="wallet-info">
              <h3 className={connected ? 'connected' : ''}>
                {connected ? 'Wallet Connected' : 'Connect Wallet'}
              </h3>
              <p>
                {connected 
                  ? `${account.address.slice(0,6)}...${account.address.slice(-4)}${userMemory ? ` • ${userMemory.sessions} sessions` : ''}`
                  : 'Link wallet to enable memory'
                }
              </p>
            </div>
          </div>
          
          {connected ? (
            <button className="connect-btn connected" onClick={() => disconnect()}>
              Disconnect
            </button>
          ) : (
            <ConnectButton className="connect-btn">
              Connect
            </ConnectButton>
          )}
        </div>
      </div>

      {/* Memory Status Bar (visible when connected) */}
      {connected && userMemory && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '10px 20px',
          background: '#0a1a0a',
          borderBottom: '1px solid #0f0',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: '#0f0'
        }}>
          <span>🧠 Memory: {userMemory.sessions} sessions stored</span>
          <span>Last: {userMemory.lastSession || 'Never'}</span>
          <span>Agents visited: {userMemory.agentsVisited.length}/18</span>
          <span style={{ marginLeft: 'auto' }}>Relationship: {userMemory.relationship}</span>
        </div>
      )}

      {/* Agent Grid */}
      <div className="grid">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card" onClick={() => openChat(agent)}>
            <div className="agent-image-container">
              <img 
                src={agent.image} 
                alt={agent.name}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentNode.innerHTML = `<div class="agent-placeholder">${agent.name}</div>`
                }}
              />
            </div>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-role">{agent.role}</div>
              <span className="agent-trait">{agent.trait}</span>
              {userMemory?.agentsVisited?.includes(agent.id) && (
                <span style={{
                  display: 'inline-block',
                  background: '#0f0',
                  color: '#000',
                  padding: '2px 8px',
                  marginLeft: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}>VISITED</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Modal */}
      {currentAgent && (
        <div className="chat-modal active">
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-left">
                <img src={currentAgent.image} alt={currentAgent.name} />
                <div className="chat-header-info">
                  <h3>{currentAgent.name}</h3>
                  <p>{currentAgent.role}</p>
                </div>
              </div>
              <button className="close-btn" onClick={closeChat}>X</button>
            </div>
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.type}`}>
                  <div className="sender">{msg.sender}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="message agent">
                  <div className="sender">{currentAgent.name}</div>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Speak to the punk..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>SEND</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Memory Modal (Hybrid) */}
      {showSaveModal && (
        <div className="save-modal active">
          <div className="save-container">
            <h2>Save Session?</h2>
            <p>Your chat with {currentAgent.name} will be stored on Walrus.</p>
            
            <div style={{
              background: '#1a1a1a',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <div style={{ color: '#0f0', marginBottom: '8px' }}>📊 Session Summary (Auto-saved)</div>
              <div style={{ color: '#666' }}>
                • Topics: {sessionSummary?.topics?.join(', ') || 'general'}<br/>
                • Messages: {sessionSummary?.messageCount || 0}<br/>
                • Duration: {Math.round((Date.now() - (sessionSummary?.startTime || Date.now())) / 60000)} min<br/>
                • Cost: 0.01 WAL
              </div>
            </div>

            <div className="save-options">
              <button className="save-btn save-quick" onClick={() => saveMemory('quick')}>
                ⚡ Quick Save (Summary)
              </button>
              <button className="save-btn save-full" onClick={() => saveMemory('full')}>
                📄 Full Save (+ Transcript) — 0.05 WAL
              </button>
              <button className="save-btn save-discard" onClick={discardMemory}>
                🗑️ Discard
              </button>
            </div>
            <div className="save-status" style={{ marginTop: '15px', fontSize: '0.8rem', color: '#666' }}>
              Auto-save summary will be stored even if you discard
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p>Hand-drawn by <a href="https://twitter.com/cryptoriot666" target="_blank">@cryptoriot666</a> &bull; 
        <a href="https://walrus.xyz" target="_blank">Walrus</a> &bull; 
        <a href="https://sui.io" target="_blank">Sui</a></p>
      </div>

      <style>{`
        .header {
          text-align: center;
          padding: 40px 20px 30px;
          border-bottom: 1px solid #ff0040;
          position: relative;
        }
        .header h1 {
          font-size: 3.5rem;
          color: #ff0040;
          text-shadow: 0 0 20px rgba(255, 0, 64, 0.5);
          letter-spacing: -2px;
          animation: glitch 2s infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .header p { font-size: 1.1rem; color: #666; margin-top: 10px; }
        .badge {
          display: inline-block;
          background: #ff0040;
          color: #000;
          padding: 5px 15px;
          margin-top: 15px;
          font-weight: bold;
          font-size: 0.85rem;
        }
        .back-link {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #ff0040;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .wallet-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          border-bottom: 1px solid #333;
        }
        .wallet-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          border: 1px solid #333;
          padding: 15px 25px;
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .wallet-status { display: flex; align-items: center; gap: 15px; }
        .wallet-icon {
          width: 40px; height: 40px;
          background: #1a0005;
          border: 2px solid #ff0040;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .wallet-icon.connected { border-color: #0f0; background: #0a1a0a; }
        .wallet-info h3 { color: #ff0040; font-size: 1rem; }
        .wallet-info h3.connected { color: #0f0; }
        .wallet-info p { color: #666; font-size: 0.8rem; }
        .connect-btn {
          background: #ff0040;
          color: #000;
          border: none;
          padding: 12px 30px;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
          border-radius: 4px;
        }
        .connect-btn.connected { background: #0f0; }
        
        .wkit-connect-button {
          background: #ff0040 !important;
          color: #000 !important;
          border: none !important;
          padding: 12px 30px !important;
          font-family: 'Courier Prime', monospace !important;
          font-weight: bold !important;
          font-size: 1rem !important;
          border-radius: 4px !important;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          padding: 40px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .agent-card {
          background: #111;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.3s;
          overflow: hidden;
          position: relative;
        }
        .agent-card:hover {
          border-color: #ff0040;
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(255, 0, 64, 0.3);
        }
        .agent-image-container {
          width: 100%; height: 300px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .agent-image-container img {
          width: 100%; height: 100%;
          object-fit: cover;
          filter: grayscale(30%);
          transition: filter 0.3s;
        }
        .agent-card:hover .agent-image-container img { filter: grayscale(0%); }
        .agent-placeholder {
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a0005 0%, #0a0a0a 100%);
          color: #ff0040;
          font-size: 3rem;
          font-weight: bold;
        }
        .agent-info { padding: 20px; }
        .agent-name { font-size: 1.5rem; color: #ff0040; font-weight: bold; }
        .agent-role { font-size: 0.9rem; color: #666; margin-top: 5px; }
        .agent-trait {
          display: inline-block;
          background: #222;
          color: #ff0040;
          padding: 3px 10px;
          margin-top: 10px;
          font-size: 0.8rem;
          border: 1px solid #ff0040;
        }
        .chat-modal {
          display: none;
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          justify-content: center;
          align-items: center;
        }
        .chat-modal.active { display: flex; }
        .chat-container {
          width: 90%; max-width: 700px;
          height: 85vh;
          background: #111;
          border: 2px solid #ff0040;
          display: flex;
          flex-direction: column;
        }
        .chat-header {
          padding: 20px;
          border-bottom: 1px solid #ff0040;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0a0a0a;
        }
        .chat-header-left { display: flex; align-items: center; gap: 15px; }
        .chat-header-left img {
          width: 50px; height: 50px;
          object-fit: cover;
          border: 2px solid #ff0040;
        }
        .chat-header-info h3 { color: #ff0040; font-size: 1.3rem; }
        .chat-header-info p { color: #666; font-size: 0.85rem; }
        .close-btn {
          background: none;
          border: 1px solid #ff0040;
          color: #ff0040;
          padding: 8px 20px;
          cursor: pointer;
          font-family: inherit;
          font-size: 1rem;
        }
        .close-btn:hover { background: #ff0040; color: #000; }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 25px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          background: #0a0a0a;
        }
        .message {
          max-width: 80%;
          padding: 15px 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.user {
          align-self: flex-end;
          background: #1a1a1a;
          border-left: 3px solid #666;
          color: #fff;
        }
        .message.agent {
          align-self: flex-start;
          background: #1a0005;
          border-left: 3px solid #ff0040;
          color: #ffcccc;
        }
        .message .sender { font-size: 0.8rem; margin-bottom: 6px; opacity: 0.7; font-weight: bold; }
        .typing-indicator { display: flex; gap: 6px; padding: 12px 0; }
        .typing-indicator span {
          width: 8px; height: 8px;
          background: #8338ec;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .chat-input {
          padding: 20px;
          border-top: 1px solid #ff0040;
          display: flex;
          gap: 12px;
          background: #0a0a0a;
        }
        .chat-input input {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          color: #fff;
          padding: 14px 18px;
          font-family: inherit;
          font-size: 1rem;
        }
        .chat-input input:focus { outline: none; border-color: #ff0040; }
        .chat-input button {
          background: #ff0040;
          color: #000;
          border: none;
          padding: 14px 28px;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
        }
        .chat-input button:hover { background: #ff3366; }
        
        .save-modal {
          display: none;
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 3000;
          justify-content: center;
          align-items: center;
        }
        .save-modal.active { display: flex; }
        .save-container {
          width: 90%; max-width: 500px;
          background: #111;
          border: 2px solid #ff0040;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
        }
        .save-container h2 { color: #ff0040; margin-bottom: 15px; }
        .save-container p { color: #666; margin-bottom: 25px; font-size: 0.9rem; }
        .save-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .save-btn {
          padding: 15px;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          border: 2px solid;
          font-size: 1rem;
        }
        .save-quick { background: #0a1a0a; color: #0f0; border-color: #0f0; }
        .save-full { background: #1a0005; color: #ff0040; border-color: #ff0040; }
        .save-discard { background: #1a1a1a; color: #666; border-color: #333; }
        
        .footer {
          text-align: center;
          padding: 40px 20px;
          border-top: 1px solid #333;
          color: #666;
          font-size: 0.9rem;
        }
        .footer a { color: #ff0040; text-decoration: none; }
        @media (max-width: 768px) {
          .header h1 { font-size: 2.5rem; }
          .wallet-bar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}

export default App