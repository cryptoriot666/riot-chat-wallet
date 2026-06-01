const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Count ALL divs in file
const o = (c.match(/<div[^>]*>/g) || []).length;
const l = (c.match(/<\/div>/g) || []).length;
console.log('ALL divs:', o, 'open,', l, 'close, net:', o - l);

// Count from 'export default function App() {'
const appStart = c.indexOf('export default function App');
const after = c.slice(appStart);
const ao = (after.match(/<div[^>]*>/g) || []).length;
const al = (after.match(/<\/div>/g) || []).length;
console.log('Inside App():', ao, 'open,', al, 'close, net:', ao - al);
console.log('\nAll divs must match inside App() since JSX must be fully balanced.');
