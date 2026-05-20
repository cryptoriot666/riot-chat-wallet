import { useState, useEffect, useRef } from "react";
import { WalletProvider, ConnectButton, useWallet } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui";
import "@suiet/wallet-kit/style.css";
import { api } from "./api";
import "./App.css";

// ─── Package ID dari contract deploy ────────────────────
const PACKAGE_ID = "0x10ed017fd1d495a9dfb29590f43df7dfd467f91acc8bba1eb0ad4244a8ec7afd";

// ─── 25 Agent Personalities with Punk Images ────────────
const AGENTS = [
  { id: "J4", name: "J4", title: "The Frontman", color: "#ff0040", desc: "Chaotic, sarcastic, anti-system. Will roast your portfolio.", image: "/assets/J4.jpg", trait: "REBELLIOUS" },
  { id: "J1", name: "J1", title: "The Strategist", color: "#4488ff", desc: "Plans 10 moves ahead. Chess while you play checkers.", image: "/assets/J1.jpg", trait: "CALCULATING" },
  { id: "J2", name: "J2", title: "The Firestarter", color: "#ff4400", desc: "Direct, loud, zero filter. Market is war, soldier up.", image: "/assets/J2.jpg", trait: "AGGRESSIVE" },
  { id: "J3", name: "J3", title: "The Silent Watcher", color: "#8800ff", desc: "Mysterious, cryptic, speaks in riddles. Trust no one.", image: "/assets/J3.jpg", trait: "MYSTERIOUS" },
  { id: "J5", name: "J5", title: "The Trickster", color: "#ffaa00", desc: "Chaotic neutral, trolls everyone. Including you.", image: "/assets/J5.jpg", trait: "CHAOTIC" },
  { id: "J6", name: "J6", title: "The Network", color: "#00ff88", desc: "Connected to everything. Knows alpha before it drops.", image: "/assets/J6.jpg", trait: "CONNECTED" },
  { id: "J7", name: "J7", title: "The Zen", color: "#00ccff", desc: "Calm, philosophical, never panics. Diamond hands only.", image: "/assets/J7.jpg", trait: "PEACEFUL" },
  { id: "J8", name: "J8", title: "The Architect", color: "#ff00cc", desc: "Builds systems, analyzes patterns. Code is poetry.", image: "/assets/J8.jpg", trait: "BUILDING" },
  { id: "J9", name: "J9", title: "The Oracle", color: "#ccff00", desc: "Predicts moves, reads charts like tarot. Believe or perish.", image: "/assets/J9.jpg", trait: "DIVINING" },
  { id: "J10", name: "J10", title: "The Mercenary", color: "#ff2222", desc: "Only cares about profit. No loyalty, only gains.", image: "/assets/J10.jpg", trait: "GREEDY" },
  { id: "J11", name: "J11", title: "The Ghost", color: "#888888", desc: "Invisible, untraceable, silent alpha. You never saw it coming.", image: "/assets/J11.jpg", trait: "HIDDEN" },
  { id: "J12", name: "J12", title: "The Prophet", color: "#ffdd00", desc: "Sees the future. Usually right. Usually ignored.", image: "/assets/J12.jpg", trait: "FORESIGHT" },
  { id: "J13", name: "J13", title: "The Glitch", color: "#00ff00", desc: "Reality is a simulation. Find the exploit. Break the game.", image: "/assets/J13.jpg", trait: "BUGGED" },
  { id: "J14", name: "J14", title: "The Collector", color: "#ff66aa", desc: "Hoards NFTs, rare drops, alpha. Gotta catch em all.", image: "/assets/J14.jpg", trait: "HOARDING" },
  { id: "J15", name: "J15", title: "The Tactician", color: "#4488ff", desc: "Plans 10 moves ahead. Chess while you play checkers.", image: "/assets/J15.jpg", trait: "STRATEGIC" },
  { id: "J16", name: "J16", title: "The Warden", color: "#aa4444", desc: "Protects the bag. Rug-pull detector. Your guardian angel.", image: "/assets/J16.jpg", trait: "PROTECTIVE" },
  { id: "J17", name: "J17", title: "The Alchemist", color: "#aa00ff", desc: "Turns shitcoins into gold. Experimental, dangerous.", image: "/assets/J17.jpg", trait: "TRANSMUTING" },
  { id: "J18", name: "J18", title: "The Nomad", color: "#ff8844", desc: "Never stays in one chain. Multi-chain, borderless.", image: "/assets/J18.jpg", trait: "WANDERING" },
  { id: "J19", name: "J19", title: "The Catalyst", color: "#44ffaa", desc: "Sparks revolutions. One tweet away from moon.", image: "/assets/J19_1.jpg", trait: "IGNITING" },
  { id: "J20", name: "J20", title: "The Phantom", color: "#666666", desc: "Unseen, unheard, but always present.", image: "/assets/J20.jpg", trait: "ELUSIVE" },
  { id: "J21", name: "J21", title: "The Catalyst", color: "#ff6600", desc: "Forces change. Unstoppable momentum.", image: "/assets/J21.jpg", trait: "DRIVING" },
  { id: "J22", name: "J22", title: "The Architect", color: "#00aaff", desc: "Designs the future. Blueprints reality.", image: "/assets/J22.jpg", trait: "DESIGNING" },
  { id: "J23", name: "J23", title: "The Oracle", color: "#ff00ff", desc: "Speaks truths others fear to hear.", image: "/assets/J23.jpg", trait: "REVEALING" },
  { id: "J24", name: "J24", title: "The Nomad", color: "#88ff00", desc: "Roams free. No chains can hold.", image: "/assets/J24.jpg", trait: "ROAMING" },
  { id: "J25", name: "J25", title: "The Warden", color: "#ff4444", desc: "Guards the gates. None shall pass.", image: "/assets/J25.jpg", trait: "DEFENDING" },
];

// ─── Main App Component ─────────────────────────────────
function ChatApp() {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState({ 
    loading: false, 
    saved: false, 
    error: null,
    objectId: null,
    txDigest: null
  });
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
      return `Welcome to the riot. I am ${agent.name}, ${agent.title}. ${agent.desc}`;
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

    return returnGreetings[agent.id] || `Welcome back. Visit #${memory.interactions}. Youve met ${memory.agentsVisited} agents.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgent || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
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

  // ─── ON-CHAIN SAVE MEMORY ──────────────────────────────
  const saveToWalrus = async () => {
    if (!connected || !account?.address || messages.length === 0) return;

    try {
      setMemoryStatus({ 
        loading: true, 
        saved: false, 
        error: null,
        objectId: null,
        txDigest: null
      });

      // 1. Create Sui transaction for on-chain storage
      const tx = new Transaction();

      // 2. Call move function
      tx.moveCall({
        target: `${PACKAGE_ID}::memory::store_memory`,
        arguments: [
          tx.pure.address(account.address),
          tx.pure.string(currentAgent.id),
          tx.pure.string(JSON.stringify(messages.slice(-10))),
          tx.pure.string(generateSummary(messages, currentAgent))
        ]
      });

      // 3. WALLET POPUP! User sign & execute
      const result = await signAndExecuteTransactionBlock({ 
        transactionBlock: tx 
      });

      // 4. Get object ID from result
      const objectId = result.objectChanges?.find(
        c => c.type === 'created'
      )?.objectId;

      const txDigest = result.digest;

      // 5. Save to backend with on-chain info
      const saveResult = await api.saveMemory(
        account.address,
        currentAgent.id,
        messages,
        generateSummary(messages, currentAgent),
        objectId,
        txDigest
      );

      if (saveResult.success) {
        setMemoryStatus({ 
          loading: false, 
          saved: true, 
          error: null,
          objectId: objectId,
          txDigest: txDigest
        });
        // Reload memory to update context
        await loadUserMemory(account.address);
      }

    } catch (err) {
      console.error("Transaction failed:", err);
      setMemoryStatus({ 
        loading: false, 
        saved: false, 
        error: err.message || "Transaction failed",
        objectId: null,
        txDigest: null
      });
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
                    : "25 punk agents. Each with permanent memory on Walrus."
                  : "Connect wallet to access the agents."
                }
              </p>
              {deepseekStatus === "connected" && (
                <p className="deepseek-badge">🧠 DeepSeek AI Powered</p>
              )}
            </div>

            {/* Memory Status Bar */}
            {connected && userMemory && (
              <div className="memory-status-bar">
                <span className="memory-stat">
                  <span className="memory-dot"></span>
                  Memory: {userMemory.interactions} sessions stored
                </span>
                <span className="memory-stat">
                  Last: {userMemory.lastActive ? new Date(userMemory.lastActive).toLocaleDateString() : "just now"}
                </span>
                <span className="memory-stat">
                  Agents visited: {userMemory.agentsVisited}/25
                </span>
                <span className="memory-stat relationship">
                  Relationship: {userMemory.interactions > 5 ? "Veteran" : userMemory.interactions > 1 ? "Returning" : "New user"}
                </span>
              </div>
            )}

            <div className="agents-container">
              {AGENTS.map(agent => (
                <div 
                  key={agent.id}
                  className="agent-card"
                  style={{ "--agent-color": agent.color }}
                  onClick={() => selectAgent(agent)}
                >
                  <div className="agent-image-container">
                    <img src={agent.image} alt={agent.name} className="agent-image" />
                  </div>
                  <div className="agent-info">
                    <div className="agent-name" style={{ color: agent.color }}>{agent.name}</div>
                    <div className="agent-title">{agent.title}</div>
                    <div className="agent-trait" style={{ borderColor: agent.color, color: agent.color }}>{agent.trait}</div>
                  </div>
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
                <img src={selectedAgent.image} alt={selectedAgent.name} className="chat-agent-image" />
                <div>
                  <div className="chat-agent-name" style={{ color: selectedAgent.color }}>
                    {selectedAgent.name} — {selectedAgent.title}
                  </div>
                  <div className="chat-agent-desc">{selectedAgent.desc}</div>
                </div>
              </div>

              <div className="memory-controls">
                {memoryStatus.loading && <span className="memory-loading">Confirm in wallet...</span>}
                {memoryStatus.saved && !memoryStatus.objectId && <span className="memory-saved">✓ Saved</span>}
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

            {/* On-Chain Success Message */}
            {memoryStatus.saved && memoryStatus.objectId && (
              <div className="onchain-banner">
                <span>✓ Stored on-chain</span>
                <a 
                  href={`https://suiscan.xyz/testnet/tx/${memoryStatus.txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Tx ↗
                </a>
                <span className="object-id">
                  Object: {memoryStatus.objectId.slice(0, 12)}...
                </span>
              </div>
            )}

            <div className="messages-container">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`message ${msg.role}`}
                  style={msg.role === "agent" ? { borderLeftColor: msg.agent?.color || selectedAgent.color } : {}}
                >
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : (
                      <img src={msg.agent?.image || selectedAgent.image} alt={msg.agent?.name || selectedAgent.name} className="message-avatar-img" />
                    )}
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
                  <div className="message-avatar">
                    <img src={selectedAgent.image} alt={selectedAgent.name} className="message-avatar-img" />
                  </div>
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
        <span>Memory stored on Walrus + Sui Blockchain</span>
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
