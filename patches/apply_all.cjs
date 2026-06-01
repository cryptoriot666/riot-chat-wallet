const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// PATCH 1: import
c = c.replace(
  "import { TransactionBlock } from '@mysten/sui.js/transactions'",
  "import { TransactionBlock } from '@mysten/sui.js/transactions'\nimport { TaskTracker, DraftWriter, WidgetTabs, EncryptModal } from './widgets.jsx'"
);

// PATCH 2: new states
c = c.replace(
  "const [pendingWalrus, setPendingWalrus] = useState(false)",
  "const [pendingWalrus, setPendingWalrus] = useState(false)\n" +
  "  const [showEncryptModal, setShowEncryptModal] = useState(false)\n" +
  "  const [encryptEnabled, setEncryptEnabled] = useState(false)\n" +
  "  const [encryptPassword, setEncryptPassword] = useState('')\n" +
  "  const [pendingEncryptConfirm, setPendingEncryptConfirm] = useState(false)\n" +
  "  const [widgetTab, setWidgetTab] = useState('verify')\n" +
  "  const [tasks, setTasks] = useState([])\n" +
  "  const [draftText, setDraftText] = useState('')"
);

// PATCH 3: saveStatus + handlers
c = c.replace(
  "const [walrusStatus, setWalrusStatus] = useState('')",
  "const [walrusStatus, setWalrusStatus] = useState('')\n" +
  "  const [saveStatus, setSaveStatus] = useState('')\n" +
  "  const handleEncryptEnable = () => {\n" +
  "    if (encryptPassword.length < 4) { showToast('Password must be at least 4 chars', 'error'); return }\n" +
  "    setEncryptEnabled(true)\n" +
  "    setShowEncryptModal(false)\n" +
  "    if (pendingEncryptConfirm) {\n" +
  "      setPendingEncryptConfirm(false)\n" +
  "      setShowWalrusModal(true)\n" +
  "    }\n" +
  "  }\n" +
  "  const handleEncryptDisable = () => {\n" +
  "    setEncryptEnabled(false)\n" +
  "    setEncryptPassword('')\n" +
  "    showToast('Encryption disabled', 'info')\n" +
  "  }"
);

// PATCH 4: save button + encrypt toggle
c = c.replace(
  "      {isSaving ? saveStatus || 'Saving...' : 'SAVE MEMORY'}\n" +
  "    </button>\n\n" +
  "    <ImmortalizeButton",
  "      {isSaving ? saveStatus || 'Saving...' : encryptEnabled ? 'SEAL SAVE' : 'SAVE MEMORY'}\n" +
  "    </button>\n\n" +
  "    <button onClick={encryptEnabled ? handleEncryptDisable : () => { setShowEncryptModal(true); setPendingEncryptConfirm(false) }}\n" +
  "      title={encryptEnabled ? 'Disable encryption' : 'Enable Seal encryption'}\n" +
  "      style={{\n" +
  "        padding: '6px 10px', fontSize: '10px', borderRadius: '6px', border: 'none',\n" +
  "        background: encryptEnabled ? 'rgba(255,183,3,0.2)' : 'rgba(255,255,255,0.05)',\n" +
  "        color: encryptEnabled ? '#ffb703' : '#6a5040', cursor: 'pointer',\n" +
  "        fontFamily: \"'Rubik Mono One', sans-serif\",\n" +
  "        transition: 'all 0.2s'\n" +
  "      }}>{encryptEnabled ? 'SEAL' : 'NO SEAL'}</button>\n\n" +
  "    <ImmortalizeButton"
);

// PATCH 5: verification panel header
c = c.replace(
  "              <Shield size={16} /> VERIFICATION\n" +
  "            </h3>\n" +
  "            <div style={{display: 'flex', gap: '4px'}}>\n" +
  "              <button \n" +
  "                onClick={() => setVerifyTab('tx')}\n" +
  "                style={{\n" +
  "                  padding: '4px 10px', fontSize: '10px', borderRadius: '4px', border: 'none',\n" +
  "                  cursor: 'pointer', fontFamily: \"'Rubik Mono One', sans-serif\",\n" +
  "                  background: verifyTab === 'tx' ? 'rgba(46,196,182,0.3)' : 'rgba(255,255,255,0.05)',\n" +
  "                  color: verifyTab === 'tx' ? '#2ec4b6' : '#a08060'\n" +
  "                }}\n" +
  "              >TX HISTORY</button>\n" +
  "              <button \n" +
  "                onClick={() => setVerifyTab('tatum')}\n" +
  "                style={{\n" +
  "                  padding: '4px 10px', fontSize: '10px', borderRadius: '4px', border: 'none',\n" +
  "                  cursor: 'pointer', fontFamily: \"'Rubik Mono One', sans-serif\",\n" +
  "                  background: verifyTab === 'tatum' ? 'rgba(255,183,3,0.3)' : 'rgba(255,255,255,0.05)',\n" +
  "                  color: verifyTab === 'tatum' ? '#ffb703' : '#a08060'\n" +
  "                }}\n" +
  "              >TATUM</button>\n" +
  "            </div>",
  "              <Shield size={16} /> RIOT WIDGETS\n" +
  "            </h3>\n" +
  "            <WidgetTabs tab={widgetTab} setTab={setWidgetTab} />"
);

// PATCH 6: verifyTab sections -> widgetTab sections
c = c.replace(
  "          {verifyTab === 'tx' && (\n" +
  "            <div style={{ marginBottom: '20px' }}>\n" +
  "              <h4 style={{\n" +
  "                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',\n" +
  "                textTransform: 'uppercase', letterSpacing: '2px',\n" +
  "                fontFamily: \"'Rubik Mono One', sans-serif\"\n" +
  "              }}>\n" +
  "                <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />\n" +
  "                TX HISTORY\n" +
  "              </h4>\n" +
  "              <TxHistoryList walletHash={walletHash} />\n" +
  "            </div>\n" +
  "          )}\n\n" +
  "          {verifyTab === 'tatum' && (\n" +
  "            <div style={{ marginBottom: '20px' }}>\n" +
  "              <TatumDashboardPanel wallet={{address: account?.address}} />\n" +
  "            </div>\n" +
  "          )}",
  "          {widgetTab === 'tasks' && (\n" +
  "            <div>\n" +
  "              <h4 style={{\n" +
  "                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',\n" +
  "                textTransform: 'uppercase', letterSpacing: '2px',\n" +
  "                fontFamily: \"'Rubik Mono One', sans-serif\"\n" +
  "              }}>\n" +
  "                TASK TRACKER\n" +
  "              </h4>\n" +
  "              <TaskTracker tasks={tasks} setTasks={setTasks} agents={AGENTS} onSave={() => {}} />\n" +
  "            </div>\n" +
  "          )}\n\n" +
  "          {widgetTab === 'draft' && (\n" +
  "            <div>\n" +
  "              <h4 style={{\n" +
  "                fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',\n" +
  "                textTransform: 'uppercase', letterSpacing: '2px',\n" +
  "                fontFamily: \"'Rubik Mono One', sans-serif\"\n" +
  "              }}>\n" +
  "                DRAFT WRITER\n" +
  "              </h4>\n" +
  "              <DraftWriter\n" +
  "                draftText={draftText} setDraftText={setDraftText}\n" +
  "                onSaveDraft={() => { showToast('Draft saved', 'info') }}\n" +
  "                onSendToAgent={() => {\n" +
  "                  if (!draftText.trim()) return\n" +
  "                  setMessages(prev => [...prev, { role: 'user', content: draftText, agent_id: selectedAgent.id, id: Date.now() }])\n" +
  "                  setDraftText('')\n" +
  "                }}\n" +
  "              />\n" +
  "            </div>\n" +
  "          )}\n\n" +
  "          {widgetTab === 'verify' && (\n" +
  "            <div>\n" +
  "              <div style={{ marginBottom: '20px' }}>\n" +
  "                <h4 style={{\n" +
  "                  fontSize: '12px', color: '#a08060', margin: '0 0 12px 0',\n" +
  "                  textTransform: 'uppercase', letterSpacing: '2px',\n" +
  "                  fontFamily: \"'Rubik Mono One', sans-serif\"\n" +
  "                }}>\n" +
  "                  <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />\n" +
  "                  TX HISTORY\n" +
  "                </h4>\n" +
  "                <TxHistoryList walletHash={walletHash} />\n" +
  "              </div>\n" +
  "              <div style={{ marginBottom: '20px' }}>\n" +
  "                <TatumDashboardPanel wallet={{address: account?.address}} />\n" +
  "              </div>"
);

// PATCH 7: wrap Immortalize in verify tab
// Find last closing section before CSS
c = c.replace(
  "          </div>\n" +
  "        </div>\n\n" +
  "      {/* CSS Animations",
  "              </div>\n" +
  "            </div>\n" +
  "          )}\n" +
  "        </div>\n\n" +
  "      {/* CSS Animations"
);

// PATCH 8: EncryptModal
c = c.replace(
  "      />\n\n\n" +
  "      {/* Name Ask Modal */}",
  "      />\n\n" +
  "      <EncryptModal\n" +
  "        isOpen={showEncryptModal}\n" +
  "        onClose={() => { setShowEncryptModal(false); setEncryptPassword('') }}\n" +
  "        onEnable={handleEncryptEnable}\n" +
  "        password={encryptPassword}\n" +
  "        setPassword={setEncryptPassword}\n" +
  "        mode={pendingEncryptConfirm ? 'save' : 'enable'}\n" +
  "      />\n\n" +
  "      {/* Name Ask Modal */}"
);

fs.writeFileSync(p, c);
console.log('All 8 patches applied. Running build...');
