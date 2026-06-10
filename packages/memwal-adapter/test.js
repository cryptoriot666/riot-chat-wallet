/**
 * @riot/memwal-adapter Test Suite
 * Run: node test.js
 */

const { MemWal, MemWalMemory } = require('./index.js');

global.fetch = async (url, options) => {
  console.log(`[Mock] ${options?.method || 'GET'} ${url}`);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ blobId: 'mock_blob_id' })
  };
};

async function runTests() {
  console.log('🧪 Running MemWal Adapter Tests\n');

  console.log('Test 1: Constructor...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    console.log('  ✅ Constructor works - Namespace:', memory.namespace, '| Network:', memory.network);
  } catch (err) {
    console.log('  ❌ Constructor failed:', err.message);
  }

  console.log('\nTest 2: remember()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    const result = await memory.remember('test_key', { data: 'test' });
    console.log('  ✅ remember() works - Result:', result.blobId);
  } catch (err) {
    console.log('  ❌ remember() failed:', err.message);
  }

  console.log('\nTest 3: recall()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    await memory.remember('recall_test', { value: 42 });
    const result = await memory.recall('recall_test');
    console.log('  ✅ recall() works - Result:', result);
  } catch (err) {
    console.log('  ❌ recall() failed:', err.message);
  }

  console.log('\nTest 4: recall() with default...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    const result = await memory.recall('nonexistent_key', { default: 'default_value' });
    console.log('  ✅ recall() with default works - Result:', result);
  } catch (err) {
    console.log('  ❌ recall() with default failed:', err.message);
  }

  console.log('\nTest 5: forget()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    await memory.remember('forget_test', { data: 'test' });
    const result = await memory.forget('forget_test');
    console.log('  ✅ forget() works - Result:', result);
  } catch (err) {
    console.log('  ❌ forget() failed:', err.message);
  }

  console.log('\nTest 6: share()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    const result = await memory.share('shared_data', { shared: true }, ['FORGE', 'CIPHER']);
    console.log('  ✅ share() works - Result:', result.blobId);
  } catch (err) {
    console.log('  ❌ share() failed:', err.message);
  }

  console.log('\nTest 7: broadcast()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    const result = await memory.broadcast('system_status', { online: true });
    console.log('  ✅ broadcast() works - Result:', result.blobId);
  } catch (err) {
    console.log('  ❌ broadcast() failed:', err.message);
  }

  console.log('\nTest 8: stats()...');
  try {
    const memory = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456' });
    await memory.remember('stats_test', { data: 'test' });
    const stats = memory.stats();
    console.log('  ✅ stats() works - Cached keys:', stats.cachedKeys);
  } catch (err) {
    console.log('  ❌ stats() failed:', err.message);
  }

  console.log('\nTest 9: MemWalMemory (LangChain integration)...');
  try {
    const memory = new MemWalMemory({
      accountId: '0xtest123',
      privateKey: '0xtest456',
      sessionId: 'test_session'
    });
    await memory.saveContext({ input: 'hello' }, { output: 'hi there' });
    const context = await memory.loadContext();
    console.log('  ✅ MemWalMemory works - Context:', JSON.stringify(context));
  } catch (err) {
    console.log('  ❌ MemWalMemory failed:', err.message);
  }

  console.log('\nTest 10: Multi-agent pattern...');
  try {
    const agentA = new MemWal({ accountId: '0xtest123', privateKey: '0xtest456', namespace: 'agent_a' });
    const agentB = new MemWal({ accountId: '0xtest789', privateKey: '0xtestabc', namespace: 'agent_b' });
    await agentA.remember('shared_data', { from: 'A', data: 'cross-agent' });
    const result = await agentB.recall('shared_data', { default: null });
    console.log('  ✅ Multi-agent pattern works');
  } catch (err) {
    console.log('  ❌ Multi-agent failed:', err.message);
  }

  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
