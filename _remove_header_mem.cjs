const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// ===========================================
// TARGET: Find the SECOND gap:15px flex container and remove Memory Status block
// ===========================================

// The header has TWO flex containers with gap:15px
// 1st: Agent avatar + info (LEFT side) - keep as is
// 2nd: Memory Status + Buttons (RIGHT side) - remove Memory Status, keep buttons

// Strategy: 
// 1. Find all occurrences of the container div pattern
// 2. The second one is the one we need to modify
// 3. Remove the Memory Status block from within it

const containerPattern = 'gap: \\'15px\\'';

// Find all occurrences
let idx = -1;
const positions = [];
while ((idx = app.indexOf("gap: '15px'", idx + 1)) !== -1) {
  positions.push(idx);
}
console.log(`Found ${positions.length} containers with gap:15px`);

if (positions.length >= 2) {
  // The second container is the one with Memory Status + Buttons
  const containerIdx = positions[1];
  
  // Go back to find the opening tag
  const openDiv = app.lastIndexOf('<div style={{', containerIdx);
  console.log(`Container opens at char ${openDiv}`);
  
  // Find the Memory Status comment within this container
  const memComment = app.indexOf('{/* Memory Status */}', openDiv);
  console.log(`Memory Status comment at char ${memComment}`);
  
  // Find the buttons comment
  const buttonsComment = app.indexOf('{/* WALRUS SAVE + IMMORTALIZE BUTTONS */}', openDiv);
  console.log(`Buttons comment at char ${buttonsComment}`);
  
  // Now extract the Memory Status block
  // From memComment to just before buttonsComment (including the blank line)
  const memBlockStart = memComment;
  const memBlockEnd = buttonsComment;
  
  console.log(`\nMemory Status block length: ${memBlockEnd - memBlockStart} chars`);
  
  // Extract the memory block text
  const memBlock = app.substring(memBlockStart, memBlockEnd);
  console.log(`Memory block preview:`);
  console.log(memBlock.substring(0, 200));
  console.log('...');
  console.log(memBlock.substring(memBlock.length - 100));
  
  // Replace: remove the Memory Status block
  // The block starts with `            {/* Memory Status */}\n` and ends just before `\n            {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}`
  // After removal, we'll have the buttons comment right after the container opening
  // 
  // Before: <div...gap:15px>  \n  Memory Status block \n  \n  Buttons block \n</div>
  // After:  <div...gap:15px>  \n  Buttons block \n</div>
  
  app = app.substring(0, memBlockStart) + app.substring(memBlockEnd);
  
  console.log('\n✅ Memory Status block removed from header');
  
  // Verify: find the second container again
  const newIdx = app.indexOf("gap: '15px'");
  const newIdx2 = app.indexOf("gap: '15px'", newIdx + 1);
  if (newIdx2 > 0) {
    const containerAfter = app.substring(newIdx2 - 50, newIdx2 + 400);
    console.log(`\nSecond container after fix:`);
    console.log(containerAfter);
  }
  
  fs.writeFileSync(filePath, app, 'utf8');
  console.log('\n✅ Written');
} else {
  console.log('❌ Could not find second container');
}
