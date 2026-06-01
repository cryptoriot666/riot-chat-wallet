const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');
const cssIdx = c.indexOf('CSS Animations');
const tail = c.slice(cssIdx - 600, cssIdx);
console.log(tail);
