const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');
let changes = [];

// === CHANGE 1: Add memory status in sidebar ===
// Insert between API status line and Agent List section
const agentListMarker = `        {/* Agent List - THE 25 LIVING PROOFS */}`;

const sidebarMemoryBlock = `        {/* Memory Status — Soul Stats */}
        {connected && memory && (
          <div style={{
            padding: '10px 15px', margin: '0 10px 8px 10px',
            background: 'rgba(46,196,182,0.06)',
            border: '1px solid rgba(46,196,182,0.15)',
            borderRadius: '8px',
            fontFamily: "'Rubik Mono One', sans-serif"
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
              <Database size={10} color='#2ec4b6' />
              <span style={{fontSize:'9px',color:'#2ec4b6'}}>Sessions: {memory.visit_count || 1} | Agents met: {memory?.visited_agents?.length || 0}/25</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
              <span style={{fontSize:'9px',color:'#c0a080'}}>Agents: {visitedAgents.size}/25</span>
              {memory.user_name && (
                <>
                  <span style={{color:'#6a5040',fontSize:'8px'}}>|</span>
                  <User size={10} color='#ff2a6d' />
                  <span style={{fontSize:'9px',color:RIOT_PINK}}>{memory.user_name}</span>
                </>
              )}
              {walrusSaved && (
                <>
                  <span style={{color:'#6a5040',fontSize:'8px'}}>|</span>
                  <Cloud size={10} color='#2ec4b6' />
                  <span style={{fontSize:'9px',color:'#2ec4b6'}}>SOUL ARCHIVED</span>
                </>
              )}
              {autoSaveCount > 0 && (
                <>
                  <span style={{color:'#6a5040',fontSize:'8px'}}>|</span>
                  <span style={{fontSize:'9px',color:'#00b4d8'}}>Auto: {autoSaveCount}x</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Agent List - THE 25 LIVING PROOFS */}`;

if (app.includes(agentListMarker) && !app.includes('Memory Status — Soul Stats')) {
  app = app.replace(agentListMarker, sidebarMemoryBlock);
  changes.push('Added memory status to sidebar');
  console.log('✅ Added memory status to sidebar');
} else {
  console.log('❌ Sidebar marker not found or already inserted');
}

// === CHANGE 2: Remove memory status from chat header ===
// Target the exact block in the chat header
const memStatusBlock = `            {/* Memory Status */}
            {connected && memory && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 16px',
                background: 'rgba(46,196,182,0.08)',
                border: '2px solid rgba(46,196,182,0.2)',
                borderRadius: '8px', fontSize: '11px',
                fontFamily: \"'Rubik Mono One', sans-serif\",
                boxShadow: '0 0 10px rgba(46,196,182,0.1)'
              }}>
                <Database size={12} color=\"#2ec4b6\" />
                <span style={{ color: '#2ec4b6' }}>Sessions: {memory.visit_count || 1} | Agents met: {memory?.visited_agents?.length || 0}/25</span>
                <span style={{ color: '#a08060' }}>|</span>
                <span style={{ color: '#c0a080' }}>Agents: {visitedAgents.size}/25</span>
                {memory.user_name && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <User size={12} color=\"#ff2a6d\" />
                    <span style={{ color: RIOT_PINK }}>{memory.user_name}</span>
                  </>
                )}
                {walrusSaved && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <Cloud size={12} color=\"#2ec4b6\" />
                    <span style={{ color: '#2ec4b6' }}>WALRUS</span>
                  </>
                )}
                {autoSaveCount > 0 && (
                  <>
                    <span style={{ color: '#a08060' }}>|</span>
                    <span style={{ color: '#00b4d8' }}>Auto: {autoSaveCount}x</span>
                  </>
                )}
              </div>
            )}

`;

if (app.includes(memStatusBlock)) {
  app = app.replace(memStatusBlock, '');
  changes.push('Removed memory status from chat header');
  console.log('✅ Removed memory status from chat header');
} else {
  console.log('❌ Header memory status block not found');
  
  // Debug: find what comes after 'Memory Status' comment
  const idx = app.indexOf('Memory Status');
  if (idx > -1) {
    console.log(`Found Memory Status at char ${idx}`);
    console.log(`Context: ${app.substring(idx, idx + 100)}`);
  }
}

// Write
fs.writeFileSync(filePath, app, 'utf8');
console.log(`\nDone. ${changes.length} change sets applied.`);
changes.forEach(c => console.log(`  • ${c}`));
