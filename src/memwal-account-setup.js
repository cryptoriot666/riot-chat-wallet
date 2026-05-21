// MemWal Account Setup Helper
// Run this ONCE to create your MemWal account and delegate key

import { generateDelegateKey, createAccount, addDelegateKey } from "@mysten-incubation/memwal";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

/**
 * STEP 1: Generate delegate keypair (Ed25519)
 * This key is used by your app to read/write memory on behalf of user
 */
export function generateNewDelegateKey() {
  const delegate = generateDelegateKey();
  return {
    privateKey: delegate.privateKey,  // Store this SECURELY (env var)
    publicKey: delegate.publicKey,
    suiAddress: delegate.suiAddress
  };
}

/**
 * STEP 2: Create MemWal account on-chain
 * Requires user's Sui wallet to sign transaction
 * 
 * @param {string} ownerAddress - User's Sui wallet address
 * @param {string} delegatePublicKey - From step 1
 * @param {Signer} signer - Connected wallet signer
 */
export async function createMemWalAccount(ownerAddress, delegatePublicKey, signer) {
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

  const result = await createAccount({
    client,
    signer,
    delegatePublicKey,  // The key your app will use
    // Optional: set expiration, scope, etc.
  });

  return {
    accountId: result.accountId,  // MemWalAccount object ID - SAVE THIS
    transaction: result.digest
  };
}

/**
 * STEP 3: Add more delegate keys (optional)
 * If you need to rotate keys or add multiple app instances
 */
export async function addNewDelegateKey(accountId, newDelegatePublicKey, signer) {
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

  const result = await addDelegateKey({
    client,
    signer,
    accountId,
    delegatePublicKey: newDelegatePublicKey
  });

  return result;
}

/**
 * QUICK SETUP FLOW:
 * 
 * 1. Run generateNewDelegateKey() → save privateKey to .env
 * 2. User connects wallet → call createMemWalAccount() with their signer
 * 3. Save accountId to your database (linked to user's wallet)
 * 4. Use both in MemWal.create({ key: privateKey, accountId, ... })
 * 
 * ALTERNATIVE: Use MemWal Playground
 * - Go to https://memwal.ai or https://memwal.wal.app
 * - Connect wallet, create account, copy credentials
 * - Much faster than programmatic setup
 */

export const SETUP_INSTRUCTIONS = `
=== MEMWAL ACCOUNT SETUP ===

OPTION A: Playground (Fastest - 2 minutes)
1. Open https://memwal.ai or https://memwal.wal.app
2. Connect your Sui wallet
3. Click "Create Account"
4. Copy: Account ID + Delegate Private Key
5. Paste into your .env file

OPTION B: Programmatic (More control)
1. Run generateNewDelegateKey() → save private key
2. Call createMemWalAccount() with user's wallet signer
3. Save returned accountId
4. Use in MemWal.create()

=== ENV VARIABLES ===
VITE_MEMWAL_DELEGATE_KEY=your_private_key_hex
VITE_MEMWAL_ACCOUNT_ID=your_account_object_id
VITE_MEMWAL_RELAYER_URL=https://relayer.memwal.ai

=== NOTES ===
- One account per user (or one shared account per app)
- Delegate key = app authentication (keep secret!)
- Account ID = on-chain object (public)
- Relayer URL = https://relayer.memwal.ai (mainnet)
`;
