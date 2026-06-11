const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');
let lines = app.split('\n');

// Find the {latestBlobId && ( line and add <> after it
let blobLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '{latestBlobId && (' && lines[i+1].trim().startsWith('<div')) {
    blobLine = i;
    break;
  }
}

if (blobLine > -1) {
  // Insert a <> fragment opening after the {latestBlobId && ( line
  lines.splice(blobLine + 1, 0, '            <>');
  console.log(`✅ Added <> fragment opening at line ${blobLine + 2}`);
} else {
  console.log('❌ Could not find insertion point');
  // Debug
  for (let i = 3200; i < Math.min(3225, lines.length); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('✅ Written');
