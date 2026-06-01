const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// Find all saveStatus declarations and remove extras
const lines = c.split('\n');
let found = 0;
const toRemove = [];
lines.forEach((line, i) => {
  if (line.includes('const [saveStatus, setSaveStatus]') || line.includes('const [showEncryptModal, setShowEncryptModal]')) {
    found++;
    if (found > 1) toRemove.push(i);
  }
});
toRemove.reverse().forEach(i => lines.splice(i, 1));
c = lines.join('\n');

// Also check for duplicate handleEncryptEnable/Disable
const lines2 = c.split('\n');
let h1 = 0, h2 = 0;
const toRemove2 = [];
lines2.forEach((line, i) => {
  if (line.includes('const handleEncryptEnable')) { h1++; if (h1 > 1) toRemove2.push(i); }
  if (line.includes('const handleEncryptDisable')) { h2++; if (h2 > 1) toRemove2.push(i); }
});
toRemove2.reverse().forEach(i => lines2.splice(i, 1));

// Remove empty duplicate lines created after removal
let result = lines2.join('\n');

fs.writeFileSync(p, result);
console.log('Deduplicated. Build test...');
