const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Find the blob section closing and everything after
const blobClose = 'WALRUS_AGGREGATOR}/v1/blobs/${latestBlobId}`}';
const blobIdx = c.indexOf(blobClose);
console.log('Blob link found at:', blobIdx);

// Find the CSS Animations comment
const cssIdx = c.indexOf('CSS Animations');
console.log('CSS Animations at:', cssIdx);

// Everything between blob link close and CSS Animations
const gap = c.slice(blobIdx + blobClose.length, cssIdx);
console.log('Gap between blob link and CSS Animations:');
console.log(JSON.stringify(gap));

// Count divs in that gap
const o = (gap.match(/<div[^>]*>/g) || []).length;
const l = (gap.match(/<\/div>/g) || []).length;
console.log('Divs in gap:', o, 'open,', l, 'close, net:', o - l);

// Also count )} in gap
const jsxClose = (gap.match(/\)}/g) || []).length;
console.log(')} closings:', jsxClose);
