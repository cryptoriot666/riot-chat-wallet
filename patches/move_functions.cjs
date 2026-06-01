const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

const appStart = c.indexOf('export default function App');
const inlineStart = c.indexOf('function WidgetTabs');
const inlineEnd = inlineStart + c.slice(inlineStart).indexOf('\n  const handleEncryptEnable');

console.log('App starts at:', appStart);
console.log('Inline at:', inlineStart, 'to', inlineEnd);

if (inlineStart < 0 || inlineEnd < 0) {
  console.log('Cannot find inline functions');
  process.exit(1);
}

const inline = c.slice(inlineStart, inlineEnd);
let before = c.slice(0, inlineStart);
let after = c.slice(inlineEnd);

// Insert before App() function
let result = before.slice(0, appStart) + '\n\n' + inline + '\n\n' + before.slice(appStart) + after;

fs.writeFileSync(p, result);
console.log('Done. New length:', result.length);
