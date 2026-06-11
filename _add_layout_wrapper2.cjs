const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// The KEY INSIGHT: MemWal Memory Search Panel appears first at JSX line ~2395
// But there's a `function memwalAnalyze` at line ~126 that also contains "MemWal"
// We need the SECOND occurrence of "MemWal" which is the JSX comment

// Strategy: Find the JSX occurrence by looking for "MemWal Memory Search Panel"
// AFTER a known marker like "showProfileSettings" which is before the sidebar

const sidebarComment = "MemWal Memory Search Panel";
const sidebarDivIdx = app.indexOf(sidebarComment);
if (sidebarDivIdx < 0) {
  console.log('❌ sidebar comment not found');
  process.exit(1);
}
console.log(`sidebar comment at char ${sidebarDivIdx}`);

// The sidebar comment is at:      {/* MemWal Memory Search Panel */}
// Then:                           {/* LEFT SIDEBAR - PUNK STYLED */}
// Then:                           <div style={{width: isMobile...}}>
// ...sidebar children...  (Wallet, API, Memory Status, Agent Info, Agent List)
// Then:                           </div>   ← closes sidebar wrapper
// Then:                           {/* CENTER: CHAT - PUNK STYLED */}
// ...center content... (landing or chat interface)
// Then:                           {/* CSS Animations + Toast Animations */}
//                                  <style>...

// What we need:
// Before:   sidebarComment  → sidebar div → ... → </div> (sidebar) → {center} → <style>
// After:    <flexwrapper>   → sidebarComment → sidebar div → ... → </div> (sidebar) → {center} → </flexwrapper> → <style>

// Step 1: Insert wrapper open BEFORE the sidebar comment line
// Find the beginning of the line containing sidebarComment
const sidebarLineStart = sidebarDivIdx;
// Go back to start of this line
let lineStart = app.lastIndexOf('\n', sidebarDivIdx);
if (lineStart < 0) lineStart = 0;

const wrapperOpenTag = '      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100vh" }}>\n';
app = app.substring(0, lineStart) + '\n' + wrapperOpenTag + app.substring(lineStart + 1); // +1 to skip \n at lineStart

console.log('✅ Inserted wrapper open tag');

// Step 2: Find the CSS Animations comment and insert wrapper close before it
const cssAnimIdx = app.indexOf("CSS Animations + Toast Animations");
if (cssAnimIdx < 0) {
  console.log('❌ CSS Animations comment not found');
  process.exit(1);
}
console.log(`CSS Animations at char ${cssAnimIdx}`);

// Go back to beginning of the line containing this comment
const cssLineStart = app.lastIndexOf('\n', cssAnimIdx - 10) + 1;

const wrapperCloseTag = '      </div>\n\n';
app = app.substring(0, cssLineStart) + wrapperCloseTag + app.substring(cssLineStart);

console.log('✅ Inserted wrapper close tag before CSS Animations');

// Verify: count the wrapper tags
const openCount = (app.match(/display: "flex", flex: 1/g) || []).length;
const closeCount = (app.match(/<\/div>\n\n      \/\* CSS/g) || []).length;
console.log(`\nWrapper open tags: ${openCount}`);
console.log(`Wrapper close tags: ${closeCount}`);

if (openCount === 1 && closeCount === 1) {
  fs.writeFileSync(filePath, app, 'utf8');
  console.log('✅ Written successfully');
} else {
  console.log('❌ Mismatch - check manually');
}
