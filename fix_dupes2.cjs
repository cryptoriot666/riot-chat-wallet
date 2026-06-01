const fs = require('fs');
const path = 'C:\\Users\\nandacamp\\.openclaw\\workspace\\riot-chat-wallet-temp\\src\\App.jsx';
let c = fs.readFileSync(path, 'utf8');

const lines = c.split('\n');
const removals = [];

// Find duplicate const declarations
let seenDecls = {};
lines.forEach((line, i) => {
  // Match const declarations with hooks
  const m = line.match(/^\s*const\s+\[(\w+)/);
  if (m && seenDecls[m[1]] !== undefined) {
    removals.push(i);
    console.log('Duplicate at line ' + (i+1) + ': ' + m[1]);
  }
  const m2 = line.match(/^\s*const\s+(\w+)\s*=\s*(\(|async\s*\()/);
  if (m2) {
    if (seenDecls[m2[1]] !== undefined) {
      removals.push(i);
      console.log('Duplicate at line ' + (i+1) + ': ' + m2[1]);
    } else {
      seenDecls[m2[1]] = i;
    }
  }
  if (m) seenDecls[m[1]] = i;
});

// Remove duplicates (reverse order to preserve indices)
removals.reverse().forEach(i => lines.splice(i, 1));

fs.writeFileSync(path, lines.join('\n'));
console.log('Removed ' + removals.length + ' duplicates');
