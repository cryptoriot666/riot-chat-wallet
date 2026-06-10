# @riot/memwal-adapter

> Drop-in npm package for persistent AI agent memory via Walrus + MemWal

**Status:** Walrus Track Submission — Sui Overflow 2026

---

## Installation

\`\`\`bash
npm install @riot/memwal-adapter
\`\`\`

## Quick Start

\`\`\`javascript
const MemWal = require('@riot/memwal-adapter');

const memory = new MemWal({
  accountId: '0xYourAccountId',
  privateKey: '0xYourPrivateKey',
  network: 'testnet'  // or 'mainnet'
});

// Store memory
await memory.remember('agent_state', {
  skills: ['compile', 'deploy'],
  preferences: { gasLimit: 3000 }
});

// Retrieve memory
const context = await memory.recall('agent_state', {
  default: { skills: [], preferences: {} }
});

// Share memory across agents
await memory.share('shared_knowledge', { learned: 'users prefer punk' }, ['agent_b', 'agent_c']);
\`\`\`

## API Reference

### Constructor

\`\`\`javascript
new MemWal(config)
\`\`\`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`accountId\` | string | Yes | MemWal account ID |
| \`privateKey\` | string | Yes | Delegate private key |
| \`network\` | string | No | \`'testnet'\` (default) or \`'mainnet'\` |
| \`namespace\` | string | No | Custom namespace prefix |

### Methods

#### \`remember(key, value, ttl?)\`
Store a value in Walrus.

#### \`recall(key, options?)\`
Retrieve a value from Walrus.

#### \`forget(key)\`
Delete a key from memory.

#### \`share(key, value, targets)\`
Share memory with specific agents.

#### \`broadcast(key, value)\`
Broadcast to all agents in namespace.

#### \`query(pattern)\`
Query keys matching a pattern.

#### \`sync()\`
Force sync with Walrus.

## Multi-Agent Pattern

\`\`\`javascript
// Agent A
const memoryA = new MemWal({ accountId: '0xA', privateKey: 'keyA' });
await memoryA.remember('analysis', { sentiment: 'bullish' });

// Agent B (different process, same namespace)
const memoryB = new MemWal({ accountId: '0xB', privateKey: 'keyB' });
const analysis = await memoryB.recall('analysis');
// → { sentiment: 'bullish' }
\`\`\`

## Framework Integration

### LangChain

\`\`\`javascript
import { MemWalMemory } from '@riot/memwal-adapter/memory';

const memory = new MemWalMemory({
  accountId: process.env.MEMWAL_ACCOUNT_ID,
  privateKey: process.env.MEMWAL_PRIVATE_KEY
});

const agent = new Agent({
  llm,
  memory,
  tools: [...]
});
\`\`\`

### OpenAI Assistants

\`\`\`javascript
const memWal = new MemWal({ accountId, privateKey });

// Before conversation
const context = await memWal.recall('session_123', { default: {} });
messages.push({ role: 'system', content: formatContext(context) });

// After conversation
await memWal.remember('session_123', extractMemory(messages));
\`\`\`

## Error Handling

\`\`\`javascript
try {
  await memory.remember('key', value);
} catch (err) {
  if (err.code === 'WALRUS_NOT_FOUND') {
    // Blob doesn't exist yet - first write
  } else if (err.code === 'AUTH_FAILED') {
    // Invalid credentials
  }
}
\`\`\`

## Environment Variables

\`\`\`bash
MEMWAL_ACCOUNT_ID=0xfcf8cfcf...
MEMWAL_PRIVATE_KEY=f5e3dac2...
MEMWAL_NETWORK=testnet
\`\`\`

## License

MIT — Walrus Track, Sui Overflow 2026 🏴‍☠️
