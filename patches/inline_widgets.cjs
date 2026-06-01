const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// Hapus import widgets
c = c.replace("import { TaskTracker, DraftWriter, WidgetTabs, EncryptModal } from './widgets.jsx'\n", '');

// Baca widget file, ekstrak definitions
const w = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/widgets.jsx', 'utf8');
// Remove the import at top
let inline = w.replace("import { useState, useEffect, useRef } from 'react'", '');
// Remove export keywords
inline = inline.replace(/export function /g, 'function ');
inline = inline.replace(/export const /g, 'const ');
// Remove TAB_STYLE (unused inline)
inline = inline.replace(/const TAB_STYLE = \(active\) => \(\{[^}]+\}\)\n\nconst ACTIVE_TAB_STYLE = \{ \.\.\.TAB_STYLE\(true\) \}\nconst INACTIVE_TAB_STYLE = \{ \.\.\.TAB_STYLE\(false\) \}\n\n/, '');
// Inject before handleEncryptEnable
c = c.replace('  const handleEncryptEnable', inline + '\n  const handleEncryptEnable');

fs.writeFileSync(p, c);
console.log('Done. Length:', c.length);
