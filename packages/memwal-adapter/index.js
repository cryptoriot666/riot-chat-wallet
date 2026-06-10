/**
 * @riot/memwal-adapter
 * Persistent AI Agent Memory via Walrus + MemWal
 * 
 * Walrus Track — Sui Overflow 2026
 */

const WALRUS_API_TESTNET = 'https://walrus-testnet.movellachain.com';
const WALRUS_API_MAINNET = 'https://walrus.movellachain.com';

class MemWal {
  constructor(config = {}) {
    if (!config.accountId || !config.privateKey) {
      throw new Error('MemWal requires accountId and privateKey');
    }
    
    this.accountId = config.accountId;
    this.privateKey = config.privateKey;
    this.network = config.network || 'testnet';
    this.namespace = config.namespace || 'riot_default';
    this.apiUrl = this.network === 'mainnet' ? WALRUS_API_MAINNET : WALRUS_API_TESTNET;
    this.cache = new Map();
  }

  _key(key) {
    return `${this.namespace}:${key}`;
  }

  async remember(key, value, ttl = null) {
    const fullKey = this._key(key);
    const data = {
      value,
      timestamp: Date.now(),
      ttl,
      namespace: this.namespace
    };
    
    try {
      const response = await fetch(`${this.apiUrl}/v1/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-Id': this.accountId,
          'X-Private-Key': this.privateKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Walrus store failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.cache.set(fullKey, { value, blobId: result.blobId });
      return result;
    } catch (err) {
      this.cache.set(fullKey, { value, blobId: 'local_cache' });
      console.warn('[MemWal] Walrus unavailable, using local cache:', err.message);
      return { blobId: 'local_cache', cached: true };
    }
  }

  async recall(key, options = {}) {
    const fullKey = this._key(key);
    
    if (this.cache.has(fullKey)) {
      const cached = this.cache.get(fullKey);
      if (cached.ttl && Date.now() - cached.timestamp > cached.ttl * 1000) {
        this.cache.delete(fullKey);
      } else {
        return cached.value;
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/recall/${fullKey}`, {
        method: 'GET',
        headers: {
          'X-Account-Id': this.accountId,
          'X-Private-Key': this.privateKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return options.default !== undefined ? options.default : null;
        }
        throw new Error(`Walrus recall failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(fullKey, { value: data.value, timestamp: Date.now() });
      return data.value;
    } catch (err) {
      console.warn('[MemWal] Recall failed, returning default:', err.message);
      return options.default !== undefined ? options.default : null;
    }
  }

  async forget(key) {
    const fullKey = this._key(key);
    this.cache.delete(fullKey);

    try {
      const response = await fetch(`${this.apiUrl}/v1/delete/${fullKey}`, {
        method: 'DELETE',
        headers: {
          'X-Account-Id': this.accountId,
          'X-Private-Key': this.privateKey
        }
      });
      return response.ok;
    } catch (err) {
      console.warn('[MemWal] Forget failed:', err.message);
      return false;
    }
  }

  async share(key, value, targets) {
    const shareData = {
      type: 'share',
      from: this.namespace,
      to: targets,
      key: this._key(key),
      value,
      timestamp: Date.now()
    };

    return this.remember(`shared:${key}`, shareData, 86400);
  }

  async broadcast(key, value) {
    const broadcastData = {
      type: 'broadcast',
      from: this.namespace,
      key: this._key(key),
      value,
      timestamp: Date.now()
    };

    return this.remember(`broadcast:${key}`, broadcastData);
  }

  async query(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matches = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        matches.push(key);
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/query/${this.namespace}/${pattern}`, {
        method: 'GET',
        headers: {
          'X-Account-Id': this.accountId,
          'X-Private-Key': this.privateKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        matches.push(...data.keys);
      }
    } catch (err) {
      console.warn('[MemWal] Query failed:', err.message);
    }

    return [...new Set(matches)];
  }

  async sync() {
    const pending = Array.from(this.cache.entries());
    const results = [];

    for (const [key, data] of pending) {
      try {
        const result = await this.remember(key, data.value);
        results.push({ key, success: true, blobId: result.blobId });
      } catch (err) {
        results.push({ key, success: false, error: err.message });
      }
    }

    return results;
  }

  stats() {
    return {
      namespace: this.namespace,
      network: this.network,
      cachedKeys: this.cache.size,
      cache: Array.from(this.cache.keys())
    };
  }
}

class MemWalMemory {
  constructor(config) {
    this.memwal = new MemWal(config);
    this.sessionId = config.sessionId || 'default';
  }

  async saveContext(input, output) {
    const key = `context:${this.sessionId}`;
    const context = { input, output, timestamp: Date.now() };
    await this.memwal.remember(key, context);
  }

  async loadContext() {
    const key = `context:${this.sessionId}`;
    return await this.memwal.recall(key, { default: { input: {}, output: {} } });
  }

  async clear() {
    await this.memwal.forget(`context:${this.sessionId}`);
  }
}

module.exports = { MemWal, MemWalMemory };
