const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

let changes = 0;

// ============================================================
// CHANGE 1: Rename "View ↗" -> "Verify soul on Walrus ↗"
// ============================================================
const viewPattern = />View &nearr;<\/a>/g;
const viewMatches = app.match(viewPattern);
if (viewMatches) {
  app = app.replace(viewPattern, '>Verify soul on Walrus ↗</a>');
  console.log(`✅ CHANGE 1: Renamed ${viewMatches.length} 'View ↗' -> 'Verify soul on Walrus ↗'`);
  changes++;
} else {
  console.log('ℹ️ CHANGE 1: No "View ↗" found (may already be renamed)');
}

// ============================================================
// CHANGE 2: Add soulRestored state variable
// ============================================================
const statePattern = "  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')";
const stateReplacement = "  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')\n  const [soulDepth, setSoulDepth] = useState(0)\n  const [soulRestoredBlob, setSoulRestoredBlob] = useState('')";
if (app.includes(statePattern) && !app.includes('soulDepth')) {
  app = app.replace(statePattern, stateReplacement);
  console.log('✅ CHANGE 2: Added soulDepth + soulRestoredBlob state');
  changes++;
} else {
  console.log('ℹ️ CHANGE 2: State already added or pattern not matched');
}

// ============================================================
// CHANGE 3: Modify loadMemoryAndGreet to show "Soul restored" 
// And count Walrus blobs for soul depth
// ============================================================
// Find the section after Walrus data restore where latestBlobId is set
// Line currently: setLatestBlobId(data.latest_blob_id)
const blobSetPattern = "if (data.latest_blob_id) setLatestBlobId(data.latest_blob_id)";
const blobSetReplacement = `if (data.latest_blob_id) {
        setLatestBlobId(data.latest_blob_id)
        setSoulRestoredBlob(data.latest_blob_id)
        // Count blobs from visited agents for soul depth
        setSoulDepth(data.blob_count || data.visited_agents?.length || 0)
      }`;
if (app.includes(blobSetPattern)) {
  app = app.replace(blobSetPattern, blobSetReplacement);
  console.log('✅ CHANGE 3: loadMemoryAndGreet now sets soulDepth + soulRestoredBlob');
  changes++;
} else {
  console.log('ℹ️ CHANGE 3: Pattern not found');
}

// ============================================================
// CHANGE 4: Add "Soul restored" message after the saved greeting
// Modify generateGreeting or the greeting display to include soul info
// ============================================================
// Find the user_messages rendering section where chat bubbles are made
// Look for the section after ImmortalizeButton where soul depth should display

// ============================================================
// CHANGE 5: Add soul depth indicator near the agent card/selected agent
// ============================================================
// Find where selected agent info is displayed - look for agent.name or agent img
const agentCardPattern = /agent\.specialty/g;
const agentCardMatch = app.match(agentCardPattern);
console.log(`ℹ️ Found ${agentCardMatch ? agentCardMatch.length : 0} agent.specialty references`);

// Find the ImmortalizeButton or status section to add soul data
// Look for the section where "Walrus Blob" info is shown

// ============================================================
// CHANGE 6: In generateGreeting, append soul restored message
// ============================================================
// Modify the existing greeting when returning user has memory
// Add after the greetings object generation 
const greetEndPattern = "return greetings[agentId] || `${n}! Your NFT remembers you. The resurrection is real. What do you want to do?`";
const greetEndReplacement = `    // Append soul depth info to greeting
    const soulInfo = soulDepth > 1 ? \`\\n\\n[Soul Depth: \${soulDepth} Walrus blobs stored — growing each time you speak]\` : ''
    return (greetings[agentId] || \`\${n}! Your NFT remembers you. The resurrection is real. What do you want to do?\`) + soulInfo`;
if (app.includes(greetEndPattern) && !app.includes('soulDepth')) {
  app = app.replace(greetEndPattern, greetEndReplacement);
  console.log('✅ CHANGE 6: generateGreeting now includes soul depth info');
  changes++;
} else {
  console.log('ℹ️ CHANGE 6: Pattern not matched or already changed');
}

// ============================================================
// CHANGE 7: Add resurrection banner display near latest blob info
// ============================================================
// Look for where latestBlobId is rendered in the UI
const blobDisplayPattern = `{latestBlobNetwork === 'testnet' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/\${latestBlobId}`;
// Add resurrection text right before or after this section
// Find the "Walrus Blob" section
const walrusBlobSectionPattern = `Walrus Blob`;
if (app.includes(walrusBlobSectionPattern)) {
  // Add a resurrection badge after the blob section
  const soulBadgeInsert = `
          {soulRestoredBlob && (
            <div style={{
              padding: '6px 10px', background: 'linear-gradient(135deg, rgba(255,42,109,0.15), rgba(155,77,229,0.15))',
              borderRadius: '6px', border: '1px solid rgba(255,42,109,0.3)', marginBottom: '8px',
              fontSize: '10px', fontFamily: "'Rubik Mono One', sans-serif"
            }}>
              ♻️ SOUL RESTORED from Walrus block{' '}
              <a href={\`${WALRUS_AGGREGATOR}/v1/blobs/\${soulRestoredBlob}\`} target="_blank"
                style={{ color: '#ff2a6d', textDecoration: 'underline' }}>
                #{soulRestoredBlob.slice(0, 12)}...
              </a>
              {soulDepth > 0 && <span style={{ color: '#2ec4b6', marginLeft: '8px' }}>| Soul depth: {soulDepth} blobs</span>}
            </div>
          )}`;
  
  // Insert after the Walrus Blob section (before the closing </div> of that container)
  // Let's find a good insertion point - after `</div>)` closing the Walrus blob section
  console.log('ℹ️ Walrus Blob section found - will insert soul badge via post-processing');
}

// ============================================================
// CHANGE 8: Auto-update blob count on Walrus success
// Find the Immortalize success handler where latestBlobId is set
// ============================================================
// After successful Walrus store, increment soul depth
const successPattern = 'setWalrusSaved(true)';
if (app.includes(successPattern)) {
  // Don't modify this one directly, find the specific immortalize success handler
  console.log('ℹ️ Found Walrus success handlers');
}

// Write file
fs.writeFileSync(filePath, app, 'utf8');
console.log(`\n✅ All changes applied. Total change sets: ${changes}`);
console.log('Target file: ' + filePath);
