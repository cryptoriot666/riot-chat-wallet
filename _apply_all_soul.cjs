const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

const changes = [];

// === CHECK 1: Already done by git checkout (revert). Check if "View ↗" still exists ===
const viewCount = (app.match(/>View &nearr;/g) || []).length;
if (viewCount > 0) {
  console.log(`Found ${viewCount} "View ↗" occurrences - will rename`);
  
  app = app.replace(/>View &nearr;<\/a>/g, '>Verify soul on Walrus ↗</a>');
  changes.push(`Renamed ${viewCount} "View ↗" -> "Verify soul on Walrus ↗"`);
}

// === CHECK 2: Add soulDepth + soulRestoredBlob state after latestBlobNetwork ===
const stateInsertPoint = "  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')";
if (app.includes(stateInsertPoint) && !app.includes('soulDepth')) {
  app = app.replace(
    stateInsertPoint,
    `  const [latestBlobNetwork, setLatestBlobNetwork] = useState('mainnet')
  const [soulDepth, setSoulDepth] = useState(0)
  const [soulRestoredBlob, setSoulRestoredBlob] = useState('')`
  );
  changes.push('Added soulDepth + soulRestoredBlob state');
}

// === CHECK 3: Modify loadMemoryAndGreet to set soulDepth from data ===
const loadPattern = "if (data.latest_blob_id) setLatestBlobId(data.latest_blob_id)";
if (app.includes(loadPattern)) {
  app = app.replace(
    loadPattern,
    `if (data.latest_blob_id) {
        setLatestBlobId(data.latest_blob_id)
        setSoulRestoredBlob(data.latest_blob_id)
        setSoulDepth(data.blob_count || data.visited_agents?.length || 0)
      }`
  );
  changes.push('loadMemoryAndGreet now sets soulDepth + soulRestoredBlob');
}

// === CHECK 4: generateGreeting - add soul depth info ===
const greetPattern = "return greetings[agentId] || `${n}! Your NFT remembers you. The resurrection is real. What do you want to do?`";
if (app.includes(greetPattern)) {
  app = app.replace(
    greetPattern,
    `    const soulInfo = soulDepth > 0 ? \`\\n\\n♻️ SOUL DEPTH: \${soulDepth} Walrus blobs stored — your NFT grows richer each time you speak.\` : ''
    return (greetings[agentId] || \`\${n}! Your NFT remembers you. The resurrection is real. What do you want to do?\`) + soulInfo`
  );
  changes.push('generateGreeting now includes soul depth info');
}

// === CHECK 5: Walrus blob section - wrap in fragment and add soul badge ===
// Specific: the {latestBlobId && ( ... )} block needs to become
// {latestBlobId && ( <> <div>...Walrus...</div> {soul badge} </> )}
// We'll replace the entire section carefully

const walrusSectionOpen = `          {latestBlobId && (
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '11px', color: '#00b4d8', marginBottom: '4px', fontFamily: "'Rubik Mono One', sans-serif" }}>
                Walrus Blob · <span style={{ color: latestBlobNetwork === 'testnet' ? '#ff6b35' : '#2ec4b6' }}>{latestBlobNetwork.toUpperCase()}</span>
              </div>
              <a href=`;

const walrusSectionRepl = `          {latestBlobId && (
            <>
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '11px', color: '#00b4d8', marginBottom: '4px', fontFamily: "'Rubik Mono One', sans-serif" }}>
                Walrus Blob · <span style={{ color: latestBlobNetwork === 'testnet' ? '#ff6b35' : '#2ec4b6' }}>{latestBlobNetwork.toUpperCase()}</span>
              </div>
              <a href=`;

if (app.includes(walrusSectionOpen)) {
  app = app.replace(walrusSectionOpen, walrusSectionRepl);
  changes.push('Added fragment <> to Walrus blob section');
  console.log('✅ Walrus section fragment opening applied');
  
  // Now find and modify the closing of the Walrus section:
  // From: </div>\n          )}\n        </div>\n      )}\n\n      {/* CSS Animations */}
  // To:   </div>\n            {soul badge}\n            </>\n          )}\n        </div>\n      )}
  
  // Find the closing structure. After the </a> closing the Walrus link
  // The section ends with: 
  //               </a>\n            </div>\n          )}\n        </div>\n      )}\n\n      {/* CSS Animations
  
  // We need to insert the soul badge BEFORE the closing `)}` of {latestBlobId && (...) }
  // and add the </> fragment closing
  
  const walrusClose = `              </a>
            </div>
          )}
        </div>
      )}

      {/* CSS Animations`;

  const walrusCloseRepl = `              </a>
            </div>
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
          )}
            </>
          )}
        </div>
      )}

      {/* CSS Animations`;

  if (app.includes(walrusClose)) {
    app = app.replace(walrusClose, walrusCloseRepl);
    changes.push('Added soul restoration badge + fragment closing');
    console.log('✅ Soul badge + fragment closing applied');
  } else {
    console.log('❌ Walrus closing pattern not found - checking');
    // Find the text after </a>
    const idx = app.indexOf('Verify soul on Walrus');
    if (idx > -1) {
      const section = app.substring(idx, idx + 500);
      console.log(`Context after Verify soul on Walrus:`);
      console.log(section);
    }
  }
} else {
  console.log('❌ Walrus opening pattern not found');
}

// === CHECK 6: Immortalize success - increment soulDepth ===
// Find where setWalrusSaved(true) is called in the ImmortalizeButton click handler context
// Not the one in loadMemoryAndGreet
// Let's find the one that's inside an async function that's the ImmortalizeButton handler
const immPattern = "setWalrusSaved(true)";
if (app.includes(immPattern)) {
  // Find the occurrence near the ImmortalizeButton click handler
  // Count occurrences
  let idx = 0;
  let immCount = 0;
  while ((idx = app.indexOf(immPattern, idx)) !== -1) {
    const before = app.substring(Math.max(0, idx - 200), idx);
    const after = app.substring(idx, idx + 80);
    // Check if this is in the Immortalize handler context (not loadMemoryAndGreet)
    if (before.includes('Immortalize') || before.includes('immortalize') || before.includes('handleImmortalize')) {
      // Replace this occurrence
      app = app.substring(0, idx) + "setWalrusSaved(true)\n        setSoulDepth(prev => prev + 1)" + app.substring(idx + immPattern.length);
      immCount++;
      idx += immPattern.length + 50;
    } else {
      idx += immPattern.length;
    }
  }
  if (immCount > 0) {
    changes.push(`Incremented soulDepth on ${immCount} Immortalize success handlers`);
  }
}

// Write
fs.writeFileSync(filePath, app, 'utf8');
console.log(`\n✅ Done. ${changes.length} change sets applied:`);
changes.forEach(c => console.log(`  • ${c}`));
