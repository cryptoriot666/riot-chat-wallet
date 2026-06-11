const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(filePath, 'utf8');

// === CHANGE: Remove the entire Memory Status block from chat header ===
// Target: from the opening flex div to just before the WALRUS SAVE + IMMORTALIZE BUTTONS
// Structure:
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             {/* Memory Status */}
//             {connected && memory && (<div...whole block...></div>)}
//             (blank line)
//             {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}
//             ...
//           </div>
//
// We need to replace this entire flex container div with just the buttons part
// without the wrapping div (since buttons will be at the right side of the header directly)

const oldBlock = `          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Memory Status */}
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

            {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}`;

const newBlock = `          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* WALRUS SAVE + IMMORTALIZE BUTTONS */}`;

if (app.includes(oldBlock)) {
  app = app.replace(oldBlock, newBlock);
  console.log('✅ Removed Memory Status from header, simplified buttons container');
} else {
  console.log('❌ Exact block not found. Debugging...');
  // Find partial matches
  const idx1 = app.indexOf("display: 'flex', alignItems: 'center', gap: '15px'");
  const idx2 = app.indexOf("WALRUS SAVE + IMMORTALIZE BUTTONS");
  if (idx1 > -1 && idx2 > -1) {
    console.log(`Container at ${idx1}, Buttons comment at ${idx2}`);
    console.log(`Difference: ${idx2 - idx1} chars`);
    console.log(`Section between:`);
    console.log(app.substring(idx1, idx2));
  }
}

// Write
fs.writeFileSync(filePath, app, 'utf8');
console.log('✅ Written');
