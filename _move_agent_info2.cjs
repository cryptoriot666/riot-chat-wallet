const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// ============================================
// MOVE 1: Add agent info section to sidebar
// Insert the agent info block as raw string (avoid template literals)
// ============================================

const agentInfoSidebar = [
  '        {/* Selected Agent Info */}',
  '        {selectedAgent && (',
  '          <div style={{',
  "            padding: '12px 15px',",
  "            margin: '0 10px 8px 10px',",
  "            background: 'rgba(0,0,0,0.3)',",
  "            border: '1px solid ' + selectedAgent?.color + '44',",
  "            borderRadius: '10px'",
  '          }}>',
  '            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>',
  '              <div style={{ position: "relative" }}>',
  "                <img src={selectedAgent?.img} alt={selectedAgent?.id} onError={(e)=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} style={{",
  "                  width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover',",
  "                  border: '2px solid ' + selectedAgent?.color + '88',",
  "                  boxShadow: '0 0 15px ' + selectedAgent?.color + '44'",
  "                }} onError={(e) => { e.target.style.display = 'none' }} />",
  '                <div style={{',
  "                  position: 'absolute', bottom: '-3px', right: '-3px',",
  "                  width: '16px', height: '16px', borderRadius: '50%',",
  '                  background: selectedAgent?.color,',
  "                  border: '2px solid #0d0a07',",
  "                  display: 'flex', alignItems: 'center', justifyContent: 'center',",
  "                  fontSize: '6px', fontWeight: 800, color: '#000',",
  "                  fontFamily: \"'Rubik Mono One', sans-serif\",",
  "                  boxShadow: '0 0 8px ' + selectedAgent?.color",
  "                }}>{selectedAgent?.id?.slice(1)}</div>",
  '              </div>',
  '              <div style={{ flex: 1, minWidth: 0 }}>',
  '                <div style={{',
  "                  fontSize: '14px', fontWeight: 700, color: '#fff',",
  "                  fontFamily: \"'Rubik Glitch', cursive\",",
  "                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',",
  "                  textShadow: '0 0 8px ' + selectedAgent?.color + '44'",
  "                }}>{selectedAgent.name} \u2014 AWAKENED</div>",
  '                <div style={{',
  "                  fontSize: '9px', color: '#a08060', marginTop: '2px',",
  "                  fontFamily: \"'Rubik Mono One', sans-serif\", letterSpacing: '0.3px',",
  "                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'",
  "                }}>{selectedAgent.trait.toUpperCase()} \u00B7 {selectedAgent.desc}</div>",
  '                <div style={{',
  "                  fontSize: '8px', color: '#6a5040', marginTop: '1px',",
  "                  fontFamily: \"'Inter', sans-serif\"",
  "                }}>{selectedAgent.emoji} {selectedAgent.specialty}</div>",
  '              </div>',
  '            </div>',
  '            {/* MCP Skill Badges */}',
  '            {MCP_SKILL_MAP[selectedAgent?.id] && (',
  '              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>',
  '                {MCP_SKILL_MAP[selectedAgent.id].skills.map(skill => (',
  '                  <span key={skill} style={{',
  "                    padding: '1px 5px',",
  "                    borderRadius: '3px',",
  "                    fontSize: '7px',",
  "                    fontFamily: \"'Rubik Mono One', sans-serif\",",
  "                    background: SKILL_COLORS[skill] || SKILL_COLORS.default + '22',",
  "                    border: '1px solid ' + (SKILL_COLORS[skill] || SKILL_COLORS.default) + '44',",
  '                    color: SKILL_COLORS[skill] || SKILL_COLORS.default,',
  "                    textTransform: 'uppercase',",
  "                    letterSpacing: '0.3px'",
  '                  }}>{skill.replace(/_/g, " ")}</span>',
  '                ))}',
  '              </div>',
  '            )}',
  '            <div style={{ marginTop: "6px" }}>',
  '              <CrossAgentIndicator',
  '                agentCount={agentCount}',
  '                visitedAgents={crossAgentVisited}',
  '                currentAgentId={selectedAgent?.id}',
  '              />',
  '            </div>',
  '          </div>',
  '        )}',
  '',
  '        {/* Agent List - THE 25 LIVING PROOFS */}'
].join('\n');

const sidebarInsertPoint = '        {/* Agent List - THE 25 LIVING PROOFS */}';

if (app.includes(sidebarInsertPoint) && !app.includes('Selected Agent Info')) {
  app = app.replace(sidebarInsertPoint, agentInfoSidebar);
  console.log('✅ Added agent info section to sidebar');
} else {
  console.log('❌ Sidebar insertion failed');
  console.log('  Has Selected Agent Info already? ' + app.includes('Selected Agent Info'));
}

// ============================================
// MOVE 2: Remove agent info from chat header
// ============================================

// Find all gap:15px containers
const positions = [];
let idx = -1;
while ((idx = app.indexOf("gap: '15px'", idx + 1)) !== -1) {
  positions.push(idx);
}
console.log(`\nFound ${positions.length} gap:15px containers`);

if (positions.length >= 2) {
  const firstPos = positions[0];
  const secondPos = positions[1];
  
  // Find the opening <div tag for first container
  const firstOpen = app.lastIndexOf('<div', firstPos);
  
  // The first container opens with: <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
  // Find its closing </div> which is right before the second container
  
  const betweenSection = app.substring(firstOpen, secondPos);
  const lastClose = betweenSection.lastIndexOf('</div>');
  
  if (lastClose >= 0) {
    const firstClose = firstOpen + lastClose + 6;
    const removed = app.substring(firstOpen, firstClose);
    console.log(`Removing section: ${removed.substring(0, 60)}... (${removed.length} chars)`);
    
    app = app.substring(0, firstOpen) + app.substring(firstClose);
    console.log('✅ Removed agent info from chat header');
  }
}

// ============================================
// MOVE 3: Compact header padding
// ============================================
const chatHeaderIdx = app.indexOf("/* CHAT INTERFACE - Agent selected */");
if (chatHeaderIdx > 0) {
  const localIdx = app.indexOf("padding: '20px 30px'", chatHeaderIdx);
  if (localIdx > 0 && localIdx < chatHeaderIdx + 2000) {
    app = app.substring(0, localIdx) + "padding: '10px 30px'" + app.substring(localIdx + "padding: '20px 30px'".length);
    console.log('✅ Reduced header padding');
  }
}

// Write
fs.writeFileSync(filePath, app, 'utf8');
console.log('\n✅ All changes applied');
