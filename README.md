# $RIOT - Punk Agents With Memory 🏴‍☠️

> **25 AI Agents · Persistent Memory on Walrus · Multi-Chain Wallet via Tatum**

<div align="center">

[![Live App](https://img.shields.io/badge/🚀_Live_App-riot--chat--wallet--temp.vercel.app-000?logo=vercel&style=for-the-badge)](https://riot-chat-wallet-temp.vercel.app)
[![Landing Page](https://img.shields.io/badge/🎸_Landing_Page-theriot.vercel.app-ff6b35?style=for-the-badge)](https://theriot.vercel.app)
[![App Repo](https://img.shields.io/badge/📦_App_Repo-GitHub-181717?style=for-the-badge)](https://github.com/cryptoriot666/riot-chat-wallet)
[![Landing Repo](https://img.shields.io/badge/🎨_Landing_Repo-GitHub-181717?style=for-the-badge)](https://github.com/cryptoriot666/the-riot-sui)

[![Tatum](https://img.shields.io/badge/Tatum-100k_Credits_Used-ff69b4?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJjNS41MjMgMCAxMC00LjQ3NyAxMC0xMFMxNy41MjMgMiAxMiAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMHoiLz48cGF0aCBkPSJNMTIgNnY2bDQgMiIvPjwvc3ZnPg==)](https://tatum.io)
[![Walrus](https://img.shields.io/badge/Walrus-Immutable_Blobs-00ff88)](https://www.walrus.xyz)
[![Sui](https://img.shields.io/badge/Sui-Network-4da2ff)](https://sui.io)

</div>

---

## 🎯 Judging Scorecard

| Criteria | Weight | Status | What We Built |
|----------|--------|--------|---------------|
| **Walrus Integration** | **30%** | ✅ Complete | Chat blobs auto-stored on Walrus testnet, blob history panel, per-agent blob links |
| **Tatum Integration** | **30%** | ✅ Complete | RPC balance checking, full 100k credits utilized across test sessions |
| **Technical Quality** | **30%** | ✅ Strong | React+Vite, Python/PostgreSQL backend, dual-path Walrus storage, 25 agents |
| **Creativity** | **20%** | ✅ Unique | 25 punk agent personas, cyberpunk UI, conversational wallet interface |
| **Presentation** | **20%** | ✅ Ready | README, live demo, video walkthrough, DEMO.md script, X/LinkedIn post |
| **Social Bonus** | +Bonus | ⏳ Ready | Template in README — tag @Tatum_io @WalrusFoundation @SuiNetwork |

**[▶️ Open Live Demo](https://riot-chat-wallet-temp.vercel.app)**

---

## What is $RIOT?

$RIOT is a **chat wallet** — a dashboard where you talk to 25 punk AI agents about your crypto portfolio. Every chat is **auto-saved to Walrus** as an immutable blob. Wallet balances, transaction history, and on-chain data are fetched via **Tatum RPC**.

Think of it as a cyberpunk command center: instead of clicking buttons, you **talk to agents** who analyze, advise, and execute.

---

## 🏆 Tatum x Walrus Hackathon Integration

### Walrus Integration (30%)
- ✅ **Auto-save every chat session to Walrus** — encrypted blobs stored on Walrus testnet
- ✅ **Blob history per agent** — view every saved session per agent
- ✅ **All blobs timeline** — chronological view of all stored data
- ✅ **Verifiable** — click "View" to open blob on Walrus aggregator
- ✅ **Blob metadata stored in PostgreSQL** — fast lookup without reading Walrus directly

### Tatum Integration (30%)
- ✅ **Tatum RPC** — real-time SUI wallet balance on dashboard
- ✅ **Blockchain verification panel** — wallet address, balance, transaction history
- ✅ **100k credits fully utilized** — RPC calls for live data across test sessions
- ✅ **Multi-chain ready** — Tatum's unified API architecture

### Technical Quality (30%)
- ✅ React + Vite frontend (fast, modern)
- ✅ Flask Python backend with PostgreSQL
- ✅ Dual-path Walrus storage (mainnet → testnet fallback)
- ✅ Responsive design (mobile sidebar toggle)
- ✅ Error boundaries, defensive code

### Creativity (20%)
- ✅ **25 unique agent personas** — each with custom traits, emoji, color
- ✅ **Cyberpunk aesthetic** — glitch effects, neon palette, custom fonts
- ✅ **Conversational UX** — chat interface replaces traditional dashboard
- ✅ **Agent memory recall** — Echo (J18) can recall past conversations

### Presentation (20%)
- ✅ **Live demo** at [riot-chat-wallet-temp.vercel.app](https://riot-chat-wallet-temp.vercel.app)
- ✅ **Demo script** — see [DEMO.md](./DEMO.md)
- ✅ **Video demo** — walkthrough of full flow
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
│ · Wallet        │     │ · Tatum RPC       │     · Permanent  │
│ · 25 Agents     │     │ · Walrus Proxy    │     └─────────────┘
│ · Memory Panel  │     │ · Memory API      │     ┌─────────────┐
└─────────────────┘     └──────────────────┘     │ Tatum.io    │
                         Backend: Render           · RPC/API    │
                         Database: PostgreSQL      └─────────────┘
                         Blobs: Walrus Testnet
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
| `/api/balance/tatum` | GET | SUI balance via Tatum |

---

## Demo Flow (3 minutes)

1. **Connect wallet** → auto-detects balance
2. **Chat with agents** → talk to J6 (Network), J8 (Broker), etc.
3. **Open MEMORY** → see saved conversations as Walrus blobs
4. **Open BLOCKCHAIN VERIFY** → verify on-chain balance
5. **Click "View" on a blob** → see data on Walrus aggregator

Full script: [DEMO.md](./DEMO.md)

---

## Tech Stack

- **Frontend:** React 18, Vite 5, React Icons
- **Backend:** Python 3, Flask, Flask-CORS
- **Database:** PostgreSQL (via pg8000)
- **Blockchain:** Sui (Chrome extension wallet)
- **Storage:** Walrus (testnet)
- **API:** Tatum.io (RPC)
- **Deploy:** Vercel (frontend), Render (backend)

---

## Credits

Built for **Tatum x Walrus Hackathon** and **Sui Overflow 2026**.

- Tatum RPC for multi-chain data
- Walrus for decentralized blob storage
- Sui ecosystem for wallet infrastructure

---

## Social

Share this project! Tagging earns bonus points:

```text
🚀 Just built $RIOT - a cyberpunk chat wallet with 25 AI agents on #Sui!
Every chat auto-stores to @WalrusFoundation as permanent blobs.
Powered by @Tatum_io for on-chain data.
Built for @SuiNetwork Overflow 2026.

Try it: https://riot-chat-wallet-temp.vercel.app
```

---

*Agents are watching. The network never forgets.* 🏴‍☠️
