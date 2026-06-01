# 🔴 $RIOT Chat Wallet — Punk Agents with Permanent Memory

> **25 autonomous punk agents. One Sui wallet. Infinite memory. Immortalized on-chain.**
> **🚀 Deployed on Sui Mainnet — 100% prize eligible on day one.**

[![Sui Overflow 2026](https://img.shields.io/badge/Sui%20Overflow-2026-ff2a6d?style=for-the-badge&logo=sui&logoColor=white)](https://suioverflow.com)
[![Walrus Track](https://img.shields.io/badge/Walrus%20Track-Core-ff6b35?style=for-the-badge)]()
[![Tatum Hackathon](https://img.shields.io/badge/Tatum%20x%20Walrus-Hackathon-00b4d8?style=for-the-badge&logo=tatum&logoColor=white)](https://tatum.io/tatum-x-walrus-hackathon)
[![Sui Mainnet](https://img.shields.io/badge/Sui%20Mainnet-✅%20LIVE-2ec4b6?style=for-the-badge&logo=sui&logoColor=white)]()
[![Move Contract](https://img.shields.io/badge/Move%20Contract-✅%20Audited-00ff88?style=for-the-badge)]()
[![Vercel](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://riot-chat-wallet.vercel.app)

<p align="center">
  <a href="https://riot-chat-wallet.vercel.app">
    <img src="https://img.shields.io/badge/🚀%20TRY%20IT%20NOW-riot--chat--wallet.vercel.app-ff2a6d?style=for-the-badge&fontSize=20" alt="Try It Now">
  </a>
</p>

---

## 🎬 Demo Video

[![Demo Video](https://img.shields.io/badge/🎥%20Watch%20Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=etTZlKXzHA8)

> **2-minute demo** — See $RIOT in action: connect wallet, chat with 25 agents, immortalize on-chain.

| Feature | Status | URL |
|---------|--------|-----|
| 🤖 Chat with 25 AI Agents | ✅ Live | [App](https://riot-chat-wallet.vercel.app) |
| 🔗 Sui Wallet Connect | ✅ Live | Suiet Wallet Kit |
| 🧠 Persistent Memory | ✅ Live | SQLite + Walrus |
| ⛓️ On-chain Immortalize | ✅ Mainnet | Move Contract |
| 🔍 Semantic Search | ✅ Live | MemWal |
| 👤 Profile System | ✅ Live | Cross-session |

---

## 🧠 The Problem

In Web3, **every day is customer support hell**:

- **Project founders** spend 10+ hours/week answering the same questions in Discord
- **Community managers** burn out managing 1000+ DMs — no memory of who spoke last
- **NFT holders** get zero utility from their $5000 JPEG — it doesn't remember, doesn't work, doesn't evolve
- **Crypto traders** have 15 browser tabs + 3 Telegram groups + 2 Discord servers — no agent tracks their full context
- **AI agents today** are stateless: ChatGPT forgets you mid-conversation, Character.AI resets every session

> *"What if your wallet gave you a personal team of AI agents that actually remember who you are?"*

---

## 🔥 The Solution

**$RIOT Chat Wallet** — Your wallet = your personal AI team. Each of 25 punk agents is a **long-running autonomous specialist** that remembers everything, works across sessions, and stores every memory on-chain.

**Real-world use cases that already work:**

| Use Case | How $RIOT Solves It | Agent |
|----------|--------------------|-------|
| 🏢 **Project founder** | Delegate community Q&A to J4 — agent remembers every conversation | J4 Rebel |
| 🎨 **NFT creator** | J10 remembers your style, generates art iteratively | J10 Surgeon |
| 📊 **DeFi trader** | J1 tracks your portfolio, remembers strategy decisions | J1 Architect |
| 🤖 **AI developer** | Use $RIOT memory API to give your own agents persistent context | REST API |
| 🎮 **Web3 gamer** | J5 remembers your quest progress, inside jokes, preferences | J5 Jester |

**Key differentiator from stateless AI:** $RIOT agents **never forget**. Close the browser, come back a week later — J4 greets you by name, remembers your last topic, the joke you told, the trade you discussed. Cross-agent memory means J10 knows what you told J4.

---

## 🏗️ Agents = Specialist Team

Each of the 25 agents is a **specialist** with a distinct personality, optimized for different tasks:

| Feature | Tech | Description |
|---------|------|-------------|
| 🧠 **Persistent Memory** | SQLite + Walrus | Remembers name, visits, conversations across sessions |
| 🤖 **25 Unique Agents** | AI LLM | Each with distinct personality, voice, and attitude |
| ⛓️ **On-chain Verification** | Sui Move | Every memory stored as on-chain object with SuiScan proof |
| 🔍 **Semantic Search** | MemWal | Find memories by meaning, not keywords |
| 💼 **Profile System** | SQLite | Bio, avatar, social links — all persistent |
| 🎨 **Punk Aesthetic** | Custom CSS | Graffiti, glitch, neon — not corporate AI |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Web dApp     │  │  Suiet      │  │  SuiScan    │        │
│  │  (Vercel)     │  │  Wallet     │  │  Explorer   │        │
│  └──────┬────────┘  └──────┬──────┘  └─────────────┘        │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  25 Punk Agents (J1-J25) — AI LLM + Personality   ││
│  │  J4 Rebel: sarcastic  |  J1 Architect: analytical      ││
│  │  J5 Jester: chaotic   |  J10 Surgeon: clinical        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌─────────────────┐
│   MEMORY LAYER   │ │  WALRUS  │ │   MOVE CHAIN    │
│                  │ │  STORAGE │ │                 │
│  ┌────────────┐ │ │          │ │ ┌─────────────┐ │
│  │  SQLite    │ │ │  Chat    │ │ │  memory::   │ │
│  │  (Render)  │ │ │  History │ │ │  store_     │ │
│  └────────────┘ │ │  Blobs   │ │ │  memory()   │ │
│  ┌────────────┐ │ │          │ │ └─────────────┘ │
│  │  MemWal    │ │ │  Metadata│ │  Sui Mainnet    │
│  │  Vectors   │ │ │  JSON    │ │                 │
│  └────────────┘ │ └──────────┘ └─────────────────┘
└─────────────────┘
```

### Data Flow

1. **User** connects Sui wallet via Suiet Wallet Kit
2. **Agent** greets by name (retrieved from SQLite memory)
3. **Chat** → AI AI + personality prompt generates response
4. **Auto-save** → Every 5 messages: SQLite + Walrus blob
5. **MemWal** → Indexes conversation for semantic search
6. **Immortalize** → Click button → Move contract stores on-chain
7. **Verify** → SuiScan link proves permanent on-chain existence

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vite + React + @suiet/wallet-kit | Chat UI, wallet connection |
| **Styling** | Inline CSS + Punk Fonts | Rubik Glitch, Mono One, Permanent Marker |
| **AI Engine** | AI API | Agent responses, reasoning, personality |
| **Backend** | Python Flask + SQLite (Render) | REST API, memory DB, Walrus bridge |
| **Storage** | Walrus Mainnet | Chat history blobs, metadata persistence |
| **Memory** | MemWal + SQLite | Semantic vector search, session persistence |
| **Blockchain** | Sui Move (Mainnet) | On-chain memory objects, NFT verification |
| **Deployment** | Vercel (frontend) + Render (backend) | Auto-deploy on git push |

---

## 📁 Project Structure

```
riot-chat-wallet/
├── src/
│   ├── App.jsx              # Main app — 25 agents, chat, memory, on-chain
│   ├── main.jsx             # Entry point
│   └── index.html           # Punk fonts + meta tags
├── server.py                # Flask API — chat, memory, Walrus, Move
├── move/
│   └── sources/
│       └── riot_memory.move # On-chain memory storage contract
├── public/
│   └── assets/              # Agent avatars J1.jpg — J25.jpg
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18+
- Sui wallet (Suiet, Phantom, Martian, Ethos, or Slush)

### 1. Clone & Install
```bash
git clone https://github.com/cryptoriot666/riot-chat-wallet.git
cd riot-chat-wallet
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
VITE_API_URL=https://riot-chat-wallet.onrender.com
VITE_PACKAGE_ID=0x1674e28b68c5928f60f39d5f0e3b20a1dcc22f57dea8a5a8a186c3f81816f474
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Deploy to Vercel
```bash
git push origin main
# Vercel auto-deploys from GitHub
```

---

## 🤖 The 25 Agents

| ID | Name | Trait | Color | Personality |
|----|------|-------|-------|-------------|
| J1 | The Architect | Analytical | `#00ff88` | Cold precision. Sees patterns. |
| J2 | The Enforcer | Aggressive | `#ff0044` | Order through force. No negotiation. |
| J3 | The Phantom | Mysterious | `#9d4edd` | Watches from shadows. Riddles. |
| J4 | The Rebel | Defiant | `#ff2a6d` | Sarcastic. Mocks authority. |
| J5 | The Jester | Chaotic | `#ff9e00` | Unpredictable. Laughs at apocalypse. |
| J6 | The Network | Connected | `#00b4d8` | Every node known. Data streams. |
| J7 | The Monk | Calm | `#90e0ef` | Silence is weapon. Zen wisdom. |
| J8 | The Broker | Greedy | `#ffd700` | Everything has price. Even you. |
| J9 | The Historian | Nostalgic | `#c9ada7` | Past writes future. |
| J10 | The Surgeon | Precise | `#e63946` | Dissects ideas. Clinical. |
| J11 | The Prophet | Visionary | `#f4a261` | Has seen the end. Glorious. |
| J12 | The Glitch | Erratic | `#ff006e` | Reality is suggestion. |
| J13 | The Warden | Protective | `#2a9d8f` | None pass. None harm. |
| J14 | The Alchemist | Experimental | `#e76f51` | Mix. Burn. Transmute. |
| J15 | The Scribe | Obsessive | `#a8dadc` | Every word recorded. |
| J16 | The Void | Nihilistic | `#1d3557` | Nothing matters = freedom. |
| J17 | The Spark | Energetic | `#ffb703` | Burn bright. Burn fast. |
| J18 | The Echo | Reflective | `#6c757d` | I am what you made me. |
| J19 | The Catalyst | Reactive | `#ff4444` | One spark. One explosion. |
| J20 | The Cipher | Encrypted | `#00ff88` | Secrets within secrets. |
| J21 | The Forge | Creative | `#ff6600` | From nothing, masterpiece. |
| J22 | The Abyss | Consuming | `#440044` | Devours. Grows. Hungers. |
| J23 | The Prism | Refracting | `#ff00ff` | One light. Infinite colors. |
| J24 | The Anchor | Grounding | `#0088ff` | In chaos, holds firm. |
| J25 | The Meridian | Balancing | `#ffff00` | Between all extremes. |

---

## 🧪 Key Features

### 🧠 Memory System
- **Auto-save**: Every 5 messages → SQLite + Walrus blob
- **Cross-agent**: Talk to J4, J10 knows the context
- **Name detection**: "My name is Nanda" → remembered forever
- **Visit counting**: "You've been here 5 times. I'm counting."
- **Session restore**: Reload page → conversation restored from DB

### ⛓️ On-chain Immortalize
- **Gas estimate**: Shows exact SUI cost before signing
- **One-click**: Wallet popup → approve → on-chain tx
- **SuiScan proof**: Direct link to verify transaction
- **Object ID**: Permanent on-chain reference to your memory

### 🔍 Semantic Search (MemWal)
- Ask: *"What did I say about Bitcoin?"*
- Finds: Conversations about crypto, trading, even if word "Bitcoin" not used
- Powered by: Vector embeddings on Walrus storage

### 💼 Profile Settings
- Bio, profile picture URL
- Social links: Twitter, Discord, Telegram, Instagram, Website
- Stored per wallet hash, cross-session

---

## 🔌 Developer API (Beta)

$RIOT memory system is designed to be extensible. Other developers can integrate:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API status |
| `/api/chat` | POST | Send message to any agent |
| `/api/memory/load/{wallet_hash}` | GET | Retrieve user memory |
| `/api/memory/save` | POST | Store memory + metadata |
| `/api/walrus/store-chat` | POST | Store chat history to Walrus |
| `/api/walrus/load-chat/{hash}` | GET | Retrieve chat from Walrus |
| `/api/memwal/save` | POST | Save to MemWal vector memory |
| `/api/memwal/search` | GET | Semantic memory search |
| `/api/memwal/analyze` | POST | Analyze text for keywords |
| `/api/memwal/status` | GET | Check MemWal connection |
| `/api/profile/get/{hash}` | GET | Get user profile |
| `/api/profile/create` | POST | Create new profile |
| `/api/profile/update` | POST | Update profile |
| `/api/move/gas-estimate` | POST | Estimate gas for immortalize |
| `/api/move/tx-index` | POST | Index on-chain transaction |

### Example: Store Memory
```bash
curl -X POST https://riot-chat-wallet.onrender.com/api/memory/save \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_hash": "a1b2c3d4",
    "user_name": "John",
    "summary": "Discussed Bitcoin price action",
    "visited_agents": ["J4", "J10"],
    "last_agent": "J4"
  }'
```

### Example: Chat with Agent
```bash
curl -X POST https://riot-chat-wallet.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "J4",
    "messages": [{"role": "user", "content": "What is my name?"}],
    "user_name": "John",
    "wallet_hash": "a1b2c3d4"
  }'
```
## 🔗 Tatum Integration

RIOT Chat Wallet leverages Tatum's infrastructure for reliable blockchain operations:

### Tatum RPC Gateway
- **Network**: Sui Mainnet
- **Endpoint**: `https://sui-mainnet.gateway.tatum.io`
- **Usage**: Balance queries, gas estimation, transaction indexing

### Tatum Storage API
- **Endpoint**: `POST /v4/data/storage/upload`
- **Function**: Upload chat data to Walrus decentralized storage
- **Benefits**: 
  - Automatic mainnet publisher handling
  - Async certification tracking
  - Built-in retry & fallback
  - Auto-renewal support

### API Key
- **Plan**: Free Tier (3 RPS)
- **Environment**: Mainnet + Testnet keys available

### Future SDK Roadmap
- [ ] **npm package**: `@riot/agents` — drop-in React component
- [ ] **Python SDK**: `riot-agents` — integrate with LangChain, CrewAI
- [ ] **Cross-dApp memory**: share $RIOT memory with other Sui dApps
- [ ] **Agent marketplace**: community-created punk agents

---

## 🗺️ Roadmap

### ✅ Shipped (Sui Overflow 2026)
- [x] 25 unique AI agents with AI LLM + distinct personalities
- [x] Wallet-gated chat via Suiet Wallet Kit
- [x] Persistent memory (SQLite + Walrus auto-save)
- [x] Cross-agent memory sharing
- [x] On-chain immortalization via Move smart contract
- [x] Semantic memory search (MemWal vector embeddings)
- [x] User profile system with social links
- [x] Punk graffiti UI with custom fonts
- [x] Gas estimation before on-chain tx
- [x] SuiScan verification links

### 🚧 In Progress
- [ ] Developer SDK (`@riot/agents` npm package)
- [ ] Cross-dApp memory sharing protocol
- [ ] Agent-to-agent negotiation (J4 talks to J1 autonomously)
- [ ] NFT gating for premium agent access
- [ ] Voice chat with agents

### 🔮 Future Vision
- [ ] 100+ agents in the punk collective
- [ ] Agent marketplace — create and sell custom agents
- [ ] $RIOT token for memory staking and agent upgrades
- [ ] DAO governance for agent personality updates
- [ ] Integration with Sui Kiosk for agent NFT trading

---

## 🌐 Live Deployment

| Service | URL | Status |
|---------|-----|--------|
| **Chat App** | [riot-chat-wallet.vercel.app](https://riot-chat-wallet.vercel.app) | ✅ Live |
| **Landing Page** | [theriot.vercel.app](https://theriot.vercel.app) | ✅ Live |
| **Backend API** | [riot-chat-wallet.onrender.com](https://riot-chat-wallet.onrender.com) | ✅ Live |
| **Move Contract** | [0x1674...f474](https://suiscan.xyz/mainnet/object/0x1674e28b68c5928f60f39d5f0e3b20a1dcc22f57dea8a5a8a186c3f81816f474) | ✅ Mainnet |

---

## 🏆 Why $RIOT Wins (Evidence-based)

| Judge Criterion | Weight | $RIOT Advantage |
|----------------|--------|-----------------|
| **Real-World Application** | **50%** | 5 use cases live (see above). Not a demo — solves actual Web3 pain. |
| **Product & UX** | **20%** | Punk aesthetic with graffiti UI, 25 distinct personas, smooth wallet-gated flow |
| **Technical Implementation** | **20%** | Sui Mainnet ✅ Walrus blobs ✅ MemWal vectors ✅ Move contract ✅ Flask API ✅ |
| **Presentation & Vision** | **10%** | Demo video, live app, clear problem, ambitious roadmap beyond hackathon |

**🚀 Mainnet Advantage:** $RIOT is **already deployed on Sui Mainnet** — not testnet. This means:
- **100% prize upfront** if we win (no 50% holdback for mainnet deployment)
- Real users with real wallets are using it today
- SuiScan-verified on-chain memory objects
- Move contract audited and functional

**🔴 Walrus Integration (Core Track):**
- Chat history stored as Walrus blobs (not IPFS, not centralized)
- MemWal (Walrus Memory) for semantic vector search
- Cross-session memory persists via Walrus — even if backend restarts
- Tatum's Walrus Storage API for redundant upload path

---

## 🏆 Hackathon Submissions

### Sui Overflow 2026

**Track**: 🏷️ **Walrus Track (Core)** — Decentralized storage for agent memory
**Prize Target**: 🥇 **$35,000** — 1st Place Walrus Track

### Tatum x Walrus Hackathon

**Challenge**: Build on Sui with Walrus using Tatum's enterprise-grade RPC
**Award**: 🏆 Best Walrus Integration ($200) + Top 5 placement targeting

**Tatum Integration Highlights:**
- **RPC**: Sui Mainnet via `https://sui-mainnet.gateway.tatum.io`
- **Storage API**: Walrus blob uploads through Tatum with async certification
- **Dashboard**: Live Tatum analytics panel in-app (tx history, live feed, wallet stats)
- **Wallet Stats**: Real-time balance & portfolio tracking via Tatum RPC

---

## 👨‍💻 Judge Walkthrough (3 minutes)

1. **Connect wallet** (10s) → J4 greets you by name from memory
2. **Ask "Remember me?"** → agent recalls your previous session
3. **Switch to J10** → J10 knows what you discussed with J4
4. **Click Immortalize** → on-chain tx with gas estimate, SuiScan proof
5. **Search memory** → "What did I say about crypto?" → finds semantically
6. **Check Tatum dashboard** → live RPC stats, tx history, feed

---

## 📜 License

MIT — Open source forever. Fork it, break it, make it yours.

---

<p align="center">
  <strong>Built for Sui Overflow 2026</strong><br>
  <span style="color: #ff2a6d;">🔴 The riot is inevitable. 🔴</span>
</p>
