const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');
const old = '          </div>\n        )}\n        </div>\n      )}\n\n      {/*';
const newClose = '          </div>\n        )}\n        </div>\n      )}\n      </div>\n      )}\n        </div>\n      )}\n        </div>\n      )}\n      {/*';
if (c.includes(old)) {
  c = c.replace(old, newClose);
  fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
  console.log('Patched!');
} else {
  console.log('NOT FOUND');
  // Try with \r\n
  const old2 = '          </div>\r\n        )}\r\n        </div>\r\n      )}\r\n\r\n      {/*';
  if (c.includes(old2)) {
    const newClose2 = '          </div>\r\n        )}\r\n        </div>\r\n      )}\r\n      </div>\r\n      )}\r\n        </div>\r\n      )}\r\n        </div>\r\n      )}\r\n      {/*';
    c = c.replace(old2, newClose2);
    fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
    console.log('Patched with CRLF!');
  } else {
    console.log('Still NOT FOUND. Checking actual text...');
    const cssIdx = c.indexOf('CSS Animations');
    console.log('Before CSS:', JSON.stringify(c.slice(cssIdx-100, cssIdx-1)));
  }
}
