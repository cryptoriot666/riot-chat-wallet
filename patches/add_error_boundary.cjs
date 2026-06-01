const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Add ErrorBoundary component INLINE after the three widget functions
// Find the EncryptModal function end and the App function start
const encEndIdx = c.indexOf('export default function App');
const inlineStart = c.indexOf('function TaskTracker');
const appStart = c.indexOf('export default function App');

// Add ErrorBoundary component
const errBound = `\n\nclass ErrorBoundary extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = { hasError: false, error: null };\n  }\n  static getDerivedStateFromError(error) {\n    return { hasError: true, error };\n  }\n  componentDidCatch(error, info) {\n    console.error('ErrorBoundary caught:', error, info);\n  }\n  render() {\n    if (this.state.hasError) {\n      return React.createElement('div', { style: { padding: '20px', color: '#ff4444', fontSize: '12px', fontFamily: 'monospace' } },\n        'Error: ' + (this.state.error?.message || 'Unknown'));\n    }\n    return this.props.children;\n  }\n}\n`;

c = c.slice(0, appStart) + errBound + c.slice(appStart);

// Now wrap the verification panel in ErrorBoundary
// Find the exact render
const oldPanel = `{showVerificationPanel && connected && (
        <div style={{`;

const newPanel = `{showVerificationPanel && connected && (
        React.createElement(ErrorBoundary, null,
        <div style={{`;

if (c.includes(oldPanel)) {
  c = c.replace(oldPanel, newPanel);
  
  // Close ErrorBoundary after the last JSX close
  const oldClose = `          </div>
        )}
        </div>
      )}`;
  const newClose = `          </div>
        )}
        </div>
      ),)}
      {/* Note: ErrorBoundary closes above */}`;
  
  if (c.includes(oldClose)) {
    c = c.replace(oldClose, newClose);
    console.log('ErrorBoundary wrapped!');
  } else {
    // Try CRLF
    const oldCloseCR = `          </div>\r\n        )}\r\n        </div>\r\n      )}`;
    const newCloseCR = `          </div>\r\n        )}\r\n        </div>\r\n      ),)}\r\n      {/* Note: ErrorBoundary closes above */}`;
    if (c.includes(oldCloseCR)) {
      c = c.replace(oldCloseCR, newCloseCR);
      console.log('ErrorBoundary wrapped CRLF!');
    }
  }
  
  fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
  console.log('Written!');
} else {
  console.log('Panel NOT found');
  // Try CRLF  
  const oldPanelCR = `{showVerificationPanel && connected && (\r\n        <div style={{`;
  if (c.includes(oldPanelCR)) {
    c = c.replace(oldPanelCR, `{showVerificationPanel && connected && (\r\n        React.createElement(ErrorBoundary, null,\r\n        <div style={{`);
    const oldCloseCR = `          </div>\r\n        )}\r\n        </div>\r\n      )}`;
    const newCloseCR = `          </div>\r\n        )}\r\n        </div>\r\n      ),)}\r\n      {/* ErrorBoundary close */}`;
    if (c.includes(oldCloseCR)) {
      c = c.replace(oldCloseCR, newCloseCR);
      fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
      console.log('Patched with ErrorBoundary CRLF!');
    } else {
      console.log('Close NOT found after panel CRLF');
    }
  } else {
    console.log('Panel CRLF NOT found both');
    const idx = c.indexOf('showVerificationPanel && connected &&');
    if (idx >= 0) {
      const c20 = c.slice(idx, idx+60);
      console.log('Found:', JSON.stringify(c20));
    }
  }
}
