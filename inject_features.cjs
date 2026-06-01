const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Helper
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// 1. Add import
content = content.replace(
  "import { TransactionBlock } from '@mysten/sui.js/transactions'\n\n// ═══════════════════════════════════════════════════════════════\n// CONFIG",
  "import { TransactionBlock } from '@mysten/sui.js/transactions'\nimport { TaskTracker, DraftWriter, WidgetTabs, EncryptModal } from './widgets.jsx'\n\n// ═══════════════════════════════════════════════════════════════\n// CONFIG"
);

// 2. Add new states
content = content.replace(
  "const [pendingWalrus, setPendingWalrus] = useState(false)",
  `const [pendingWalrus, setPendingWalrus] = useState(false)
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [encryptEnabled, setEncryptEnabled] = useState(false)
  const [encryptPassword, setEncryptPassword] = useState('')
  const [pendingEncryptConfirm, setPendingEncryptConfirm] = useState(false)
  const [widgetTab, setWidgetTab] = useState('verify')
  const [tasks, setTasks] = useState([])
  const [draftText, setDraftText] = useState('')`
);

// 3. Add saveStatus + encrypt handlers
content = content.replace(
  "const [walrusStatus, setWalrusStatus] = useState('')",
  `const [walrusStatus, setWalrusStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const handleEncryptEnable = () => {
    if (encryptPassword.length < 4) { showToast('Password must be at least 4 chars', 'error'); return }
    setEncryptEnabled(true)
    setShowEncryptModal(false)
    if (pendingEncryptConfirm) {
      setPendingEncryptConfirm(false)
      setShowWalrusModal(true)
    }
  }
  const handleEncryptDisable = () => {
    setEncryptEnabled(false)
    setEncryptPassword('')
    showToast('Encryption disabled', 'info')
  }`
);

// 4. Save button text + encrypt toggle
content = content.replace(
  `      {isSaving ? saveStatus || 'Saving...' : 'SAVE MEMORY'}
    </button>

    <ImmortalizeButton`,
  `      {isSaving ? saveStatus || 'Saving...' : encryptEnabled ? '🔒 ENCRYPTED' : 'SAVE MEMORY'}
    </button>

    {/* Encrypt toggle */}
    <button onClick={encryptEnabled ? handleEncryptDisable : () => { setShowEncryptModal(true); setPendingEncryptConfirm(false) }}
      style={{
        padding: '6px 10px', fontSize: '10px', borderRadius: '6px', border: 'none',
        background: encryptEnabled ? 'rgba(255,183,3,0.2)' : 'rgba(255,255,255,0.05)',
        color: encryptEnabled ? '#ffb703' : '#6a5040', cursor: 'pointer',
        fontFamily: "'Rubik Mono One', sans-serif",
        transition: 'all 0.2s'
      }}
      title={encryptEnabled ? 'Encryption ON' : 'Encryption OFF'}>
      {encryptEnabled ? '🔒' : '🔓'}
    </button>

    <ImmortalizeButton`
);

// 5. Replace verification panel header
content = content.replace(
  `              <Shield size={16} /> VERIFICATION
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
            </div>`,
  `              <Shield size={16} /> RIOT WIDGETS
            </h3>
            <WidgetTabs tab={widgetTab} setTab={setWidgetTab} />`
);

// 6. Replace verifyTab sections with widgetTab sections
content = content.replace(
  `          {verifyTab === 'tx' && (
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
          )}`,
  `          {widgetTab === 'tasks' && (
            <div>
              <h4 style={{
                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                textTransform: 'uppercase', letterSpacing: '2px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                TASK TRACKER
              </h4>
              <TaskTracker tasks={tasks} setTasks={setTasks} agents={AGENTS} onSave={() => {}} />
            </div>
          )}

          {widgetTab === 'draft' && (
            <div>
              <h4 style={{
                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',
                textTransform: 'uppercase', letterSpacing: '2px',
                fontFamily: "'Rubik Mono One', sans-serif"
              }}>
                DRAFT WRITER
              </h4>
              <DraftWriter
                draftText={draftText} setDraftText={setDraftText}
                onSaveDraft={() => { showToast('Draft saved', 'info') }}
                onSendToAgent={() => {
                  if (!draftText.trim()) return
                  setMessages(prev => [...prev, { role: 'user', content: draftText, agent_id: selectedAgent.id, id: Date.now() }])
                  setDraftText('')
                }}
              />
            </div>
          )}

          {widgetTab === 'verify' && (
            <div>
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
              <div style={{ marginBottom: '20px' }}>
                <TatumDashboardPanel wallet={{address: account?.address}} />
              </div>`
);

// 7. Wrap Immortalize content inside verify tab + close properly
// Find the last closing structure before CSS section
content = content.replace(
  `          </div>
        </div>

      {/* CSS Animations`,
  `              </div>
            </div>
          )}
        </div>

      {/* CSS Animations`
);

// 8. Add EncryptModal after WalrusSaveModal
content = content.replace(
  `      />


      {/* Name Ask Modal */}`,
  `      />

      <EncryptModal
        isOpen={showEncryptModal}
        onClose={() => { setShowEncryptModal(false); setEncryptPassword('') }}
        onEnable={handleEncryptEnable}
        password={encryptPassword}
        setPassword={setEncryptPassword}
        mode={pendingEncryptConfirm ? 'save' : 'enable'}
      />

      {/* Name Ask Modal */}`
);

fs.writeFileSync(filePath, content);
console.log('Done. Verifying build...');
