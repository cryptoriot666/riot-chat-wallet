// Stub memwal-client when credentials not available
export async function initMemWal() { return null; }
export async function memwalRemember() { return null; }
export async function memwalRecall() { return { results: [] }; }
export async function memwalAnalyze() { return null; }
export async function memwalRememberBulk() { return null; }
export function isMemWalReady() { return false; }
export async function getMemWalHealth() { return { status: 'stubbed' }; }
export async function memwalCrossAgentRecall() { return { results: [] }; }
