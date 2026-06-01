const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

const old = '      </div>\n      )}\n        </div>\n      )}\n        </div>\n      )}\n      {/*';
const newClose = '      </div>\n      )}\n        </div>\n      )}\n      {/*';

if (c.includes(old)) {
  c = c.replace(old, newClose);
  fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
  console.log('Fixed - net 0');
} else {
  // Try CRLF
  const old2 = '      </div>\r\n      )}\r\n        </div>\r\n      )}\r\n        </div>\r\n      )}\r\n      {/*';
  if (c.includes(old2)) {
    const newClose2 = '      </div>\r\n      )}\r\n        </div>\r\n      )}\r\n      {/*';
    c = c.replace(old2, newClose2);
    fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
    console.log('Fixed CRLF - net 0');
  } else {
    console.log('NOT FOUND');
  }
}
