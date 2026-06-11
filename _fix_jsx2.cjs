const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');
let lines = app.split('\n');

// Find the broken Walrus blob section
let brokenStart = -1;
let brokenEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`') && 
      !lines[i].includes('target=')) {
    brokenStart = i;
  }
  if (brokenStart > -1 && lines[i].includes('CSS Animations')) {
    brokenEnd = i - 1;
    break;
  }
}

if (brokenStart === -1) {
  console.log('ERROR: Could not find broken Walrus section');
  process.exit(1);
}

console.log(`Broken section: lines ${brokenStart + 1} to ${brokenEnd + 1}`);
console.log(`Section length: ${brokenEnd - brokenStart + 1} lines`);

// Reconstruct the Walrus blob link section + soul badge correctly
const reconstructed = [
  // The original Walrus blob section (repaired)
  '              <a href={`${latestBlobNetwork === \'testnet\' ? WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`} target="_blank" rel="noopener"',
  '                style={{ fontSize: \'10px\', color: \'#00b4d8\', fontFamily: \'monospace\', wordBreak: \'break-all\', textDecoration: \'underline\' }}>',
  '                {latestBlobId}',
  '              </a>',
  '            </div>',
  '',
  '          {/* Soul Restoration Badge */}',
  '          {soulRestoredBlob && (',
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
  '          </div>',
  '        )}',
  '        </div>',
  '      )}',
];

console.log(`Reconstructed section: ${reconstructed.length} lines`);

// Replace the broken section
const newLines = [
  ...lines.slice(0, brokenStart),
  ...reconstructed,
  ...lines.slice(brokenEnd + 1)
];

console.log(`Old lines: ${lines.length}, New lines: ${newLines.length}`);

// Write
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ File written successfully');

// Verify the fix
const verify = fs.readFileSync(filePath, 'utf8');
const verifyLines = verify.split('\n');
console.log(`\nVerification - lines near reconstructed area:`);
for (let i = brokenStart - 2; i < Math.min(brokenStart + reconstructed.length + 2, verifyLines.length); i++) {
  console.log(`  ${i + 1}: ${verifyLines[i]}`);
}
