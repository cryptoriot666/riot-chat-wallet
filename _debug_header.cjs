const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// The issue: there are TWO flex containers with 'gap: 15px'
// First at line 2712 (agent avatar info - left side) 
// Second at line 2766 (memory status + buttons - right side)
// We need to target the SECOND one and pull the buttons out.

// Strategy: Find the SECOND occurrence of the Memory Status comment
// and replace everything from its containing div opening to the closing div

// Find "Memory Status" - there should be only one now (sidebar uses "Memory Status — Soul Stats")
const memStatusIdx = app.indexOf('{/* Memory Status */}');
if (memStatusIdx === -1) {
  console.log('❌ Memory Status comment not found');
  process.exit(1);
}

console.log(`Found "Memory Status" comment at char ${memStatusIdx}`);

// Go backwards to find the containing <div
const containerStart = app.lastIndexOf('<div style={{', memStatusIdx);
console.log(`Container div starts at char ${containerStart}`);
const containerLine = app.substring(memStatusIdx - 200, memStatusIdx + 50);
console.log(`Context before: ${containerLine}`);

// Go forward to find the closing of WALRUS SAVE section
// After Memory Status div closes, then there's WALRUS SAVE + buttons, then </div> closes the container
const buttonsIdx = app.indexOf('{/* WALRUS SAVE + IMMORTALIZE BUTTONS */}', memStatusIdx);
console.log(`Buttons section at char ${buttonsIdx}`);

// Find the </div> that closes the container - after the buttons section
const afterButtons = app.substring(buttonsIdx);
// Count div nesting to find the correct closing </div>
// The container is: <div> {MemoryStatus} \n\n {/*Buttons*/} \n ... </div>
// The buttons include their own <div> which gets closed inside
// So we just need the first </div> after the buttons section that's at the right indentation

// Actually simpler: replace the exact structure using index ranges
// The container div opens with:           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//   followed by Memory Status comment + block + blank + buttons comment + buttons block
// Then closes with:                       </div>

// Let's find the exact container text that starts BEFORE Memory Status
// Find the line with the container opening
const preSection = app.substring(containerStart, memStatusIdx);
console.log(`\nPre-section (${preSection.length} chars):`);
console.log(preSection);

// The container opening should be the last '<div style="' before Memory Status
// Find it in the original app
const containerOpenIdx = app.lastIndexOf(`          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>`, memStatusIdx);
console.log(`\nContainer opening at char ${containerOpenIdx}`);

if (containerOpenIdx > 0) {
  // Now we need to find where this container closes.
  // The buttons section ends with its own </div> (closing the buttons container)
  // Then there's another </div> closing the main container
  // The pattern after buttons should be:
  //   </div>       ← closes buttons flex div
  //   )}           ← closes {connected && messages.length >= 2 && (...)}
  //                 (blank line)
  // </div>         ← closes the main container with gap: 15px
  
  // Let's find what comes after the buttons section
  // The buttons div + closing + blank line + container closing div
  const sectionToEnd = app.indexOf('</div>', buttonsIdx + 100);
  if (sectionToEnd > 0) {
    const contextToEnd = app.substring(buttonsIdx, sectionToEnd + 20);
    console.log(`\nAfter buttons (${contextToEnd.length} chars):`);
    console.log(contextToEnd);
    
    // Now construct the replacement:
    // Remove the outer container div and its Memory Status block
    // Keep only the buttons div at the original position
    // The container div opens with:     <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
    // Then Memory Status block + buttons block + closing div
    
    // Find the exact text from containerOpenIdx to where the container closes
    // We need to find the matching </div> for the container
    // The container div: gap: '15px'
    // Inside it: Memory Status (its own div) + buttons (its own div)
    // So we scan: after buttons section, find the second </div> (first closes buttons div, second closes container)
    
    // Let's just match from "Memory Status" comment to the closing of its flex row
    // The exact pattern is:
    //             {/* Memory Status */}
    //             {connected && memory && (<div...big block...></div>)}
    // (blank)
    //             {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}
    // ...buttons...
    //           </div>
    //           )}     ← This closes the {messages.length >= 2 && ...}
    // (blank)
    //         </div>   ← This is the flex container closing
    
    // Actually, let's look at the structure after buttons more carefully
    const remaining = app.substring(buttonsIdx, buttonsIdx + 800);
    console.log(`\n\n=== 800 chars after buttons ===`);
    console.log(remaining);
  }
}

// OK, let's check what's at the end of the WALRUS SAVE section
// in the remaining code
const fullEnd = app.substring(buttonsIdx, buttonsIdx + 1000);
// Find the line numbers
const lineBefore = app.substring(0, buttonsIdx).split('\n').length;
console.log(`\nButtons section starts around line ${lineBefore}`);
const endLines = fullEnd.split('\n');
for (let i = 0; i < Math.min(20, endLines.length); i++) {
  console.log(`${lineBefore + i}: ${endLines[i]}`);
}

// Now let's see after the buttons closing
// The structure should be:
// </div>   ← closes buttons container
// )}       ← closes {connected && ...}
// 
// </div>   ← closes the gap:15px container
// )}       ← closes {moveObjectId && ...} (or whatever wraps this area)

// Count backward from the closing pattern to find where the Memory Status block really ends
