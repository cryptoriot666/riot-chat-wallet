const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// ============================================
// The Problem:
// Sidebar and Center are siblings at root level of return().
// They need to be wrapped in a display:flex;flexDirection:'row' container
// so they sit side-by-side instead of stacking vertically.
//
// Current structure (simplified):
//   <Modal />
//   <TopNavbar fixed />
//   <button>Mobile toggle</button>
//   <div width:280px>LEFT SIDEBAR</div>     ← sidebar closes at line ~2673
//   {/* CENTER: CHAT */}                     ← center starts at line ~2673
//   <style>
//
// Target structure:
//   <Modal />
//   <TopNavbar fixed />
//   <button>Mobile toggle</button>
//   <div style={{display:'flex', flexDirection:'row', flex:1, overflow:'hidden'}}>
//     <div width:280px>LEFT SIDEBAR</div>
//     {/* CENTER: CHAT */}
//   </div>
//   <style>
// ============================================

// The MemWal panel is rendered right before LEFT SIDEBAR
// and is part of the sidebar structure. Let's wrap from the MemWal comment
// to just before CENTER (so sidebar+center are wrapped together).

// Since the MemWal panel is actually inside the LEFT SIDEBAR div structure,
// we need to find the right boundary.

// Find the sidebar div start (the line with "width: isMobile")
const sidebarDivStart = app.indexOf("LEFT SIDEBAR - PUNK STYLED");
const sideline = app.substring(0, sidebarDivStart).split('\n').length;
console.log(`LEFT SIDEBAR comment at line ${sideline}`);

// The sidebar div opens as: <div style={{width: isMobile...}}>
// This div's opening tag starts right after the comment

// Find the CENTER comment
const centerComment = app.indexOf("CENTER: CHAT - PUNK STYLED");
const centerLine = app.substring(0, centerComment).split('\n').length;
console.log(`CENTER comment at line ${centerLine}`);

// Find what's right before CENTER - should be </div> (sidebar close)
const beforeCenter = app.substring(centerComment - 100, centerComment);
console.log(`Before CENTER:\n${beforeCenter}`);

// The </div> right before CENTER closes the sidebar div
// We need to insert a wrapper div between them

// Strategy:
// 1. Find the opening of the layout wrapper (after mobile toggle button
//    and MemWal Memory Search Panel comment)
// 2. Insert <div style={{display:'flex',flex:1,overflow:'hidden',height:'100vh'}}>
//    before the sidebar starts
// 3. Insert </div> after the center column ends

// The sidebar starts at the MemWal comment line (or the LEFT SIDEBAR comment)
// Actually, let's look more carefully at the MemWal panel:
//   {/* MemWal Memory Search Panel */}
//   {/* LEFT SIDEBAR - PUNK STYLED */}
//   <div style={{width: isMobile...}}>
//     ...
//   </div>   ← closes sidebar content

// Wait — the MemWal panel line 2395 is just a comment. Then LEFT SIDEBAR comment line 2396.
// Then <div...>. So the panels under MemWal are part of sidebar.

// Actually let me check if MemWal opens a div too:
const memwalComment = app.indexOf("MemWal Memory Search Panel");
const memwalContext = app.substring(memwalComment, memwalComment + 300);
console.log(`\nMemWal context:\n${memwalContext.substring(0, 150)}`);

// Let me just add the wrapper INSIDE the return statement.
// The sidebar starts at the MemWal comment line.
// The center ends before the CSS <style> tag.

// Find the CSS and Toast Animations comment
const cssAnim = app.indexOf("CSS Animations + Toast Animations");
const cssLine = app.substring(0, cssAnim).split('\n').length;
console.log(`\nCSS Animations at line ${cssLine}`);

// The structure now will be:
// <Modal/>
// <TopNavbar/>
// <button/> mobile toggle
// <MainLayout>        ← INSERT THIS
//   {/* MemWal */}
//   {/* SIDEBAR */}
//   <div sidebar>...</div>
//   {/* CENTER */}
//   {selectedAgent ? ... : ...}
// </MainLayout>       ← INSERT THIS
// <style/>

// To find the exact insertion point, let's find what's after MemWal comment
// and before sidebar div

// Actually, simpler approach: the MemWal search panel is a separate div
// that ALSO needs to be in the sidebar layout. Let's just wrap from
// the MemWal Memory Search Panel comment through the entire sidebar+center.

// The sidebar (including MemWal) goes from line 2395 to line 2673
// Center goes from line 2673 to line ~3281

// Since there might be other siblings I'm missing, let's use the exact text boundary.

// The opening wrapper goes between the mobile toggle button and MemWal comment
// The closing wrapper goes between the end of CENTER and the CSS style tag

// Let me find exact text
const memwalIdx = app.indexOf("MemWal Memory Search Panel");
const sidebarCloseIdx = app.indexOf("</div>", app.indexOf("CENTER: CHAT") - 50);
const centerEndIdx = app.indexOf("CSS Animations + Toast Animations");

// But center also needs its closing. Let me find all </div> that close the center
// The center structure: 
//   {/* CENTER: CHAT */}
//   {!selectedAgent ? ... : ( <> ... </> )}
// Wait, the indent shows it's not wrapped in a div - it's just a ternary inside { }

// Look at what's between CENTER comment and the actual content:
const afterCenterComment = app.substring(centerComment, centerComment + 200);
console.log(`\nAfter CENTER comment:\n${afterCenterComment}`);

// The center is: 
//       {/* CENTER: CHAT - PUNK STYLED */}
//                   {!selectedAgent ? (
//                     <div...landing...</div>
//                   ) : (
//             <>
//               {/* Chat Header */}
//               ...messages...input...
//             </>
//                   )}
// So it's all one React expression ending with )}

// To find where center ends, look for the unique pattern:
// the inner chat interface (the false branch of the ternary) ends with )}
// followed by the closing of the outer expression

// Let me find the last )} that belongs to the center ternary
// The center spans from line 2673 to about line 3278
// After the chat interface, there's: )}        </div>       )}        </div>       )}  

// These close: ternary, landing div false branch, the true branch wrapper
// Let me just search for the right pattern

// Check what's between center end and CSS:
const endZone = app.substring(centerEndIdx - 200, centerEndIdx);
console.log(`\nBefore CSS Animations:\n${endZone}`);

// The safe wrapping approach: 
// Insert open wrapper right after mobile toggle button, before MemWal comment
// Close wrapper right before CSS Animations

// But we need to make sure the structure is valid. The navbar and mobile toggle
// are siblings before sidebar. The CSS/style is after center.

// Since the return statement has multiple children:
// <div modal>
// <div navbar>
// <button>mobile</button>
// <div sidebar>...</div>
// {/* center */} {!selectedAgent ? ... : ...}
// <style>

// We need: 
// <div modal>
// <div navbar>
// <button>mobile</button>
// <div style={{display:'flex',height:'100vh'}}>
//   <div sidebar>...</div>
//   {/* center */} {!selectedAgent ? ... : ...}
// </div>
// <style>

// Find position: between mobile toggle button's </> and MemWal comment
// Let me find the exact insertion point

// The mobile toggle button closes with: </button> followed by blank lines
// Then Walrus Save Modal, then EncryptModal, then Name Ask Modal, etc.
// Then ProfileSettingsPanel, then MemWal Memory Search Panel.

// I need to wrap from MemWal comment (or better: right before MemWal comment)
// all the way to before CSS Animations

const afterMobButton = app.indexOf("</button>", app.indexOf("sidebarOpen(!sidebarOpen)"));
const insertOpenIdx = app.indexOf("MemWal", app.indexOf("</button>", afterMobButton - 10));
if (insertOpenIdx > 0) {
  // Go back to the beginning of the line
  const lineStart = app.lastIndexOf('\n', insertOpenIdx - 50) + 1;
  console.log(`\nFound insertion point at char ${insertOpenIdx}, line start at ${lineStart}`);
  console.log(`Context: '${app.substring(lineStart, lineStart + 60).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`);
  
  // Insert the opening wrapper div
  const wrapperOpen = '      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100vh" }}>\n';
  app = app.substring(0, lineStart) + wrapperOpen + app.substring(lineStart);
  
  // Now close it before the CSS Animations
  const cssIdx = app.indexOf("CSS Animations + Toast Animations");
  // Go to the beginning of that line
  const cssLineStart = app.lastIndexOf('\n', cssIdx - 10) + 1;
  
  const wrapperClose = '      </div>\n';
  app = app.substring(0, cssLineStart) + wrapperClose + app.substring(cssLineStart);
  
  console.log('✅ Wrapped sidebar + center in flex row container');
  console.log(`   Open wrapper inserted at char ${lineStart}`);
  console.log(`   Close wrapper inserted at char ${cssLineStart}`);
  
  fs.writeFileSync(filePath, app, 'utf8');
  console.log('✅ Written');
} else {
  console.log('❌ Could not find insertion point');
}
