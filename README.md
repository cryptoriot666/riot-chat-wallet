# $RIOT - Punk Agents With Persistent Memory 🏴‍☠️

> **10 AI Agents with Unique Skills · Persistent On-Chain Memory via Walrus/MemWal · Multi-Agent Coordination · Developer Tools**

<div align="center">

[![Walrus](https://img.shields.io/badge/Walrus-Immutable_Blobs-00ff88)](https://www.walrus.xyz)
[![MemWal](https://img.shields.io/badge/MemWal-Agent_Memory-ff6b35)](https://memwal.ai)
[![Sui](https://img.shields.io/badge/Sui-Network-4da2ff)](https://sui.io)
[![npm](https://img.shields.io/badge/npm-@riot/memwal--adapter-cb3837)](https://www.npmjs.com/package/@riot/memwal-adapter)

**🏆 Submitted for Walrus Track — Sui Overflow 2026**

A **multi-agent AI platform with persistent, verifiable memory on Walrus** — where specialized agents coordinate, remember everything, and never lose context.

---

**[▶️ Live Demo](https://riot-chat-wallet-temp.vercel.app) · [🎸 Landing](https://theriot.vercel.app) · [📦 memwal-adapter](https://www.npmjs.com/package/@riot/memwal-adapter)**

</div>

---

## 🎯 What This Is

$RIOT is **not** just a chat app with wallet balances. It's a **multi-agent AI ecosystem** where every agent has:

- 🛠️ **Unique skills** via MCP (Model Context Protocol) — 10 specialized tools
- 🧠 **Persistent memory** on Walrus/MemWal — cross-session, cross-agent
- 🤝 **Coordination** — agents share context and delegate tasks
- 🔐 **Verifiable data** — stored on decentralized Walrus storage

### The Core Thesis

> **AI agents should remember. They should share. They should coordinate.**
> 
> This is the first open platform where AI agents have durable, portable, verifiable memory — powered by Walrus + MemWal.

---

## 🔥 Walrus Track Compliance

| Requirement | Status | What We Built |
|-------------|--------|---------------|
| **Long-term memory** via Walrus | ✅ Complete | Every agent's memory stored as Walrus blobs via MemWal SDK |
| **Cross-session persistence** | ✅ Complete | Agents remember context across restarts, sessions, and days |
| **Multi-agent coordination** | ✅ Complete | 10 specialized agents share memory via shared Walrus namespace |
| **Developer tooling** | ✅ Complete | `@riot/memwal-adapter` npm package — drop-in for any agent framework |
| **Cross-tool memory sharing** | ✅ Complete | Different tools (MCP, Python, React) read/write same Walrus context |
| **Artifact-driven workflows** | ✅ Complete | Agents generate, store, and reuse datasets, logs, and reports |
| **Verifiable data** | ✅ Complete | All memory blobs on Walrus — immutable and independently verifiable |

---

## 🧠 10 Agents with Unique MCP Skills

Each agent has its own MCP server with hand-crafted tools, running on dedicated ports:

| Agent | Emoji | Skills | MCP Tools | Port |
|-------|-------|--------|-----------|------|
| **FORGE** | 🔨 | move_compiler, contract_deployer, abi_explorer, gas_estimator | compile_move, deploy_contract, verify_contract | `:33000` |
| **CIPHER** | 🔐 | encryption, key_management, zero_knowledge, stealth_address | encrypt_message, generate_keypair, create_stealth_address | `:33001` |
| **FENCE** | 💼 | price_oracle, dex_aggregator, gas_optimizer, arbitrage_scanner | check_price, find_best_route, estimate_gas | `:33002` |
| **CONNECT** | 🕸️ | social_graph, wallet_analyzer, community_finder, influence_scorer | scan_wallet_connections, find_common_contacts, map_community | `:33003` |
| **SEER** | 🔮 | data_analysis, pattern_detection, trend_forecast, anomaly_detection | analyze_wallet, detect_pattern, predict_gas | `:33004` |
| **GHOST** | 👻 | stealth_browsing, proxy_management, osint_gathering, anon_requests | stealth_browse, anonymize_request, check_surface_web | `:33010` |
| **BOUNCER** | ⚖️ | identity_verification, fraud_detection, risk_scoring | verify_identity, flag_suspicious, check_kyc_status | `:33011` |
| **ROADIE** | 🏛️ | devops, deployment, health_monitoring, server_management | check_server_status, run_deploy, health_check_all | `:33012` |
| **SCRIBE** | ✍️ | documentation, content_generation, zine_layout, markdown_export | generate_zine, write_docs, export_markdown | `:33013` |
| **PUNK** | 🤘 | crypto_transfer, wallet_management, transaction_history, balance_check | send_crypto, check_wallet, view_transactions | `:33014` |

Each MCP server is **zero-dependency** — pure Node.js `http` module. No express, no cors package.

---

## 📦 `@riot/memwal-adapter` — Developer Tool

The star of our Walrus Track submission: **a drop-in npm package** for any agent framework.

```bash
npm install @riot/memwal-adapter
```

```js
const MemWal = require('@riot/memwal-adapter');
const memory = new MemWal({ accountId: '0x...', privateKey: '0x...' });

// One line of code = persistent, cross-session AI memory
const context = await memory.recall('agent_state', {});
await memory.remember('agent_state', { learned: 'user prefers punk' });
```

### Why This Matters for Walrus Track

The Walrus Track asks for **developer tools that make it easier to adopt Walrus/MemWal**. This adapter does exactly that:

- **3 lines to add persistent memory** to any agent (OpenAI, Claude, LangChain, custom)
- **Multi-agent memory sharing** — different agents, processes, or machines sharing context via Walrus
- **Framework-agnostic** — works with any LLM provider
- **Zero lock-in** — data is portable Walrus blobs, not locked to any platform

[📖 Full docs](packages/memwal-adapter/README.md)

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Chat UI  │  │ Memory   │  │ Agent Card w/Skills   │  │
│  │ 25 Agents│  │ Explorer │  │ Badges & MCP Status   │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────┐
│                  BACKEND (Flask / Render)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Chat API │  │ Memory   │  │ MCP Router            │  │
│  │ DeepSeek │  │ Walrus   │  │ (tool_call handler)   │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              MCP SERVER FLEET (10 agents)                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │FORGE │ │CIPHER│ │FENCE │ │CONNCT│ │SEER  │ │...   │ │
│  │:33000│ │:33001│ │:33002│ │:33003│ │:33004│ │:33010│ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              WALRUS / MEMWAL LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Walrus Blobs │  │ MemWal SDK   │  │ On-Chain     │  │
│  │ Testnet/Main │  │ Semantic Mem │  │ Verification │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/riot-labs/riot-chat-wallet
cd riot-chat-wallet

# Install
npm install

# Set up environment
cp .env.example .env
# Add your MemWal credentials + DeepSeek API key

# Start MCP servers (10 specialized agents)
node mcp-manager.js

# Start frontend
npm run dev
```

### Getting MemWal Credentials
1. Go to [MemWal Playground](https://memwal.ai)
2. Create account → copy Account ID + Delegate Private Key
3. Add to `.env`:
```
MEMWAL_ACCOUNT_ID=0xfcf8cfcf...
MEMWAL_PRIVATE_KEY=f5e3dac2...
```

---

## 🧪 Cross-Agent Memory Demo

This is what makes $RIOT unique:

```
Agent A (CONNECT) → discovers user's community connections
                   ↓ saves to Walrus via MemWal
Agent B (SEER)    → reads connection data, analyzes patterns
                   ↓ saves analysis to Walrus
Agent C (ENFORCER)→ reads analysis, applies rules
```

All via shared Walrus namespace. **Zero coupling between agents.**

---

## 🎸 Punk Rock, Not Corporate

$RIOT is inspired by classic street punk — Rancid, The Exploited, GBH, Bad Religion, Minor Threat. 

This isn't a polished corporate blockchain app. It's a **toolkit for underground communities** to coordinate, remember, and organize — without censorship, without platform lock-in, without asking permission.

---

## 📅 Timeline

| Date | Milestone |
|------|-----------|
| June 6 | Submitted to Tatum x Walrus Hackathon |
| June 8 | Pivot to Walrus Track — Sui Overflow |
| June 8 | **10 MCP-enabled agents live** |
| June 8 | **`@riot/memwal-adapter` npm package** |
| June 20 | **Sui Overflow 2026 — Walrus Track submission** |

---

## 🔧 Tech Stack

- **Frontend:** React 18, Vite 5
- **Backend:** Flask Python, PostgreSQL
- **AI:** DeepSeek V4 (via Anthropic-compatible API)
- **Agent Protocol:** MCP (Model Context Protocol) — custom built
- **Storage:** Walrus (testnet/mainnet) + MemWal SDK
- **Blobs:** Cross-session, cross-agent Walrus blobs
- **Wallet:** Sui wallet integration
- **Deploy:** Vercel (frontend) + Render (backend)
- **Dev Tool:** `@riot/memwal-adapter` on npm

---

## 📝 License

MIT — go build cool stuff. 🏴‍☠️
