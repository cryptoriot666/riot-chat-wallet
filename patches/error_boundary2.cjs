const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

const oldRender = '{showVerificationPanel && connected && (\n        <div style={{\n          width: \'300px\',\n          background: \'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)\',';
const newRender = '{showVerificationPanel && connected && (() => {\n        try {\n          return (<div style={{\n          width: \'500px\',\n          background: \'linear-gradient(180deg, #0d0a07 0%, #1a1209 100%)\',';

if (c.includes(oldRender)) {
  c = c.replace(oldRender, newRender);
  
  // Now find the closing — 3 })} layers + </div>  
  // The pattern is:
  //           </div>
  //         )}
  //         </div>
  //       )}
  //      {/* CSS Animations
  
  const oldClose = '          </div>\n        )}\n        </div>\n      )}\n\n      {/* CSS Animations */}';
  const newClose = '          </div>\n        );\n        } catch(e) {\n          console.error(\'Verify panel error:\', e);\n          return <div style={{padding:\'20px\',color:\'#ff4444\',fontSize:\'12px\'}}>Panel Error: {e.message}</div>;\n        }\n      })()}\n        </div>\n      )}\n\n      {/* CSS Animations */}';
  
  // Try with CRLF
  const oldCloseCR = '          </div>\r\n        )}\r\n        </div>\r\n      )}\r\n\r\n      {/* CSS Animations */}';
  const newCloseCR = '          </div>\r\n        );\r\n        } catch(e) {\r\n          console.error(\'Verify panel error:\', e);\r\n          return <div style={{padding:\'20px\',color:\'#ff4444\',fontSize:\'12px\'}}>Panel Error: {e.message}</div>;\r\n        }\r\n      })()}\r\n        </div>\r\n      )}\r\n\r\n      {/* CSS Animations */}';
  
  if (c.includes(oldClose)) {
    c = c.replace(oldClose, newClose);
    fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
    console.log('Patched LF!');
  } else if (c.includes(oldCloseCR)) {
    c = c.replace(oldCloseCR, newCloseCR);
    fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
    console.log('Patched CRLF!');
  } else {
    console.log('Close NOT found');
    const cssIdx = c.indexOf('CSS Animations');
    console.log('Before CSS:', JSON.stringify(c.slice(cssIdx-120, cssIdx)));
  }
} else {
  console.log('Render NOT found');
  const idx = c.indexOf('showVerificationPanel && connected && (');
  if (idx >= 0) {
    console.log('Found at', idx, 'next 100:', JSON.stringify(c.slice(idx, idx+200)));
  }
}
