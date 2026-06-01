const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Add specialty line after desc line in agent detail area
const target = `{selectedAgent.trait.toUpperCase()} \xb7 {selectedAgent.desc}</p>`;
const newTarget = `{selectedAgent.trait.toUpperCase()} \xb7 {selectedAgent.desc}</p>\n              <p style={{ fontSize: '10px', color: '#6a5040', margin: '2px 0 0 0', fontFamily: "'Inter', sans-serif" }}>{selectedAgent.emoji} {selectedAgent.specialty}</p>`;

if (c.includes(target)) {
  c = c.replace(target, newTarget);
  console.log('Patched agent detail specialty!');
} else {
  // Try without the middle dot
  const target2 = `{selectedAgent.trait.toUpperCase()} · {selectedAgent.desc}</p>`;
  if (c.includes(target2)) {
    c = c.replace(target2, `{selectedAgent.trait.toUpperCase()} · {selectedAgent.desc}</p>\n              <p style={{ fontSize: '10px', color: '#6a5040', margin: '2px 0 0 0', fontFamily: "'Inter', sans-serif" }}>{selectedAgent.emoji} {selectedAgent.specialty}</p>`);
    console.log('Patched dot2!');
  } else {
    // Find by context
    const idx = c.indexOf('selectedAgent.trait.toUpperCase()');
    if (idx >= 0) {
      const ctx = c.slice(idx, idx + 200);
      console.log('Context:', JSON.stringify(ctx));
      // Find the closing </p>
      const pEnd = c.indexOf('</p>', idx);
      const pEnd2 = c.indexOf('</p>', pEnd + 1);
      if (pEnd2 >= 0) {
        const insertAt = pEnd2 + 4; // after second </p>
        c = c.slice(0, insertAt) + '\n              <p style={{ fontSize: \'10px\', color: \'#6a5040\', margin: \'2px 0 0 0\', fontFamily: "\'Inter\', sans-serif" }}>{selectedAgent.emoji} {selectedAgent.specialty}</p>' + c.slice(insertAt);
        console.log('Inserted at', insertAt);
      }
    }
  }
}

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
console.log('Written!');
