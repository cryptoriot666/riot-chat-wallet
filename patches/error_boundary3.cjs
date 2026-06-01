const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

const oldRender = '{showVerificationPanel && connected && (\r\n        <div style={{\r\n          width: \'300px\',\r\n          background: \'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)\',';

if (!c.includes(oldRender)) {
  console.log('Old EXACT not found. Checking partial...');
  const idx = c.indexOf("width: '300px',\r\n          background: 'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)'");
  if (idx >= 0) {
    console.log('Found at', idx, 'context:', JSON.stringify(c.slice(idx-60, idx+80)));
  }
} else {
  const newRender = '{showVerificationPanelError && connected && (() => {\n        try {\n          return (<div style={{\n          width: \'300px\',\n          background: \'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)\',';
  
  // Also add a new state for showVerificationPanelError
  const stateCheck = 'const [showVerificationPanel, setShowVerificationPanel] = useState(false)';
  if (c.includes(stateCheck)) {
    c = c.replace(stateCheck, 'const [showVerificationPanel, setShowVerificationPanel] = useState(false)\n  const [showVerificationPanelError, setShowVerificationPanelError] = useState(null)');
  }
  
  c = c.replace(oldRender, newRender);
  
  // Replace toggle function
  const toggleCheck = 'setShowVerificationPanel(!showVerificationPanel)';
  if (c.includes(toggleCheck)) {
    c = c.replace("setShowVerificationPanel(!showVerificationPanel)", 'setShowVerificationPanel(!showVerificationPanel); setShowVerificationPanelError(null)');
  }
  
  // Find closing
  const closePattern = '          </div>\r\n        )}\r\n        </div>\r\n      )}\r\n\r\n      {/* CSS Animations */}';
  if (c.includes(closePattern)) {
    const newClose = '          </div>\r\n        );\r\n        } catch(e) {\r\n          console.error(\'Verify panel error:\', e);\r\n          setShowVerificationPanelError(e.message);\r\n          return <div style={{padding:\'20px\',color:\'#ff4444\',fontSize:\'12px\'}}>Panel Error: {e.message}</div>;\r\n        }\r\n      })()}\r\n        </div>\r\n      )}\r\n\r\n      {/* CSS Animations */}';
    c = c.replace(closePattern, newClose);
  }
  
  fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
  console.log('Patched with error boundary!');
}
