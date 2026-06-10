/**
 * TypeScript definitions for @riot/memwal-adapter
 */

export interface MemWalConfig {
  accountId: string;
  privateKey: string;
  network?: 'testnet' | 'mainnet';
  namespace?: string;
}

export interface MemWalOptions {
  default?: any;
}

export interface RememberResult {
  blobId: string;
  cached?: boolean;
}

export interface MemoryStats {
  namespace: string;
  network: string;
  cachedKeys: number;
  cache: string[];
}

export interface ShareData {
  type: 'share' | 'broadcast';
  from: string;
  to?: string[];
  key: string;
  value: any;
  timestamp: number;
}

export interface MemWalMemoryConfig extends MemWalConfig {
  sessionId?: string;
}

export class MemWal {
  constructor(config: MemWalConfig);
  remember(key: string, value: any, ttl?: number): Promise<RememberResult>;
  recall(key: string, options?: MemWalOptions): Promise<any>;
  forget(key: string): Promise<boolean>;
  share(key: string, value: any, targets: string[]): Promise<RememberResult>;
  broadcast(key: string, value: any): Promise<RememberResult>;
  query(pattern: string): Promise<string[]>;
  sync(): Promise<Array<{ key: string; success: boolean; blobId?: string; error?: string }>>;
  stats(): MemoryStats;
}

export class MemWalMemory {
  constructor(config: MemWalMemoryConfig);
  saveContext(input: any, output: any): Promise<void>;
  loadContext(): Promise<{ input: any; output: any }>;
  clear(): Promise<void>;
}
