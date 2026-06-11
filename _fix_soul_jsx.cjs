const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// Find and fix: the soul badge is OUTSIDE the JSX expression block
// The Walrus section is: {latestBlobId && (
//   <div>
//     ... content ...
//   </div>
// )}
// Then: {/* Soul Restoration Badge */}
// But this comment is at the JSX top level - it needs to be inside <>...</>

// The fix: wrap the soul badge INSIDE the latestBlobId block using a React fragment
// Change: {latestBlobId && ( <div>...Walrus...</div> )} + soul badge
// To:     {latestBlobId && ( <> <div>...Walrus...</div> {soul badge} </> )}

// Find the Walrus section opening
const walrusOpen = "          {latestBlobId && (";
const walrusDiv = `            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)'
            }}>`;

// Change the opening to use fragment
const walrusOpenFixed = `          {latestBlobId && (
            <>
            <div style={{
              padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.06)'
            }}>`;

if (app.includes(walrusOpen + '\n' + walrusDiv)) {
  app = app.replace(walrusOpen + '\n' + walrusDiv, walrusOpenFixed);
  console.log('✅ Changed Walrus section to use fragment wrapper');
} else {
  console.log('❌ Pattern not found exactly');
  // Debug: find where {latestBlobId && ( appears
  const idx = app.indexOf(walrusOpen);
  console.log(`Found at index ${idx}`);
  console.log(`Context: "${app.substring(idx, idx + 200)}"`);
}

// Also need to close the fragment properly
// The current end is:
//           </div>
//         )}
// We need:
//           </div>
//           {soulRestoredBlob && (...)}
//           </>
//         )}

// Find the closing of the Walrus section
const closingDiv = "          </div>\n        )}";
const closingFragment = `          </div>
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
            </>`;

// Replace the specific Walrus section end (not the soul badge which is already there)
const fullSectionEnd = "              </a>\n            </div>\n\n          {/* Soul Restoration Badge */}\n          {soulRestoredBlob && (\n            <div style={{\n              padding: '6px 10px', background: 'linear-gradient(135deg, rgba(255,42,109,0.15), rgba(155,77,229,0.15))',\n              borderRadius: '6px', border: '1px solid rgba(255,42,109,0.3)', marginTop: '8px',\n              fontSize: '10px', fontFamily: \"'Rubik Mono One', sans-serif\", color: '#ff2a6d'\n            }}>\n              ♻️ SOUL RESTORED — this NFT remembers you.\n              <br/>\n              <span style={{color: '#2ec4b6', fontSize: '9px'}}>\n                Walrus block: {soulRestoredBlob.slice(0, 16)}...\n                {soulDepth > 0 && <span> | Soul depth: {soulDepth} blobs</span>}\n              </span>\n            </div>\n          )}\n          </div>\n        )}\n        </div>\n      )}";

const replacer = "              </a>\n            </div>\n            {soulRestoredBlob && (\n            <div style={{\n              padding: '6px 10px', background: 'linear-gradient(135deg, rgba(255,42,109,0.15), rgba(155,77,229,0.15))',\n              borderRadius: '6px', border: '1px solid rgba(255,42,109,0.3)', marginTop: '8px',\n              fontSize: '10px', fontFamily: \"'Rubik Mono One', sans-serif\", color: '#ff2a6d'\n            }}>\n              ♻️ SOUL RESTORED — this NFT remembers you.\n              <br/>\n              <span style={{color: '#2ec4b6', fontSize: '9px'}}>\n                Walrus block: {soulRestoredBlob.slice(0, 16)}...\n                {soulDepth > 0 && <span> | Soul depth: {soulDepth} blobs</span>}\n              </span>\n            </div>\n          )}\n            </>\n          )}\n        </div>\n      )}";

if (app.includes(fullSectionEnd)) {
  app = app.replace(fullSectionEnd, replacer);
  console.log('✅ Replaced soul badge + closing section with fragment wrapper');
} else {
  console.log('❌ Full section end pattern not matched');
  // Let's read the actual closing section
  const idx = app.indexOf('Soul Restoration Badge');
  if (idx > -1) {
    console.log(`Found Soul Restoration Badge at index ${idx}`);
    console.log(`Context (prev 50 chars): "${app.substring(idx - 50, idx)}"`);
    console.log(`Context (next 200 chars): "${app.substring(idx, idx + 400)}"`);
  }
}

fs.writeFileSync(filePath, app, 'utf8');
console.log('✅ Written');
