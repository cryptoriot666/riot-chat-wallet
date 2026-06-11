const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');
let changes = [];

// === CHANGE 1 (already done): Rename "View" -> "Verify soul on Walrus" ===
const viewCount = (app.match(/>View &nearr;/g) || []).length;
if (viewCount > 0) {
  app = app.replace(/>View &nearr;<\/a>/g, '>Verify soul on Walrus ↗</a>');
  changes.push(`Renamed ${viewCount} "View ↗" -> "Verify soul on Walrus ↗"`);
}

// === CHANGE 2: Add soulDepth + soulRestoredBlob state ===
const stateOld = "  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')";
const stateNew = "  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')\n  const [soulDepth, setSoulDepth] = useState(0)\n  const [soulRestoredBlob, setSoulRestoredBlob] = useState('')";
if (app.includes(stateOld) && !app.includes('soulDepth')) {
  app = app.replace(stateOld, stateNew);
  changes.push('Added soulDepth + soulRestoredBlob state variables');
}

// === CHANGE 3: loadMemoryAndGreet - set soulDepth from data ===
const blobSetOld = "if (data.latest_blob_id) setLatestBlobId(data.latest_blob_id)";
const blobSetNew = "if (data.latest_blob_id) {\n        setLatestBlobId(data.latest_blob_id)\n        setSoulRestoredBlob(data.latest_blob_id)\n        setSoulDepth(data.blob_count || data.visited_agents?.length || 0)\n      }";
if (app.includes(blobSetOld)) {
  app = app.replace(blobSetOld, blobSetNew);
  changes.push('loadMemoryAndGreet now sets soulDepth + soulRestoredBlob');
}

// === CHANGE 4: Add soul depth to generateGreeting ===
// After the greetings fallback line, add soul depth info
const greetOld = "return greetings[agentId] || `${n}! Your NFT remembers you. The resurrection is real. What do you want to do?`";
const greetNew = "    const soulInfo = soulDepth > 0 ? `\\n\\n♻️ SOUL DEPTH: ${soulDepth} Walrus blobs stored — your NFT grows richer each time you speak.` : ''\n    return (greetings[agentId] || `${n}! Your NFT remembers you. The resurrection is real. What do you want to do?`) + soulInfo";
if (app.includes(greetOld)) {
  app = app.replace(greetOld, greetNew);
  changes.push('generateGreeting now includes soul depth info');
}

// === CHANGE 5: Add resurrection banner + soul depth in the Walrus section ===
// Add a resurrection badge after the Walrus Blob ID section in the header/status area
// Find the closing div after the Walrus Blob section
// We'll add it right after the latestBlobId display block
const walrusBlobEnd = "{latestBlobNetwork === 'testnet' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`";
const soulBadge = `{latestBlobNetwork === 'testnet' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/\${latestBlobId}\`

          {/* Soul Restoration Badge */}
          {soulRestoredBlob && (
            <div style={{
              padding: '6px 10px', background: 'linear-gradient(135deg, rgba(255,42,109,0.15), rgba(155,77,229,0.15))',
              borderRadius: '6px', border: '1px solid rgba(255,42,109,0.3)', marginTop: '8px',
              fontSize: '10px', fontFamily: "'Rubik Mono One', sans-serif", color: '#ff2a6d'
            }}>
              ♻️ SOUL RESTORED — this NFT remembers you.
              <br/>
              <span style={{color: '#2ec4b6', fontSize: '9px'}}>
                Walrus block: {soulRestoredBlob.slice(0, 16)}...
                {soulDepth > 0 && <span> | Soul depth: {soulDepth} blobs</span>}
              </span>
            </div>
          )}`;

if (app.includes(walrusBlobEnd)) {
  app = app.replace(walrusBlobEnd, soulBadge);
  changes.push('Added resurrection badge near Walrus blob display');
}

// === CHANGE 6: Increment soulDepth on Immortalize success ===
const immortalizeSuccess = 'setWalrusSaved(true)';
const immortalizeNew = `setWalrusSaved(true)
        setSoulDepth(prev => prev + 1)`;
// Count replacements so we don't do it infinitely
let immCount = 0;
while (app.includes(immortalizeSuccess) && immCount < 3) {
  // Only replace the one near the ImmortalizeButton click handler,
  // not the one in loadMemoryAndGreet
  const idx = app.indexOf(immortalizeSuccess);
  const context = app.substring(Math.max(0, idx - 100), idx + 100);
  if (context.includes('handleImmortalize') || context.includes('ImmortalizeButton') || context.includes('onClick.*immortalize')) {
    app = app.substring(0, idx) + immortalizeNew + app.substring(idx + immortalizeSuccess.length);
    immCount++;
  } else {
    break;
  }
}
if (immCount > 0) {
  changes.push(`Incremented soulDepth on ${immCount} Immortalize success handlers`);
}

// Write file
fs.writeFileSync(filePath, app, 'utf8');
console.log('✅ Changes applied:');
changes.forEach(c => console.log(`  • ${c}`));
console.log(`\nTotal: ${changes.length} change sets`);
