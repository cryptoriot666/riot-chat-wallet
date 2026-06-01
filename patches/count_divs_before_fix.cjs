const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// The 'CSS Animations' section is after the closing issue
const cssIdx = c.indexOf('CSS Animations');
const before = c.slice(0, cssIdx);
const after = c.slice(cssIdx);

// Count divs in the closing section before CSS Animations
const s = before.lastIndexOf('showVerificationPanel && connected && (');
const verifyStart = before.indexOf('RIGHT: VERIFICATION PANEL');
const verifySection = before.slice(verifyStart);
const vo = (verifySection.match(/<div[^>]*>/g) || []).length;
const vl = (verifySection.match(/<\/div>/g) || []).length;
console.log('Verification section divs:', vo, '-', vl, '=', vo - vl);

// The current closing is:
//           </div>
//         )}
//         </div>
//       )}
//
//      {/* CSS Animations

// We need to add 6 more closing divs + )} 
// Look at the current closing block
const currentClose = before.slice(-100);
console.log('Current closing block:');
console.log(currentClose);

// Let's see what needs closing: 
// 1. widgetTab === 'verify' && (<div> — needs </div>)}
// 2. showVerificationPanel && (<div> — needs </div>)}
// 3. {showVerificationPanel && connected && (<div> — needs </div>)}
// Plus some extra divs inside those sections
// For now: add </div>)}</div>)}</div>)} after blobs section
