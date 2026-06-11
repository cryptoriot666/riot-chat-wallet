const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// ==========================================
// Insert a flex row wrapper around sidebar + center
// ==========================================

// Find the exact insertion points using unique markers
const openMarker = '      {/* MemWal Memory Search Panel */}';
const closeMarker = '      {/* CSS Animations + Toast Animations */}';

const openIdx = app.indexOf(openMarker);
const closeIdx = app.indexOf(closeMarker);

if (openIdx === -1 || closeIdx === -1) {
  console.error(`❌ Markers not found. open=$openIdx close=$closeIdx`);
  process.exit(1);
}

console.log(`openMarker at char ${openIdx}`);
console.log(`closeMarker at char ${closeIdx}`);

// Insert open wrapper BEFORE the openMarker
const wrapperOpen = '\n      <div style={{ display: \'flex\', flexDirection: \'row\', flex: 1, overflow: \'hidden\', height: \'100vh\' }}>\n';
app = app.slice(0, openIdx) + wrapperOpen + openMarker + app.slice(openIdx + openMarker.length);

// Insert close wrapper AFTER the end of center (BEFORE the closeMarker)
const wrapperClose = '\n      </div>\n';
// closeIdx is now shifted by wrapperOpen.length
const adjustedCloseIdx = app.indexOf(closeMarker);
app = app.slice(0, adjustedCloseIdx) + wrapperClose + app.slice(adjustedCloseIdx);

// Verify
const openCount = (app.match(/flexDirection: 'row'/g) || []).length;
const closeBeforeCss = app.indexOf('</div>\n\n      {/* CSS Animations');
console.log(`Flex row containers: ${openCount}`);
console.log(`Close before CSS at char: ${closeBeforeCss}`);

if (openCount === 1 && closeBeforeCss > 0) {
  fs.writeFileSync(filePath, app, 'utf8');
  console.log('✅ Written successfully');
  
  // Quick syntax check by counting JSX structural elements
  const openAngles = (app.match(/<div /g) || []).length;
  const closeAngles = (app.match(/<\/div>/g) || []).length;
  console.log(`<div>: ${openAngles}, </div>: ${closeAngles}, diff=${openAngles - closeAngles}`);
} else {
  console.error('❌ Verification failed');
  process.exit(1);
}
