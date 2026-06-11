const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');
let lines = app.split('\n');

// Find the broken Walrus blob link section
let foundHref = -1;
let foundEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('WALRUS_AGGREGATOR_TESTNET : WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`')) {
    foundHref = i;
  }
  // Find the closing of this section - the line with "Walrus Blob ·" above it
  if (i > 0 && lines[i].includes('Verify soul on Walrus')) {
    if (foundEnd === -1) foundEnd = i;
  }
}

if (foundHref === -1) {
  console.log('Could not find Walrus blob href line');
  process.exit(1);
}

console.log(`Found broken href at line ${foundHref + 1}`);

// Look at the structure from Walrus Blob header to figure out what broke
for (let i = foundHref - 5; i < Math.min(foundHref + 30, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// The replacement inserted soul badge IN the <a> tag. Need to reconstruct.
// Find the actual ending of the full Walrus section (where the soul badge should go)
let sectionEnd = -1;
for (let i = foundHref; i < lines.length; i++) {
  if (lines[i].includes('CSS Animations') || lines[i].includes('@keyframes')) {
    sectionEnd = i - 2; // go back a bit to find the actual end
    break;
  }
}

console.log(`\nSection seems to end around line ${sectionEnd + 1}`);
