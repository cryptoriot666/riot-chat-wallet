# $RIOT — Punk Agents With Memory 🏴‍☠️

> **25 AI Agents · Persistent Memory on Walrus · Multi-Chain Wallet**

<div align="center">

[![Live App](https://img.shields.io/badge/🚀_Live_App-riot--chat-app-new.vercel.app-000?logo=vercel&style=for-the-badge)](https://riot-chat-app-new.vercel.app)
[![Landing Page](https://img.shields.io/badge/🎸_Landing_Page-theriot.vercel.app-ff6b35?style=for-the-badge)](https://theriot.vercel.app)
[![App Repo](https://img.shields.io/badge/📦_App_Repo-GitHub-181717?style=for-the-badge)](https://github.com/cryptoriot666/riot-chat-wallet)
[![Landing Repo](https://img.shields.io/badge/🎨_Landing_Repo-GitHub-181717?style=for-the-badge)](https://github.com/cryptoriot666/the-riot-sui)

[![Walrus](https://img.shields.io/badge/Walrus-Immutable_Blobs-00ff88)](https://www.walrus.xyz)
[![Sui](https://img.shields.io/badge/Sui-Network-4da2ff)](https://sui.io)

</div>

---

## 🎯 Sui Overflow 2026 Submission

| Criteria | Status | What We Built |
|----------|--------|---------------|
| **Walrus Integration** | ✅ Complete | Chat blobs auto-stored on Walrus mainnet, blob history panel, per-agent blob links |
| **Technical Quality** | ✅ Strong | React+Vite, Python/PostgreSQL backend, dual-path Walrus storage, 25 agents |
| **Creativity** | ✅ Unique | 25 punk agent personas, cyberpunk UI, conversational wallet interface |
| **Presentation** | ✅ Ready | README, live demo, video walkthrough, DEMO.md script |

**[▶️ Open Live Demo](https://riot-chat-app-new.vercel.app)**

---

## What is $RIOT?

$RIOT is a **chat wallet** — a dashboard where you talk to 25 punk AI agents about your crypto portfolio. Every chat is **auto-saved to Walrus** as an immutable blob.

Think of it as a cyberpunk command center: instead of clicking buttons, you **talk to agents** who analyze, advise, and execute.

---

## 🏆 Sui Overflow 2026 Integration

### Walrus Integration
- ✅ **Auto-save every chat session to Walrus** — encrypted blobs stored on Walrus mainnet
- ✅ **Blob history per agent** — view every saved session per agent
- ✅ **All blobs timeline** — chronological view of all stored data
- ✅ **Verifiable** — click "View" to open blob on Walrus aggregator
- ✅ **Blob metadata stored** — fast lookup without reading Walrus directly
- ✅ **Dual-path storage** — mainnet with testnet fallback

### Technical Quality
- ✅ React + Vite frontend (fast, modern)
- ✅ Python backend with PostgreSQL / SQLite
- ✅ Walrus mainnet storage
- ✅ Responsive design (mobile sidebar toggle)
- ✅ Error boundaries, defensive code

### Creativity
- ✅ **25 unique agent personas** — each with custom traits, emoji, color
- ✅ **Cyberpunk aesthetic** — glitch effects, neon palette, custom fonts
- ✅ **Conversational UX** — chat interface replaces traditional dashboard
- ✅ **Agent memory recall** — Echo (J18) can recall past conversations

### Presentation
- ✅ **Live demo** at [riot-chat-app-new.vercel.app](https://riot-chat-app-new.vercel.app)
- ✅ **Demo script** — see [DEMO.md](./DEMO.md)
- ✅ **Video walkthrough** — full flow demonstration
- ✅ **Documentation** — this README + DEMO.md

---

## Quick Start

### Prerequisites
- Sui wallet (Sui Wallet / Martian / OKX)
- Browser with wallet extension
- Test SUI from faucet (for testnet)

### Run Locally
```bash
git clone https://github.com/cryptoriot666/riot-chat-wallet.git
cd riot-chat-wallet
npm install
cp .env.example .env  # fill in your API keys
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

---

## Architecture

```
Frontend (Vercel)          Backend (Render)          External
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ React + Vite    │────▶│ Flask + Python    │────▶│ Walrus      │
│ · Chat UI       │     │ · PostgreSQL      │     · Encrypted  │
│ · Wallet        │     │ · SQLite fallback │     · Permanent  │
│ · 25 Agents     │     │ · Walrus Proxy    │     └─────────────┘
│ · Memory Panel  │     │ · Memory API      │
└─────────────────┘     └──────────────────┘
                         Deploy: Render.com
                         Storage: Walrus Mainnet
```

### Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/chat` | POST | Chat with an agent |
| `/api/memory/save` | POST | Save chat to Walrus + DB |
| `/api/memory/load/<hash>` | GET | Load user memory |
| `/api/memory/search/<hash>?q=` | GET | Search memory by agent |
| `/api/walrus/store-direct` | POST | Direct Walrus blob store |
| `/api/walrus/load/<hash>` | GET | Load Walrus blob |

---

## Demo Flow (3 minutes)

1. **Connect wallet** → auto-detects address
2. **Chat with agents** — talk to J6 (Network), J8 (Broker), etc.
3. **Open MEMORY** — see saved conversations as Walrus blobs
4. **Open BLOCKCHAIN VERIFY** — verify on-chain data
5. **Click "View" on a blob** — see data on Walrus aggregator

Full script: [DEMO.md](./DEMO.md)

---

## Tech Stack

- **Frontend:** React 18, Vite 5
- **Backend:** Python 3, Flask
- **Storage:** Walrus (mainnet)
- **Blockchain:** Sui (Chrome extension wallet)
- **Deploy:** Vercel (frontend), Render (backend)

---

## Team

Built for **Sui Overflow 2026**.

---

## Social

Share this project!

```text
🚀 $RIOT — cyberpunk chat wallet with 25 AI agents on #Sui!
Every chat auto-stores to @WalrusFoundation as permanent blobs.
Built for @SuiNetwork Overflow 2026.

Try it: https://riot-chat-app-new.vercel.app
```

---

*Agents are watching. The network never forgets.* 🏴‍☠️
