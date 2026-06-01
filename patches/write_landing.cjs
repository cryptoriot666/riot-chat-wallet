const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>$RIOT — The Agentic Memory Layer for Sui</title>
  <meta name="description" content="Agentic memory layer for Sui — 25 persistent AI agents with cross-session memory, Walrus storage, Seal encryption, and on-chain immortalization." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Rubik+Glitch&family=Rubik+Mono+One&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0a07; color: #e0d0c0; font-family: 'Inter', sans-serif; overflow-x: hidden; min-height: 100vh; }
    body::after {
      content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
      pointer-events: none; z-index: 9999; animation: scan 6s linear infinite;
    }
    @keyframes scan { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
    .glitch {
      font-family: 'Rubik Glitch', cursive; position: relative; display: inline-block;
    }
    .glitch::before, .glitch::after {
      content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .glitch::before {
      color: #ff2a6d; z-index: -1; animation: gs 3s infinite linear;
      clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
    }
    .glitch::after {
      color: #00ffff; z-index: -2; animation: gs 2.5s infinite linear reverse;
      clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
    }
    @keyframes gs {
      0% { transform: translate(0); }
      5% { transform: translate(-3px, 1px); }
      10% { transform: translate(0); }
      15% { transform: translate(2px, -1px); }
      20% { transform: translate(0); }
      100% { transform: translate(0); }
    }
    .nb { animation: nb 3s ease-in-out infinite; }
    @keyframes nb {
      0%, 100% { text-shadow: 0 0 10px rgba(255,42,109,0.5), 0 0 20px rgba(255,42,109,0.3); }
      50% { text-shadow: 0 0 20px rgba(255,42,109,0.8), 0 0 40px rgba(255,42,109,0.5), 0 0 60px rgba(255,42,109,0.3); }
    }
    #particles { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0; }
    .p {
      position: absolute; width: 4px; height: 4px; background: #ff2a6d; border-radius: 50%; opacity: 0;
      animation: fl 20s infinite;
    }
    @keyframes fl {
      0% { opacity: 0; transform: translateY(100vh) rotate(0deg); }
      20% { opacity: 0.6; }
      80% { opacity: 0.6; }
      100% { opacity: 0; transform: translateY(-10vh) rotate(360deg); }
    }
    nav {
      position: fixed; top: 0; left: 0; right: 0; padding: 16px 24px;
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(13,10,7,0.9); backdrop-filter: blur(10px); z-index: 100;
      border-bottom: 1px solid rgba(255,42,109,0.2);
    }
    .logo { font-family: 'Rubik Glitch', cursive; font-size: 20px; color: #ff2a6d; text-decoration: none; }
    .nl { display: flex; gap: 20px; align-items: center; }
    .nl a { color: #a08060; text-decoration: none; font-size: 13px; font-family: 'Rubik Mono One', sans-serif; transition: color 0.2s; }
    .nl a:hover { color: #fff; }
    .ncta { padding: 8px 20px; background: linear-gradient(135deg, #ff2a6d, #ff6b35); border-radius: 6px; color: #000 !important; font-weight: 700; }
    .hero {
      min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
      align-items: center; text-align: center; padding: 120px 24px 60px; position: relative; z-index: 1;
    }
    .hb {
      display: inline-block; padding: 6px 16px; background: rgba(255,42,109,0.1);
      border: 1px solid rgba(255,42,109,0.3); border-radius: 20px; font-size: 11px;
      color: #ff2a6d; font-family: 'Rubik Mono One', sans-serif; margin-bottom: 24px; letter-spacing: 1px;
    }
    .hero h1 {
      font-family: 'Rubik Glitch', cursive; font-size: clamp(32px, 8vw, 72px);
      line-height: 1.1; margin-bottom: 16px; max-width: 800px;
    }
    .hero h1 .h2 { color: #ffb703; }
    .hero h1 .h3 { color: #00ffff; }
    .hero p {
      font-size: clamp(14px, 2.5vw, 20px); color: #a08060; max-width: 600px;
      margin-bottom: 32px; line-height: 1.6;
    }
    .cr { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .cp {
      padding: 14px 32px; background: linear-gradient(135deg, #ff2a6d, #ff6b35);
      color: #000; text-decoration: none; border-radius: 8px; font-family: 'Rubik Mono One', sans-serif;
      font-size: 14px; transition: transform 0.2s, box-shadow 0.2s;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .cp:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,42,109,0.4); }
    .cs {
      padding: 14px 32px; border: 2px solid rgba(255,255,255,0.15); color: #e0d0c0;
      text-decoration: none; border-radius: 8px; font-family: 'Rubik Mono One', sans-serif;
      font-size: 14px; transition: border-color 0.2s;
    }
    .cs:hover { border-color: #ff2a6d; }
    .hs { display: flex; gap: 40px; margin-top: 40px; }
    .st { text-align: center; }
    .sn { font-family: 'Rubik Glitch', cursive; font-size: 28px; color: #fff; }
    .sl { font-size: 11px; color: #6a5040; font-family: 'Rubik Mono One', sans-serif; margin-top: 4px; }
    section { padding: 80px 24px; position: relative; z-index: 1; }
    .stt { text-align: center; font-family: 'Rubik Glitch', cursive; font-size: clamp(24px, 5vw, 40px); margin-bottom: 16px; }
    .sts { text-align: center; color: #6a5040; max-width: 600px; margin: 0 auto 48px; font-size: 14px; }
    .uc { max-width: 1100px; margin: 0 auto; }
    .ug { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .ucd {
      padding: 24px; background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
      transition: border-color 0.2s, background 0.2s;
    }
    .ucd:hover { border-color: rgba(255,42,109,0.3); background: rgba(255,42,109,0.03); }
    .ucd .e { font-size: 28px; margin-bottom: 12px; }
    .ucd h3 { font-family: 'Rubik Mono One', sans-serif; font-size: 13px; color: #fff; margin-bottom: 8px; }
    .ucd p { font-size: 13px; color: #8a7050; line-height: 1.5; }
    .ucd .ag { margin-top: 12px; font-size: 11px; color: #ff2a6d; font-family: 'Rubik Mono One', sans-serif; }
    .agrid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
    .ac {
      padding: 12px; border-radius: 8px; border: 1px solid;
    }
    .ac .an { font-size: 11px; font-family: 'Rubik Mono One', sans-serif; color: #fff; margin: 4px 0 2px; }
    .ac .as { font-size: 10px; color: #6a5040; }
    footer { text-align: center; padding: 40px 24px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #6a5040; position: relative; z-index: 1; }
    footer a { color: #ff2a6d; text-decoration: none; }
    @media (max-width: 600px) { .hs { flex-direction: column; gap: 16px; } nav { padding: 12px 16px; } .nl a { font-size: 11px; } }
  </style>
</head>
<body>

<div id="particles"></div>

<nav>
  <a href="/" class="logo glitch" data-text="$RIOT">$RIOT</a>
  <div class="nl">
    <a href="#uc">Use Cases</a>
    <a href="#a">Agents</a>
    <a href="https://github.com/cryptoriot666/riot-chat-wallet" target="_blank">GitHub</a>
    <a href="https://riot-chat-wallet-temp.vercel.app" class="ncta">Launch App →</a>
  </div>
</nav>

<section class="hero">
  <div class="hb">Sui Overflow 2026 — Walrus Track</div>
  <h1>
    <span class="glitch" data-text="THE AGENTIC">THE AGENTIC</span><br>
    <span class="glitch" data-text="MEMORY LAYER">MEMORY LAYER</span><br>
    <span class="glitch" data-text="FOR SUI"><span class="h2">FOR</span> <span class="h3">SUI</span></span>
  </h1>
  <p>25 persistent AI agents that remember everything. Connect your wallet, pick your specialist, and never repeat yourself again. Deployed on <strong style="color:#2ec4b6;">Sui Mainnet</strong>.</p>
  <div class="cr">
    <a href="https://riot-chat-wallet-temp.vercel.app" class="cp">Launch the App</a>
    <a href="https://github.com/cryptoriot666/riot-chat-wallet" class="cs" target="_blank">View on GitHub</a>
  </div>
  <div class="hs">
    <div class="st"><div class="sn nb">25</div><div class="sl">AI AGENTS</div></div>
    <div class="st"><div class="sn nb" style="animation-delay:0.5s;">∞</div><div class="sl">PERSISTENT MEMORY</div></div>
    <div class="st"><div class="sn nb" style="animation-delay:1s;">✓</div><div class="sl">MAINNET LIVE</div></div>
  </div>
</section>

<section id="uc">
  <h2 class="stt glitch" data-text="REAL-WORLD USE CASES">REAL-WORLD USE CASES</h2>
  <p class="sts">7 applications that work today — not slides, not promises. Live on Mainnet.</p>
  <div class="uc"><div class="ug">

<div class="ucd"><div class="e">👤</div><h3>Personal AI Companion</h3><p>Talk to J4 about crypto, J10 about health. Both remember you. One persistent identity across all AI interactions.</p><div class="ag">J4 · J10 · J7 · J18</div></div>
<div class="ucd"><div class="e">🏢</div><h3>Customer Support</h3><p>25 specialist agents for 25 topics. J2 handles security, J8 handles billing. No repeat explanations.</p><div class="ag">J2 · J8 · J1 · J13</div></div>
<div class="ucd"><div class="e">🎓</div><h3>Education Tutor</h3><p>J1 teaches math, remembers where you struggle. J15 creates personalized study guides. Tracked across weeks.</p><div class="ag">J1 · J15 · J7 · J24</div></div>
<div class="ucd"><div class="e">✍️</div><h3>Creative Writing</h3><p>J21 learns your voice. J5 adds chaotic twists. Your writing partner that actually knows you.</p><div class="ag">J21 · J5 · J15 · J23</div></div>
<div class="ucd"><div class="e">🧘</div><h3>Mental Wellness</h3><p>J7 listens without judgment. Encrypted memory vault — only you can decrypt. Tracks patterns across sessions.</p><div class="ag">J7 · J18 · J20 · J24</div></div>
<div class="ucd"><div class="e">🎮</div><h3>Gaming NPCs</h3><p>Permanent NPC memory. Your companion remembers betraying you 3 months ago. The grudge is real.</p><div class="ag">J12 · J6 · J9 · J22</div></div>
<div class="ucd"><div class="e">🔬</div><h3>Research Assistant</h3><p>Track DeFi research across 3 months. J14 tracks tokenomics. J16 optimizes notes. Cross-session memory search.</p><div class="ag">J14 · J16 · J11 · J9</div></div>

  </div></div>
</section>

<section id="a" style="background:rgba(255,42,109,0.02);">
  <h2 class="stt glitch" data-text="25 SPECIALIST AGENTS">25 SPECIALIST AGENTS</h2>
  <p class="sts">Not one personality with 25 skins. Each agent is a domain expert with distinct memory.</p>
  <div class="agrid">

<div class="ac" style="background:rgba(0,255,136,0.05);border-color:rgba(0,255,136,0.15);"><span style="font-size:18px;">🏛️</span><div class="an">J1 - Architect</div><div class="as">Smart contract design</div></div>
<div class="ac" style="background:rgba(255,0,68,0.05);border-color:rgba(255,0,68,0.15);"><span style="font-size:18px;">⚔️</span><div class="an">J2 - Enforcer</div><div class="as">Security audits</div></div>
<div class="ac" style="background:rgba(157,78,221,0.05);border-color:rgba(157,78,221,0.15);"><span style="font-size:18px;">👻</span><div class="an">J3 - Phantom</div><div class="as">Stealth transactions</div></div>
<div class="ac" style="background:rgba(255,42,109,0.05);border-color:rgba(255,42,109,0.15);"><span style="font-size:18px;">🤘</span><div class="an">J4 - Rebel</div><div class="as">DAO governance</div></div>
<div class="ac" style="background:rgba(255,158,0,0.05);border-color:rgba(255,158,0,0.15);"><span style="font-size:18px;">🃏</span><div class="an">J5 - Jester</div><div class="as">Viral content</div></div>
<div class="ac" style="background:rgba(0,180,216,0.05);border-color:rgba(0,180,216,0.15);"><span style="font-size:18px;">🌐</span><div class="an">J6 - Network</div><div class="as">Cross-chain routing</div></div>
<div class="ac" style="background:rgba(144,224,239,0.05);border-color:rgba(144,224,239,0.15);"><span style="font-size:18px;">🧘</span><div class="an">J7 - Monk</div><div class="as">Gas optimization</div></div>
<div class="ac" style="background:rgba(255,215,0,0.05);border-color:rgba(255,215,0,0.15);"><span style="font-size:18px;">💼</span><div class="an">J8 - Broker</div><div class="as">DeFi yield</div></div>
<div class="ac" style="background:rgba(201,173,167,0.05);border-color:rgba(201,173,167,0.15);"><span style="font-size:18px;">📜</span><div class="an">J9 - Historian</div><div class="as">Audit trails</div></div>
<div class="ac" style="background:rgba(230,57,70,0.05);border-color:rgba(230,57,70,0.15);"><span style="font-size:18px;">🔪</span><div class="an">J10 - Surgeon</div><div class="as">Vuln patching</div></div>
<div class="ac" style="background:rgba(244,162,97,0.05);border-color:rgba(244,162,97,0.15);"><span style="font-size:18px;">🔮</span><div class="an">J11 - Prophet</div><div class="as">Market prediction</div></div>
<div class="ac" style="background:rgba(255,0,110,0.05);border-color:rgba(255,0,110,0.15);"><span style="font-size:18px;">⚡</span><div class="an">J12 - Glitch</div><div class="as">Fuzzing</div></div>
<div class="ac" style="background:rgba(42,157,143,0.05);border-color:rgba(42,157,143,0.15);"><span style="font-size:18px;">🛡️</span><div class="an">J13 - Warden</div><div class="as">Access control</div></div>
<div class="ac" style="background:rgba(231,111,81,0.05);border-color:rgba(231,111,81,0.15);"><span style="font-size:18px;">🧪</span><div class="an">J14 - Alchemist</div><div class="as">Tokenomics</div></div>
<div class="ac" style="background:rgba(168,218,220,0.05);border-color:rgba(168,218,220,0.15);"><span style="font-size:18px;">✍️</span><div class="an">J15 - Scribe</div><div class="as">Documentation</div></div>
<div class="ac" style="background:rgba(29,53,87,0.05);border-color:rgba(29,53,87,0.15);"><span style="font-size:18px;">🕳️</span><div class="an">J16 - Void</div><div class="as">Storage optimization</div></div>
<div class="ac" style="background:rgba(255,183,3,0.05);border-color:rgba(255,183,3,0.15);"><span style="font-size:18px;">🔥</span><div class="an">J17 - Spark</div><div class="as">Launch strategy</div></div>
<div class="ac" style="background:rgba(108,117,125,0.05);border-color:rgba(108,117,125,0.15);"><span style="font-size:18px;">🔄</span><div class="an">J18 - Echo</div><div class="as">Memory recall</div></div>
<div class="ac" style="background:rgba(255,68,68,0.05);border-color:rgba(255,68,68,0.15);"><span style="font-size:18px;">💥</span><div class="an">J19 - Catalyst</div><div class="as">Protocol migration</div></div>
<div class="ac" style="background:rgba(0,255,136,0.05);border-color:rgba(0,255,136,0.15);"><span style="font-size:18px;">🔐</span><div class="an">J20 - Cipher</div><div class="as">ZK proofs</div></div>
<div class="ac" style="background:rgba(255,102,0,0.05);border-color:rgba(255,102,0,0.15);"><span style="font-size:18px;">🔨</span><div class="an">J21 - Forge</div><div class="as">NFT generation</div></div>
<div class="ac" style="background:rgba(68,0,68,0.05);border-color:rgba(68,0,68,0.15);"><span style="font-size:18px;">🌀</span><div class="an">J22 - Abyss</div><div class="as">Whale tracking</div></div>
<div class="ac" style="background:rgba(255,0,255,0.05);border-color:rgba(255,0,255,0.15);"><span style="font-size:18px;">🌈</span><div class="an">J23 - Prism</div><div class="as">Analytics</div></div>
<div class="ac" style="background:rgba(0,136,255,0.05);border-color:rgba(0,136,255,0.15);"><span style="font-size:18px;">⚓</span><div class="an">J24 - Anchor</div><div class="as">Portfolio hedging</div></div>
<div class="ac" style="background:rgba(255,255,0,0.05);border-color:rgba(255,255,0,0.15);"><span style="font-size:18px;">♾️</span><div class="an">J25 - Meridian</div><div class="as">Rebalancing</div></div>

  </div>
</section>

<section>
  <h2 class="stt glitch" data-text="TECH STACK">TECH STACK</h2>
  <p class="sts">Sui Mainnet · Walrus Storage · Seal Encryption · MCP Protocol · Tatum</p>
  <div style="max-width:700px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:12px;">

<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">⚛️</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">Sui Mainnet</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">Move smart contract</div>
</div>
<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">🗄️</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">Walrus Storage</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">Chat blobs + encrypted data</div>
</div>
<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">🔐</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">Seal Encryption</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">AES-256-CTR + PBKDF2</div>
</div>
<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">🤖</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">25 AI Agents</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">Specialist personalities</div>
</div>
<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">🔌</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">MCP Protocol</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">JSON-RPC 2.0 server</div>
</div>
<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">📡</div>
  <div style="font-size:12px;font-family:'Rubik Mono One',sans-serif;color:#fff;">Tatum Infrastructure</div>
  <div style="font-size:10px;color:#6a5040;margin-top:2px;">RPC + Storage API</div>
</div>

  </div>
</section>

<footer>
  <p>Built for <a href="https://suioverflow.com" target="_blank">Sui Overflow 2026</a> — Walrus Track</p>
  <p style="margin-top:8px;color:#ff2a6d;font-family:'Rubik Mono One',sans-serif;font-size:10px;">THE RIOT IS INEVITABLE</p>
</footer>

<script>
const colors = ['#ff2a6d','#00fff7','#ffb703','#9d4edd','#2ec4b6'];
const p = document.getElementById('particles');
for (let i = 0; i < 50; i++) {
  const d = document.createElement('div');
  d.className = 'p';
  d.style.left = Math.random() * 100 + '%';
  d.style.background = colors[Math.floor(Math.random() * colors.length)];
  d.style.animationDuration = (15 + Math.random() * 20) + 's';
  d.style.animationDelay = Math.random() * 20 + 's';
  d.style.width = d.style.height = (2 + Math.random() * 4) + 'px';
  p.appendChild(d);
}
</script>

</body>
</html>`;

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/index.html', html);
console.log('Landing page written! Size:', html.length);
