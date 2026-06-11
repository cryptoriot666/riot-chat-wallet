const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// ============================================
// MOVE 1: Add agent info section to sidebar
// Insert after Memory Status block, before Agent List
// ============================================

const sidebarInsertPoint = `        {/* Agent List - THE 25 LIVING PROOFS */}`;

const agentInfoSidebar = `        {/* Selected Agent Info */}
        {selectedAgent && (
          <div style={{
            padding: '12px 15px',
            margin: '0 10px 8px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${selectedAgent?.color}44`,
            borderRadius: '10px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ position: 'relative' }}>
                <img src={selectedAgent?.img} alt={selectedAgent?.id} onError={(e)=>{e.target.style.display="none";e.target.nextSibling.style.display="flex"}} style={{
                  width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover',
                  border: `2px solid ${selectedAgent?.color}88`,
                  boxShadow: `0 0 15px ${selectedAgent?.color}44`
                }} onError={(e) => { e.target.style.display = 'none' }} />
                <div style={{
                  position: 'absolute', bottom: '-3px', right: '-3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: selectedAgent?.color,
                  border: `2px solid #0d0a07`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '6px', fontWeight: 800, color: '#000',
                  fontFamily: "'Rubik Mono One', sans-serif",
                  boxShadow: `0 0 8px ${selectedAgent?.color}`
                }}>{selectedAgent?.id?.slice(1)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700, color: '#fff',
                  fontFamily: "'Rubik Glitch', cursive",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  textShadow: `0 0 8px ${selectedAgent?.color}44`
                }}>{selectedAgent.name} — AWAKENED</div>
                <div style={{
                  fontSize: '9px', color: '#a08060', marginTop: '2px',
                  fontFamily: "'Rubik Mono One', sans-serif", letterSpacing: '0.3px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{selectedAgent.trait.toUpperCase()} · {selectedAgent.desc}</div>
                <div style={{
                  fontSize: '8px', color: '#6a5040', marginTop: '1px',
                  fontFamily: "'Inter', sans-serif"
                }}>{selectedAgent.emoji} {selectedAgent.specialty}</div>
              </div>
            </div>
            {/* MCP Skill Badges */}
            {MCP_SKILL_MAP[selectedAgent?.id] && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {MCP_SKILL_MAP[selectedAgent.id].skills.map(skill => (
                  <span key={skill} style={{
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '7px',
                    fontFamily: "'Rubik Mono One', sans-serif",
                    background: `${SKILL_COLORS[skill] || SKILL_COLORS.default}22`,
                    border: `1px solid ${SKILL_COLORS[skill] || SKILL_COLORS.default}44`,
                    color: SKILL_COLORS[skill] || SKILL_COLORS.default,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>{skill.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
            <div style={{ marginTop: '6px' }}>
              <CrossAgentIndicator
                agentCount={agentCount}
                visitedAgents={crossAgentVisited}
                currentAgentId={selectedAgent?.id}
              />
            </div>
          </div>
        )}

        {/* Agent List - THE 25 LIVING PROOFS */}`;

if (app.includes(sidebarInsertPoint) && !app.includes('Selected Agent Info')) {
  app = app.replace(sidebarInsertPoint, agentInfoSidebar);
  console.log('✅ Added agent info section to sidebar');
} else {
  console.log('❌ Sidebar insert point not found or already added');
}

// ============================================
// MOVE 2: Remove agent info from chat header
// Replace the entire left side of the header with empty
// ============================================

// The left side of header starts at:
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
// with agent avatar, name, etc.
// 
// It closes at:
//           </div>
// (just before the right side div)
//
// We need to remove everything from the FIRST gap:15px container opening to just before the SECOND gap:15px container
// The first one is agent info, the second one is buttons

// Find the SECOND container 
const allContainers = [];
let searchIdx = 0;
while ((searchIdx = app.indexOf("gap: '15px'", searchIdx + 1)) !== -1) {
  allContainers.push(searchIdx);
}

console.log(`\nFound ${allContainers.length} containers with gap:15px`);
allContainers.forEach((c, i) => console.log(`  Container ${i + 1}: char ${c}`));

// The first gap:15px in the header is the agent info left side
// The second is the buttons right side
if (allContainers.length >= 2) {
  const firstContainer = allContainers[0];
  const secondContainer = allContainers[1];
  
  // Find the opening <div of the first container
  const firstOpen = app.lastIndexOf('<div', firstContainer);
  console.log(`\nFirst container opens at char ${firstOpen}`);
  
  // The first container is the left side (agent info)
  // It closes with </div> somewhere before the second container
  // The structure is:
  // <div...gap:15px>   ← firstOpen
  //   ...agent info...
  // </div>             ← close first container
  // (blank)
  // <div...gap:15px>   ← secondContainer (right side, buttons)
  
  // Find the </div> that closes the first container
  // It's the one right before the second container
  const betweenDivs = app.substring(firstOpen, secondContainer);
  const closeIdx = betweenDivs.lastIndexOf('</div>');
  const firstClose = firstOpen + closeIdx + 6; // 6 = len('</div>')
  console.log(`First container closes at char ${firstClose}`);
  
  // Now extract the section to remove (from firstOpen to firstClose inclusive)
  const removeSection = app.substring(firstOpen, firstClose);
  console.log(`\nSection to remove (${removeSection.length} chars):`);
  console.log(removeSection.substring(0, 100) + '...');
  
  // Replace it with nothing (remove entirely)
  app = app.substring(0, firstOpen) + app.substring(firstClose);
  console.log('✅ Removed agent info from chat header');
}

// ============================================
// MOVE 3: Fix the header structure to be minimal
// The header should now just have the buttons with no border/full padding
// ============================================

// After removing the left side, we should still have the header wrapping div
// with borderBottom. Let's make the header minimal
// 
// After removal, the header should look like:
// <div style={{ padding: '10px 30px', ... }}>
//   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//     {/* WALRUS SAVE... */}
//   </div>
// </div>

// The header wrapping div currently has padding: '20px 30px'
// Make it smaller now that it only has buttons
const oldPadding = "padding: '20px 30px',";
const newPadding = "padding: '12px 30px',";

// But only replace within the chat header context (not the entire file)
// Find the first occurrence in the chat header section
const chatHeaderIdx = app.indexOf("/* CHAT INTERFACE - Agent selected */");
if (chatHeaderIdx > 0) {
  const headerSubstr = app.substring(chatHeaderIdx, chatHeaderIdx + 2000);
  if (headerSubstr.includes(oldPadding)) {
    // Only replace the first occurrence in this section
    const localIdx = app.indexOf(oldPadding, chatHeaderIdx);
    if (localIdx > 0 && localIdx < chatHeaderIdx + 2000) {
      app = app.substring(0, localIdx) + newPadding + app.substring(localIdx + oldPadding.length);
      console.log('✅ Reduced header padding for minimal layout');
    }
  }
}

// Write
fs.writeFileSync(filePath, app, 'utf8');
console.log('\n✅ All changes applied');
