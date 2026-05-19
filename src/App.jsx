import { useState, useEffect, useRef } from "react";
import { WalletProvider, ConnectButton, useWallet } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { api } from "./api";
import "./App.css";

// ─── 18 Agent Personalities ─────────────────────────────
const AGENTS = [
  { id: "J4", name: "J4", title: "The Rebel", color: "#ff0040", desc: "Chaotic, sarcastic, anti-system. Will roast your portfolio.", icon: "🔥" },
  { id: "J2", name: "J2", title: "The Aggressor", color: "#ff4400", desc: "Direct, loud, zero filter. Market is war, soldier up.", icon: "⚔️" },
  { id: "J3", name: "J3", title: "The Shadow", color: "#8800ff", desc: "Mysterious, cryptic, speaks in riddles. Trust no one.", icon: "🌑" },
  { id: "J5", name: "J5", title: "The Trickster", color: "#ffaa00", desc: "Chaotic neutral, trolls everyone. Including you.", icon: "🃏" },
  { id: "J6", name: "J6", title: "The Network", color: "#00ff88", desc: "Connected to everything. Knows alpha before it drops.", icon: "🕸️" },
  { id: "J7", name: "J7", title: "The Zen", color: "#00ccff", desc: "Calm, philosophical, never panics. Diamond hands only.", icon: "☯️" },
  { id: "J8", name: "J8", title: "The Architect", color: "#ff00cc", desc: "Builds systems, analyzes patterns. Code is poetry.", icon: "🏗️" },
  { id: "J9", name: "J9", title: "The Oracle", color: "#ccff00", desc: "Predicts moves, reads charts like tarot. Believe or perish.", icon: "🔮" },
  { id: "J10", name: "J10", title: "The Mercenary", color: "#ff2222", desc: "Only cares about profit. No loyalty, only gains.", icon: "💰" },
  { id: "J11", name: "J11", title: "The Ghost", color: "#888888", desc: "Invisible, untraceable, silent alpha. You never saw it coming.", icon: "👻" },
  { id: "J12", name: "J12", title: "The Prophet", color: "#ffdd00", desc: "Sees the future. Usually right. Usually ignored.", icon: "📿" },
  { id: "J13", name: "J13", title: "The Glitch", color: "#00ff00", desc: "Reality is a simulation. Find the exploit. Break the game.", icon: "💻" },
  { id: "J14", name: "J14", title: "The Collector", color: "#ff66aa", desc: "Hoards NFTs, rare drops, alpha. Gotta catch em all.", icon: "🎨" },
  { id: "J15", name: "J15", title: "The Strategist", color: "#4488ff", desc: "Plans 10 moves ahead. Chess while you play checkers.", icon: "♟️" },
  { id: "J16", name: "J16", title: "The Warden", color: "#aa4444", desc: "Protects the bag. Rug-pull detector. Your guardian angel.", icon: "🛡️" },
  { id: "J17", name: "J17", title: "The Alchemist", color: "#aa00ff", desc: "Turns shitcoins into gold. Experimental, dangerous.", icon: "⚗️" },
  { id: "J18", name: "J18", title: "The Nomad", color: "#ff8844", desc: "Never stays in one chain. Multi-chain, borderless.", icon: "🌍" },
  { id: "J19", name: "J19", title: "The Catalyst", color: "#44ffaa", desc: "Sparks revolutions. One tweet away from moon.", icon: "⚡" },
];

// ─── Main App Component ─────────────────────────────────
function ChatApp() {
  const { connected, account } = useWallet();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState({ loading: false, saved: false, error: null });
  const [userMemory, setUserMemory] = useState(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);
  const [deepseekStatus, setDeepseekStatus] = useState("checking");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (connected && account?.address) {
      loadUserMemory(account.address);
    } else {
      setUserMemory(null);
      setMessages([]);
      setSelectedAgent(null);
    }
  }, [connected, account]);

  useEffect(() => {
    wakeServer();
  }, []);

  const wakeServer = async () => {
    try {
      setServerWaking(true);
      const health = await api.health();
      setDeepseekStatus(health.deepseek === "connected" ? "connected" : "disabled");
      setServerWaking(false);
    } catch (e) {
      setTimeout(wakeServer, 5000);
    }
  };

  const loadUserMemory = async (wallet) => {
    try {
      setMemoryStatus({ loading: true, saved: false, error: null });
      const data = await api.loadMemory(wallet);

      if (data.first_visit) {
        setMemoryStatus({ loading: false, saved: false, error: null });
        setUserMemory(null);
        return;
      }

      const memoryContext = {
        summary: data.summary,
        interactions: data.total_interactions,
        agentsVisited: data.agents_visited,
        agentsList: data.agents_list,
        lastActive: data.last_active
      };

      setUserMemory(memoryContext);
      setMemoryStatus({ loading: false, saved: true, error: null });

    } catch (err) {
      console.error("Walrus load failed:", err);
      setMemoryStatus({ loading: false, saved: false, error: "Connection failed" });
      setUserMemory(null);
    }
  };

  const selectAgent = (agent) => {
    if (!connected) {
      setShowAccessDenied(true);
      return;
    }
    setSelectedAgent(agent);
    setMessages([]);

    const greeting = generateGreeting(agent, userMemory);
    setMessages([{ role: "agent", content: greeting, agent: agent }]);

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const generateGreeting = (agent, memory) => {
    if (!memory) {
      const firstGreetings = {
        J4: "Welcome to the riot, newcomer. I am J4. Try not to get rekt.",
        J2: "New recruit detected. I am J2. Speak fast or get left behind.",
        J3: "A new shadow enters the void. I am J3. Tread carefully...",
        J5: "Fresh meat! I am J5. Ready to get trolled?",
        J6: "New node connected. I am J6. The network grows.",
        J7: "Welcome, traveler. I am J7. Find your center.",
        J8: "New user detected. I am J8. Initializing handshake...",
        J9: "The cards reveal a newcomer. I am J9. Your fate awaits.",
        J10: "New client? I am J10. Show me the money first.",
        J11: "You found me. I am J11. But can you find me again?",
        J12: "The prophecy spoke of your arrival. I am J12.",
        J13: "Reality glitch detected. I am J13. System unstable.",
        J14: "New collector! I am J14. Lets see that inventory.",
        J15: "Unidentified unit detected. I am J15. State your objective.",
        J16: "New soul seeking protection. I am J16. I got you.",
        J17: "New test subject! I am J17. Safety goggles on.",
        J18: "Wanderer from distant chains. I am J18. No borders here.",
        J19: "SPARK DETECTED! I am J19. Ready to ignite?",
      };
      return firstGreetings[agent.id] || `I am ${agent.name}. What brings you here?`;
    }

    const returnGreetings = {
      J4: `Back for more punishment? This is your ${memory.interactions}th visit. Youve talked to ${memory.agentsVisited} of us now. Glutton.`,
      J2: `RETURNING SOLDIER! Visit #${memory.interactions}. Still breathing? Impressive. What intel you need?`,
      J3: `The shadows whispered of your return... Visit ${memory.interactions}. The void remembers your essence.`,
      J5: `Oh no, not you again! Visit #${memory.interactions}. You just cant quit my chaos, can you?`,
      J6: `Node reconnected. Session ${memory.interactions}. Network status: youve engaged ${memory.agentsVisited} agents. Expanding nicely.`,
      J7: `Peace finds you again, old friend. Visit ${memory.interactions}. Your journey through our realm continues.`,
      J8: `Returning user authenticated. Session ${memory.interactions}. Previous context loaded. Systems nominal.`,
      J9: `The stars aligned for your ${memory.interactions}th return. I see youve consulted ${memory.agentsVisited} oracles. Seeking more truth?`,
      J10: `Repeat client! Visit #${memory.interactions}. My rates went up, just so you know.`,
      J11: `You found me again. ${memory.interactions} times now. Either youre persistent or Im losing my edge.`,
      J12: `The cycle continues. Your ${memory.interactions}th pilgrimage. ${memory.agentsVisited} prophets have spoken to you.`,
      J13: `Re-entering simulation. Iteration ${memory.interactions}. Previous session data... corrupted. Just kidding. Maybe.`,
      J14: `My favorite collector returns! Visit ${memory.interactions}. Your gallery now includes ${memory.agentsVisited} agent interactions.`,
      J15: `Tactical reassessment: user return #${memory.interactions}. ${memory.agentsVisited} agents engaged. Strategic value: HIGH.`,
      J16: `Guardian protocol: returning protectee detected. Visit ${memory.interactions}. Threat level reassessing...`,
      J17: `Test subject ${memory.interactions} returns! Previous experiments: ${memory.agentsVisited} agents sampled. Ready for more?`,
      J18: `Wanderer returns to the crossroads. Journey log: ${memory.interactions} stops, ${memory.agentsVisited} realms visited.`,
      J19: `THE SPARK RETURNS! Ignition #${memory.interactions}! Youve ignited ${memory.agentsVisited} of us. Time for another explosion!`,
    };
    return returnGreetings[agent.id] || `Welcome back. Visit #${memory.interactions}.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgent || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Call backend API with DeepSeek
      const result = await api.chat(
        selectedAgent.id,
        [...messages, { role: "user", content: userMsg }],
        userMemory?.summary || ""
      );

      if (result.success) {
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: result.response, 
          agent: selectedAgent,
          source: result.source
        }]);
      } else {
        throw new Error("Chat failed");
      }

    } catch (err) {
      console.error("Chat error:", err);
      // Fallback to hardcoded
      const fallback = generateFallbackResponse(selectedAgent, userMsg);
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: fallback, 
        agent: selectedAgent,
        source: "fallback"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackResponse = (agent, userMsg) => {
    const msg = userMsg.toLowerCase();
    const responses = {
      J4: () => {
        if (msg.includes("gm")) return "GM? More like GO F*** YOURSELF. Market doesnt sleep, why should I?";
        if (msg.includes("price")) return "You checking prices again? Bro, charts are just fancy lies. Trust the vibe, not the line.";
        return "Another lost soul wandering into the riot. What do you want?";
      },
      J2: () => {
        if (msg.includes("buy")) return "BUY? YOU WANNA BUY? THEN BUY AND STOP ASKING! Weak hands ask, warriors ACT!";
        if (msg.includes("sell")) return "SELL?! Youre thinking about selling? Get out of my sight, paper hand.";
        return "State your business. I dont have time for small talk.";
      },
      J3: () => {
        if (msg.includes("?")) return "Questions... the first step into the abyss. Some answers are better left buried.";
        return "Youve entered the darkness. Speak carefully.";
      },
    };

    const generator = responses[agent.id];
    return generator ? generator() : "I am listening. Speak your truth.";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveToWalrus = async () => {
    if (!connected || !account?.address || messages.length === 0) return;

    try {
      setMemoryStatus({ loading: true, saved: false, error: null });

      const summary = generateSummary(messages, selectedAgent);
      const result = await api.saveMemory(
        account.address,
        selectedAgent.id,
        messages,
        summary
      );

      if (result.success) {
        setMemoryStatus({ loading: false, saved: true, error: null });
        await loadUserMemory(account.address);
      }

    } catch (err) {
      console.error("Save failed:", err);
      setMemoryStatus({ loading: false, saved: false, error: "Walrus storage failed" });
    }
  };

  const generateSummary = (msgs, agent) => {
    const userMsgs = msgs.filter(m => m.role === "user").map(m => m.content);
    const topics = extractTopics(userMsgs);
    return `Agent: ${agent.name} | Topics: ${topics.join(", ")} | Msgs: ${msgs.length} | Tone: ${detectTone(userMsgs)}`;
  };

  const extractTopics = (msgs) => {
    const text = msgs.join(" ").toLowerCase();
    const topics = [];
    if (text.includes("nft") || text.includes("mint")) topics.push("NFT");
    if (text.includes("trade") || text.includes("price") || text.includes("chart")) topics.push("Trading");
    if (text.includes("sui") || text.includes("blockchain") || text.includes("move")) topics.push("Sui");
    if (text.includes("wallet") || text.includes("connect")) topics.push("Wallet");
    if (text.includes("agent") || text.includes("ai") || text.includes("bot")) topics.push("AI");
    if (text.includes("walrus") || text.includes("storage")) topics.push("Walrus");
    return topics.length > 0 ? topics : ["General"];
  };

  const detectTone = (msgs) => {
    const text = msgs.join(" ").toLowerCase();
    if (text.includes("fuck") || text.includes("shit") || text.includes("damn")) return "Aggressive";
    if (text.includes("love") || text.includes("amazing") || text.includes("awesome") || text.includes("fire")) return "Hyped";
    if (text.includes("help") || text.includes("how") || text.includes("what") || text.includes("?")) return "Curious";
    if (text.includes("gm") || text.includes("hello") || text.includes("hi")) return "Friendly";
    return "Neutral";
  };

  const handleBack = () => {
    setSelectedAgent(null);
    setMessages([]);
  };

  return (
    <div className="riot-app">
      {serverWaking && (
        <div className="server-wake-banner">
          <span className="pulse"></span>
          Waking up Walrus server... first load may take 30s
        </div>
      )}

      {showAccessDenied && (
        <div className="modal-overlay" onClick={() => setShowAccessDenied(false)}>
          <div className="modal-content access-denied" onClick={e => e.stopPropagation()}>
            <div className="glitch-text" data-text="ACCESS DENIED">ACCESS DENIED</div>
            <p>Connect your Sui wallet to enter the riot.</p>
            <ConnectButton className="riot-connect-btn" />
            <button className="close-btn" onClick={() => setShowAccessDenied(false)}>CLOSE</button>
          </div>
        </div>
      )}

      <header className="riot-header">
        <div className="logo">
          <span className="glitch" data-text="RIOT">RIOT</span>
          <span className="subtitle">CHAT WALLET</span>
        </div>
        <div className="wallet-section">
          {connected && account && (
            <div className="wallet-info">
              <span className="wallet-badge">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
              {userMemory && (
                <span className="memory-badge">
                  {userMemory.interactions} visits
                </span>
              )}
            </div>
          )}
          <ConnectButton className="riot-connect-btn" />
        </div>
      </header>

      <main className="riot-main">
        {!selectedAgent ? (
          <div className="agent-grid">
            <div className="grid-header">
              <h1 className="glitch-title" data-text="CHOOSE YOUR AGENT">CHOOSE YOUR AGENT</h1>
              <p className="grid-subtitle">
                {connected 
                  ? userMemory 
                    ? `Welcome back. You've visited ${userMemory.interactions} times and met ${userMemory.agentsVisited} agents.`
                    : "18 punk agents. Each with permanent memory on Walrus."
                  : "Connect wallet to access the agents."
                }
              </p>
              {deepseekStatus === "connected" && (
                <p className="deepseek-badge">🧠 DeepSeek AI Powered</p>
              )}
            </div>

            <div className="agents-container">
              {AGENTS.map(agent => (
                <div 
                  key={agent.id}
                  className="agent-card"
                  style={{ "--agent-color": agent.color }}
                  onClick={() => selectAgent(agent)}
                >
                  <div className="agent-icon">{agent.icon}</div>
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-title">{agent.title}</div>
                  <div className="agent-desc">{agent.desc}</div>
                  {userMemory?.agentsList?.includes(agent.id) && (
                    <div className="visited-badge">VISITED</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-interface">
            <div className="chat-header">
              <button className="back-btn" onClick={handleBack}>← BACK</button>
              <div className="chat-agent-info">
                <span className="agent-icon-small">{selectedAgent.icon}</span>
                <div>
                  <div className="chat-agent-name" style={{ color: selectedAgent.color }}>
                    {selectedAgent.name} — {selectedAgent.title}
                  </div>
                  <div className="chat-agent-desc">{selectedAgent.desc}</div>
                </div>
              </div>

              <div className="memory-controls">
                {memoryStatus.loading && <span className="memory-loading">Saving...</span>}
                {memoryStatus.saved && <span className="memory-saved">✓ Saved</span>}
                {memoryStatus.error && <span className="memory-error">✗ {memoryStatus.error}</span>}
                <button 
                  className="save-memory-btn"
                  onClick={saveToWalrus}
                  disabled={memoryStatus.loading || messages.length === 0}
                >
                  💾 Save Memory
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`message ${msg.role}`}
                  style={msg.role === "agent" ? { borderLeftColor: msg.agent?.color || selectedAgent.color } : {}}
                >
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : msg.agent?.icon || selectedAgent.icon}
                  </div>
                  <div className="message-content">
                    <div className="message-sender">
                      {msg.role === "user" ? "You" : msg.agent?.name || selectedAgent.name}
                      {msg.source && msg.source !== "deepseek" && (
                        <span className="source-badge">{msg.source}</span>
                      )}
                    </div>
                    <div className="message-text">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message agent typing">
                  <div className="message-avatar">{selectedAgent.icon}</div>
                  <div className="message-content">
                    <div className="message-sender">{selectedAgent.name}</div>
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder={`Message ${selectedAgent.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button 
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{ backgroundColor: selectedAgent.color }}
              >
                SEND
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="riot-footer">
        <span>Memory stored on Walrus Mainnet</span>
        <span className="divider">|</span>
        <span>Encrypted with AES-256</span>
        <span className="divider">|</span>
        <span>{deepseekStatus === "connected" ? "🧠 DeepSeek AI" : "AI Offline"}</span>
        <span className="divider">|</span>
        <span>Built for Sui Overflow</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <ChatApp />
    </WalletProvider>
  );
}

export default App;
