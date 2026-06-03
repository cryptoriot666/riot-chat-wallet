# $RIOT Chat Wallet - Demo Script

## Judging Demo Flow (3-5 minutes)

### Step 1: Connect Wallet (30 seconds)
1. Open [riot-chat-wallet-temp.vercel.app](https://riot-chat-wallet-temp.vercel.app)
2. Click **CONNECT WALLET** → select Sui wallet (Sui Wallet / Martian / OKX)
3. Accept connection
4. ✅ Wallet address appears in the left sidebar, balance auto-detected

### Step 2: Chat with an Agent (1 minute)
1. From the left sidebar, click agent **🌐 J6 - The Network**
2. Type: `"check current SUI price and recent cross-chain activity"`
3. Agent responds with real-time blockchain data
4. Send 2-3 more messages to build memory context
5. Switch agent to **💼 J8 - The Broker**
6. Type: `"what's the best DeFi yield strategy right now?"`

### Step 3: Show Tatum Integration (30 seconds)
1. Click **BLOCKCHAIN VERIFY** in the bottom panel
2. SUI wallet balance displayed via Tatum RPC
3. (If TX history exists) View wallet transactions
4. > Tatum API key has used 100k/100k credits — full, real integration

### Step 4: Walrus Memory Archive (1 minute)
1. Click **SHOW MEMORY** in the bottom panel
2. **User Profile** — see wallet name, session count, latest blob ID
3. **Visited Agents** — see Network (J6) and Broker (J8) highlighted
4. Click agent Network → view all blobs stored on Walrus for this agent
5. Click **View ↗** on a blob ID → opens Walrus testnet aggregator, proving data is stored on-chain
6. Click **< BACK TO AGENTS**
7. Scroll to **ALL BLOBS** — chronological view of all stored blobs across all agents

### Step 5: Search Memory (30 seconds)
1. (If search bar is present) Type an agent name in the search field
2. Results filter to show only matching agent blobs

### Step 6: Walrus On-Chain Verification (30 seconds)
1. Open [Walrus Testnet Aggregator](https://aggregator.walrus-testnet.walrus.space)
2. Paste a blob_id from MEMORY ARCHIVE
3. ✅ View encrypted chat data stored on Walrus — decentralized, permanent

---

## Key Talking Points for Judges

### "Why Walrus?"
- Every chat conversation is **auto-saved to Walrus** as a blob
- Blobs are publicly verifiable via the aggregator
- Data never lost — Walrus guarantees availability
- **Blob history** — all agent interactions recorded on-chain

### "Why Tatum?"
- **Tatum RPC** — real-time wallet balance across multiple chains
- **100k credits fully consumed** — deep integration (RPC + calling patterns)
- Single API for all chains — developer efficiency

### "Why $RIOT?"
- **25 AI agents** with unique personalities — not just another chatbot
- **Per-wallet memory** — each user has their own context
- **Cyberpunk aesthetic** — memorable UI/UX
- **Modular** — agents can be added, swapped, customized

---

## Live Demo Links
- **Landing Page:** https://github.com/cryptoriot666/riot-chat-wallet/blob/master/landing.html
- **App:** https://riot-chat-wallet-temp.vercel.app
- **Backend API:** https://riot-chat-wallet.onrender.com
- **GitHub:** https://github.com/cryptoriot666/riot-chat-wallet
- **Walrus Explorer:** https://aggregator.walrus-testnet.walrus.space

---

## If Judges Want to Try It Themselves
1. Install Sui Wallet extension
2. Switch to Testnet
3. Get test SUI from faucet
4. Open the app, connect wallet, start chatting
5. After 5+ messages, open MEMORY → see stored blobs
