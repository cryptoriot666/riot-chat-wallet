const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// Only patch the HEADER and TAB sections — no imports, no new states, no handlers
// These are the parts that FAILED in apply_all.cjs

// PATCH: Replace "VERIFICATION" header with "RIOT WIDGETS" + WidgetTabs
const oldHeader = `              <Shield size={16} /> VERIFICATION
            </h3>
            <div style={{display: 'flex', gap: '4px'}}>
              <button 
                onClick={() => setVerifyTab('tx')}
                style={{
                  padding: '4px 10px', fontSize: '10px', borderRadius: '4px', border: 'none',
                  cursor: 'pointer', fontFamily: "'Rubik Mono One', sans-serif",
                  background: verifyTab === 'tx' ? 'rgba(46,196,182,0.3)' : 'rgba(255,255,255,0.05)',
                  color: verifyTab === 'tx' ? '#2ec4b6' : '#a08060'
                }}
              >TX HISTORY</button>
              <button 
                onClick={() => setVerifyTab('tatum')}
                style={{
                  padding: '4px 10px', fontSize: '10px', borderRadius: '4px', border: 'none',
                  cursor: 'pointer', fontFamily: "'Rubik Mono One', sans-serif",
                  background: verifyTab === 'tatum' ? 'rgba(255,183,3,0.3)' : 'rgba(255,255,255,0.05)',
                  color: verifyTab === 'tatum' ? '#ffb703' : '#a08060'
                }}
              >TATUM</button>
            </div>`;

const newHeader = `              <Shield size={16} /> RIOT WIDGETS
            </h3>
            <div style={{display: 'flex', gap: '4px'}}>
              <button onClick={() => setWidgetTab('tasks')}
                style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:widgetTab==='tasks'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:widgetTab==='tasks'?'#2ec4b6':'#a08060'}}>TASKS</button>
              <button onClick={() => setWidgetTab('draft')}
                style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:widgetTab==='draft'?'rgba(255,183,3,0.3)':'rgba(255,255,255,0.05)',color:widgetTab==='draft'?'#ffb703':'#a08060'}}>DRAFT</button>
              <button onClick={() => setWidgetTab('verify')}
                style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:widgetTab==='verify'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:widgetTab==='verify'?'#2ec4b6':'#a08060'}}>VERIFY</button>
            </div>`;

if (c.includes(oldHeader)) {
  c = c.replace(oldHeader, newHeader);
  console.log('Header patched');
} else {
  console.log('Header NOT FOUND - checking for alternative');
  // Maybe already has RIOT WIDGETS?
  if (c.includes('RIOT WIDGETS')) {
    console.log('Already has RIOT WIDGETS');
  } else {
    console.log('Searching for VERIFICATION...');
    const vIdx = c.indexOf('VERIFICATION');
    console.log('Found at:', vIdx, 'context:', c.slice(vIdx-20, vIdx+100));
  }
}

// PATCH: Replace verifyTab sections with widgetTab sections
const oldTabs = `          {verifyTab === 'tx' && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                textTransform: 'uppercase', letterSpacing: '2px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                TX HISTORY
              </h4>
              <TxHistoryList walletHash={walletHash} />
            </div>
          )}

          {verifyTab === 'tatum' && (
            <div style={{ marginBottom: '20px' }}>
              <TatumDashboardPanel wallet={{address: account?.address}} />
            </div>
          )}`;

const newTabs = `          {widgetTab === 'tasks' && (
            <div>
              <h4 style={{fontSize:'12px',color:'#a08060',margin:'0 0 12px 0',textTransform:'uppercase',letterSpacing:'2px',fontFamily:"'Rubik Mono One', sans-serif"}}>TASK TRACKER</h4>
              <TaskTracker tasks={tasks} setTasks={setTasks} agents={AGENTS} onSave={() => {}} />
            </div>
          )}

          {widgetTab === 'draft' && (
            <div>
              <h4 style={{fontSize:'12px',color:'#a08060',margin:'0 0 12px 0',textTransform:'uppercase',letterSpacing:'2px',fontFamily:"'Rubik Mono One', sans-serif"}}>DRAFT WRITER</h4>
              <DraftWriter draftText={draftText} setDraftText={setDraftText}
                onSaveDraft={() => { showToast('Draft saved', 'info') }}
                onSendToAgent={() => { if (!draftText.trim()) return; setMessages(prev => [...prev, {role:'user',content:draftText,agent_id:selectedAgent.id,id:Date.now()}]); setDraftText('') }} />
            </div>
          )}

          {widgetTab === 'verify' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{fontSize:'12px',color:'#a08060',margin:'0 0 12px 0',textTransform:'uppercase',letterSpacing:'2px',fontFamily:"'Rubik Mono One', sans-serif"}}>
                  <Clock size={12} style={{marginRight:'6px',verticalAlign:'middle'}} /> TX HISTORY
                </h4>
                <TxHistoryList walletHash={walletHash} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <TatumDashboardPanel wallet={{address: account?.address}} />
              </div>`;

if (c.includes(oldTabs)) {
  c = c.replace(oldTabs, newTabs);
  console.log('Tabs patched');
} else {
  console.log('Tabs NOT FOUND - checking current state');
  const txIdx = c.indexOf("verifyTab === 'tx'");
  if (txIdx >= 0) console.log('verifyTab tx found at:', txIdx);
  else console.log('verifyTab tx NOT found');
}

// PATCH: Add closing for verify tab
// Find the closing div that has {{moveObjectId && ...}} and {{latestBlobId && ...}}
const oldClosing = `          </div>
        </div>

      {/* CSS Animations`;

const newClosing = `              </div>
            </div>
          )}

        </div>

      {/* CSS Animations`;

if (c.includes(oldClosing)) {
  c = c.replace(oldClosing, newClosing);
  console.log('Closing patched');
} else {
  console.log('Closing NOT FOUND');
  // Check what the closing actually looks like
  const cssIdx = c.indexOf('CSS Animations');
  console.log('CSS Animations at:', cssIdx, 'context before:', c.slice(cssIdx-80, cssIdx));
}

fs.writeFileSync(p, c);
console.log('All patches done. Building...');
