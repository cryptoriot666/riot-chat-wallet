const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Add error boundary around verification panel
const oldRender = "      {showVerificationPanel && connected && (\n            <div style={{\n              width: '280px',\n              minWidth: '280px',";
const newRender = "      {showVerificationPanel && connected && (() => {\n        try {\n          return (<div style={{\n              width: '280px',\n              minWidth: '280px',";

if (c.includes(oldRender)) {
  c = c.replace(oldRender, newRender);
  
  // Find the closing and wrap with error boundary
  const oldClose = "          </div>\n        )}\n        </div>\n      )}\n\n      {/* CSS Animations */}";
  const newClose = "          </div>\n        );\n        } catch(e) {\n          console.error('Verify panel error:', e);\n          return <div style={{padding:'20px',color:'#ff4444',fontSize:'12px'}}>Panel Error: {e.message}</div>;\n        }\n      })()}\n        </div>\n      )}\n\n      {/* CSS Animations */}";
  
  if (c.includes(oldClose)) {
    c = c.replace(oldClose, newClose);
    fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
    console.log('Error boundary patched!');
  } else {
    console.log('Close NOT found');
    const cssIdx = c.indexOf('CSS Animations');
    console.log('Before CSS:', JSON.stringify(c.slice(cssIdx-80, cssIdx-1)));
  }
} else {
  console.log('Render NOT found');
  const vsIdx = c.indexOf('showVerificationPanel');
  console.log('Found showVerificationPanel at:', vsIdx);
  console.log('Context:', c.slice(vsIdx, vsIdx+150));
}
