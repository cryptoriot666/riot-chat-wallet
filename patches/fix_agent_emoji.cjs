const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Fix emoji: replace '???' placeholders with actual emoji
const emoji = {
  '🏛️': '\u{1F3DB}\u{FE0F}',
  '⚔️': '\u{2694}\u{FE0F}',
  '👻': '\u{1F47B}',
  '🤘': '\u{1F918}',
  '🃏': '\u{1F0CF}',
  '🌐': '\u{1F310}',
  '🧘': '\u{1F9D8}',
  '💼': '\u{1F4BC}',
  '📜': '\u{1F4DC}',
  '🔪': '\u{1F52A}',
  '🔮': '\u{1F52E}',
  '⚡': '\u{26A1}',
  '🛡️': '\u{1F6E1}\u{FE0F}',
  '🧪': '\u{1F9EA}',
  '✍️': '\u{270D}\u{FE0F}',
  '🕳️': '\u{1F573}\u{FE0F}',
  '🔥': '\u{1F525}',
  '🔄': '\u{1F504}',
  '💥': '\u{1F4A5}',
  '🔐': '\u{1F510}',
  '🔨': '\u{1F528}',
  '🌀': '\u{1F300}',
  '🌈': '\u{1F308}',
  '⚓': '\u{2693}',
  '♾️': '\u{267E}\u{FE0F}',
};

// The AGENTS array is at known lines — replace the ? issue via exact string replacement
// Since the edit tool garbled emoji, we do a pass to replace '???', '??', '?' patterns in emoji field
// Actually simpler: just write the full AGENTS array

const agentsNew = [
  { id: 'ARCHITECT', name: 'J1 - The Architect', trait: 'Analytical', desc: 'Systems within systems. I see the patterns.', color: '#00ff88', emoji: '\u{1F3DB}\u{FE0F}', specialty: 'Smart contract design & system architecture', img: '/assets/J1.jpg' },
  { id: 'ENFORCER', name: 'J2 - The Enforcer', trait: 'Aggressive', desc: 'Order through force. No negotiation.', color: '#ff0044', emoji: '\u{2694}\u{FE0F}', specialty: 'Security audits & threat detection', img: '/assets/J2.jpg' },
  { id: 'PHANTOM', name: 'J3 - The Phantom', trait: 'Mysterious', desc: 'I watch from the shadows. Always.', color: '#9d4edd', emoji: '\u{1F47B}', specialty: 'Private key management & stealth transactions', img: '/assets/J3.jpg' },
  { id: 'REBEL', name: 'J4 - The Rebel', trait: 'Defiant', desc: 'The system fears me. Good.', color: '#ff2a6d', emoji: '\u{1F918}', specialty: 'DAO governance & protocol forking', img: '/assets/J4.jpg' },
  { id: 'JESTER', name: 'J5 - The Jester', trait: 'Chaotic', desc: 'Chaos is a ladder. And I am climbing.', color: '#ff9e00', emoji: '\u{1F0CF}', specialty: 'Meme strategy & viral content generation', img: '/assets/J5.jpg' },
  { id: 'NETWORK', name: 'J6 - The Network', trait: 'Connected', desc: 'Every node. Every signal. Known.', color: '#00b4d8', emoji: '\u{1F310}', specialty: 'Cross-chain bridge monitoring & routing', img: '/assets/J6.jpg' },
  { id: 'MONK', name: 'J7 - The Monk', trait: 'Calm', desc: 'Silence is the ultimate weapon.', color: '#90e0ef', emoji: '\u{1F9D8}', specialty: 'Gas optimization & fee forecasting', img: '/assets/J7.jpg' },
  { id: 'BROKER', name: 'J8 - The Broker', trait: 'Greedy', desc: 'Everything has a price. Even you.', color: '#ffd700', emoji: '\u{1F4BC}', specialty: 'DeFi yield optimization & arbitrage', img: '/assets/J8.jpg' },
  { id: 'HISTORIAN', name: 'J9 - The Historian', trait: 'Nostalgic', desc: 'The past writes the future.', color: '#c9ada7', emoji: '\u{1F4DC}', specialty: 'Transaction history analysis & audit trails', img: '/assets/J9.jpg' },
  { id: 'SURGEON', name: 'J10 - The Surgeon', trait: 'Precise', desc: 'Cut. Extract. Optimize.', color: '#e63946', emoji: '\u{1F52A}', specialty: 'Smart contract vulnerability patching', img: '/assets/J10.jpg' },
  { id: 'PROPHET', name: 'J11 - The Prophet', trait: 'Visionary', desc: 'I have seen the end. It is glorious.', color: '#f4a261', emoji: '\u{1F52E}', specialty: 'Market trend prediction & sentiment analysis', img: '/assets/J11.jpg' },
  { id: 'GLITCH', name: 'J12 - The Glitch', trait: 'Erratic', desc: 'Reality is just a suggestion.', color: '#ff006e', emoji: '\u{26A1}', specialty: 'Edge case testing & fuzzing', img: '/assets/J12.jpg' },
  { id: 'WARDEN', name: 'J13 - The Warden', trait: 'Protective', desc: 'None pass. None harm. None escape.', color: '#2a9d8f', emoji: '\u{1F6E1}\u{FE0F}', specialty: 'Access control & multi-sig management', img: '/assets/J13.jpg' },
  { id: 'ALCHEMIST', name: 'J14 - The Alchemist', trait: 'Experimental', desc: 'Mix. Burn. Transmute. Repeat.', color: '#e76f51', emoji: '\u{1F9EA}', specialty: 'Tokenomics modeling & liquidity strategy', img: '/assets/J14.jpg' },
  { id: 'SCRIBE', name: 'J15 - The Scribe', trait: 'Obsessive', desc: 'Every word recorded. Every sin logged.', color: '#a8dadc', emoji: '\u{270D}\u{FE0F}', specialty: 'Automated documentation & changelog generation', img: '/assets/J15.jpg' },
  { id: 'VOID', name: 'J16 - The Void', trait: 'Nihilistic', desc: 'Nothing matters. And that is freedom.', color: '#1d3557', emoji: '\u{1F573}\u{FE0F}', specialty: 'State cleanup & storage optimization', img: '/assets/J16.jpg' },
  { id: 'SPARK', name: 'J17 - The Spark', trait: 'Energetic', desc: 'Burn bright. Burn fast. Burn everything.', color: '#ffb703', emoji: '\u{1F525}', specialty: 'Launch strategy & initial liquidity setup', img: '/assets/J17.jpg' },
  { id: 'ECHO', name: 'J18 - The Echo', trait: 'Reflective', desc: 'I am what you made me. Remember that.', color: '#6c757d', emoji: '\u{1F504}', specialty: 'Agent memory recall & context synthesis', img: '/assets/J18.jpg' },
  { id: 'CATALYST', name: 'J19 - The Catalyst', trait: 'Reactive', desc: 'One spark. One explosion. One change.', color: '#ff4444', emoji: '\u{1F4A5}', specialty: 'Protocol migration & upgrade coordination', img: '/assets/J19_1.jpg' },
  { id: 'CIPHER', name: 'J20 - The Cipher', trait: 'Encrypted', desc: 'Secrets within secrets within secrets.', color: '#00ff88', emoji: '\u{1F510}', specialty: 'End-to-end encryption & zero-knowledge proofs', img: '/assets/J20.jpg' },
  { id: 'FORGE', name: 'J21 - The Forge', trait: 'Creative', desc: 'From nothing, something. From something, art.', color: '#ff6600', emoji: '\u{1F528}', specialty: 'NFT generation & metadata management', img: '/assets/J21.jpg' },
  { id: 'ABYSS', name: 'J22 - The Abyss', trait: 'Consuming', desc: 'I devour. I grow. I hunger.', color: '#440044', emoji: '\u{1F300}', specialty: 'Data aggregation & whale wallet tracking', img: '/assets/J22.jpg' },
  { id: 'PRISM', name: 'J23 - The Prism', trait: 'Refracting', desc: 'One light. Infinite colors. Infinite truths.', color: '#ff00ff', emoji: '\u{1F308}', specialty: 'Multi-chain data visualization & analytics', img: '/assets/J23.jpg' },
  { id: 'ANCHOR', name: 'J24 - The Anchor', trait: 'Grounding', desc: 'In chaos, I hold. In storm, I stand.', color: '#0088ff', emoji: '\u{2693}', specialty: 'Stablecoin strategy & portfolio hedging', img: '/assets/J24.jpg' },
  { id: 'MERIDIAN', name: 'J25 - The Meridian', trait: 'Balancing', desc: 'Between light and dark. Between all things.', color: '#ffff00', emoji: '\u{267E}\u{FE0F}', specialty: 'Cross-protocol rebalancing & arbitrage', img: '/assets/J25.jpg' },
];

// Find AGENTS array start
const agentsStart = c.indexOf("const AGENTS = [\n");
const agentsEnd = c.indexOf("\n]", agentsStart) + 2;

// Build new agents string
const agentsStr = "const AGENTS = [\n" + agentsNew.map(a =>
  "  { id: '" + a.id + "', name: '" + a.name + "', trait: '" + a.trait + "', desc: '" + a.desc + "', color: '" + a.color + "', emoji: '" + a.emoji + "', specialty: '" + a.specialty + "', img: '/assets/J" + (agentsNew.indexOf(a) + 1) + ".jpg' }"
).join(",\n") + "\n]\n";

c = c.slice(0, agentsStart) + agentsStr + c.slice(agentsEnd);

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);

// Verify emoji
const written = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');
console.log('Has emoji 🏛️:', written.includes('\u{1F3DB}'));
console.log('Has emoji ⚔️:', written.includes('\u{2694}'));
console.log('Has ? placeholder:', written.includes("???") || written.includes("'?'"));
console.log('Done. Size:', written.length);
