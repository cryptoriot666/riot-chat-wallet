const fs = require('fs');
const path = 'C:\\Users\\nandacamp\\.openclaw\\workspace\\riot-chat-wallet-temp\\src\\App.jsx';
let c = fs.readFileSync(path, 'utf8');

// Remove duplicate saveStatus declarations (keep only first)
// There are 3, we remove the last 2
c = c.replace("  const [saveStatus, setSaveStatus] = useState('')", ''); // first removal
c = c.replace("  const [saveStatus, setSaveStatus] = useState('')", ''); // second removal

// Remove leftover empty lines
c = c.split('\n').filter(l => l.trim() !== '' || !l.trim().startsWith('const [saveStatus')).join('\n');

fs.writeFileSync(path, c);
console.log('Done');
