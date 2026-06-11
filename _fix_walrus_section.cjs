const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');

// Read raw bytes to preserve encoding
const bytes = fs.readFileSync(filePath);
let app = bytes.toString('utf8');
let lines = app.split('\n');

console.log(`Total lines: ${lines.length}`);

// Find the {latestBlobId && ( section and its structure
for (let i = 3218; i < Math.min(3265, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Now let's identify the exact text
// The section is:
//   {latestBlobId && (
//     <div ... Walrus Blob ...>
//       ...
//       <a href=...>Verify soul on Walrus ↗</a>
//     </div>
//   )}
//   </div>
//   )}
//   </div>
//   )}
//   
//   {/* CSS Animations ...

// The {latestBlobId && ( ... )} wraps ONLY the single div with Walrus blob info
// This is different from what I expected - it's not wrapping both sections

// So we need to WRAP the soul badge INSIDE {latestBlobId && (...)} using a fragment

// Find the exact lines
let openLine = -1;
let closeLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '{latestBlobId && (' && openLine === -1) {
    openLine = i;
  }
  // Find the closing of this expression - the )} that closes {latestBlobId && (...)} 
  if (openLine > -1 && lines[i].trim() === ')}' && closeLine === -1 && i > openLine + 2) {
    closeLine = i;
    break;
  }
}

console.log(`\nWalrus section: lines ${openLine + 1} to ${closeLine + 1}`);

if (openLine > -1 && closeLine > -1) {
  // Insert a fragment opening after {latestBlobId && (
  lines.splice(openLine + 1, 0, '            <>');
  
  // Now closeLine is shifted by 1
  const shiftedCloseLine = closeLine + 1;
  
  // Before the closing )}, insert: the soul badge + </>
  const soulBadge = [
    '            {soulRestoredBlob && (',
    '            <div style={{',
    "              padding: '6px 10px', background: 'linear-gradient(135deg, rgba(255,42,109,0.15), rgba(155,77,229,0.15))',",
    "              borderRadius: '6px', border: '1px solid rgba(255,42,109,0.3)', marginTop: '8px',",
    "              fontSize: '10px', fontFamily: \"'Rubik Mono One', sans-serif\", color: '#ff2a6d'",
    '            }}>',
    '              ♻️ SOUL RESTORED — this NFT remembers you.',
    '              <br/>',
    "              <span style={{color: '#2ec4b6', fontSize: '9px'}}>",
    '                Walrus block: {soulRestoredBlob.slice(0, 16)}...',
    '                {soulDepth > 0 && <span> | Soul depth: {soulDepth} blobs</span>}',
    '              </span>',
    '            </div>',
    '          )}',
    '            </>'
  ];
  
  lines.splice(shiftedCloseLine, 0, ...soulBadge);
  
  console.log(`✅ Added fragment opening at line ${openLine + 2}`);
  console.log(`✅ Added soul badge + fragment closing before line ${shiftedCloseLine + 1}`);
  
  // Verify
  console.log(`\nVerification (lines ${openLine} to ${shiftedCloseLine + soulBadge.length + 2}):`);
  for (let i = openLine; i < Math.min(shiftedCloseLine + soulBadge.length + 3, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

// Write back
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log(`\n✅ Written. New line count: ${lines.length}`);
