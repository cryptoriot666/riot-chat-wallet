const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// ====== PATCH 1: STATES ======
// Cari useStates block
const oldState = `const [pendingWalrus, setPendingWalrus] = useState(false)`;
const newState = `const [pendingWalrus, setPendingWalrus] = useState(false)
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [encryptEnabled, setEncryptEnabled] = useState(false)
  const [encryptPassword, setEncryptPassword] = useState('')
  const [pendingEncryptConfirm, setPendingEncryptConfirm] = useState(false)
  const [widgetTab, setWidgetTab] = useState('verify')
  const [tasks, setTasks] = useState([])
  const [draftText, setDraftText] = useState('')`;

if (c.includes(oldState)) {
  c = c.replace(oldState, newState);
  console.log('States patched');
} else {
  console.log('States NOT found. Checking...');
  console.log('Has pendingWalrus:', c.includes('pendingWalrus'));
}

// ====== PATCH 2: HANDLERS ======
const oldHandler = `const [walrusStatus, setWalrusStatus] = useState('')`;
const newHandler = `const [walrusStatus, setWalrusStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const handleEncryptEnable = () => {
    if (encryptPassword.length < 4) { showToast('Password must be at least 4 chars', 'error'); return }
    setEncryptEnabled(true); setShowEncryptModal(false)
    if (pendingEncryptConfirm) { setPendingEncryptConfirm(false); setShowWalrusModal(true) }
  }
  const handleEncryptDisable = () => { setEncryptEnabled(false); setEncryptPassword(''); showToast('Encryption disabled','info') }`;

if (c.includes(oldHandler)) {
  c = c.replace(oldHandler, newHandler);
  console.log('Handlers patched');
} else {
  console.log('Handlers NOT found');
}

// ====== PATCH 3: SAVE BUTTON ======
const oldSave = `{isSaving ? saveStatus || 'Saving...' : 'SAVE MEMORY'}
    </button>

    <ImmortalizeButton`;

const newSave = `{isSaving ? saveStatus || 'Saving...' : encryptEnabled ? 'SEAL SAVE' : 'SAVE MEMORY'}
    </button>

    <button onClick={encryptEnabled ? handleEncryptDisable : ()=>{setShowEncryptModal(true);setPendingEncryptConfirm(false)}}
      style={{padding:'6px 10px',fontSize:'10px',borderRadius:'6px',border:'none',background:encryptEnabled?'rgba(255,183,3,0.2)':'rgba(255,255,255,0.05)',color:encryptEnabled?'#ffb703':'#6a5040',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",transition:'all 0.2s'}}
      title={encryptEnabled?'Disable encryption':'Enable Seal encryption'}>{encryptEnabled?'SEAL':'NO SEAL'}</button>

    <ImmortalizeButton`;

if (c.includes(oldSave)) {
  c = c.replace(oldSave, newSave);
  console.log('Save button patched');
} else {
  console.log('Save button NOT found');
}

// ====== PATCH 4: ENCRYPT MODAL ======
const oldModal = `      />


      {/* Name Ask Modal */}`;

const newModal = `      />

      <EncryptModal isOpen={showEncryptModal} onClose={()=>{setShowEncryptModal(false);setEncryptPassword('')}} onEnable={handleEncryptEnable}
        password={encryptPassword} setPassword={setEncryptPassword} mode={pendingEncryptConfirm?'save':'enable'} />

      {/* Name Ask Modal */}`;

if (c.includes(oldModal)) {
  c = c.replace(oldModal, newModal);
  console.log('Modal patched');
} else {
  console.log('Modal NOT found');
}

// ====== PATCH 5: WALRUS SAVE - add encrypt logic ======
const oldSaveLogic = `if (dataType === 'memory') {
        try {
          setIsSaving(true);
          setSaveStatus('Encrypting...');`;

if (c.includes(oldSaveLogic)) {
  console.log('Save logic already has encrypt reference');
} else {
  // Try to find the save logic
  const saveIdx = c.indexOf("if (dataType === 'memory')");
  if (saveIdx >= 0) {
    console.log('Save logic found at', saveIdx, '- checking if encrypt exists');
    const relevant = c.slice(saveIdx, saveIdx + 200);
    if (!relevant.includes('encryptEnabled')) {
      // Add encrypt logic
      const oldMem = "if (dataType === 'memory') {\n          try {\n            setIsSaving(true);";
      const newMem = "if (dataType === 'memory') {\n          try {\n            setIsSaving(true);\n            setSaveStatus('Encrypting...');\n          if (encryptEnabled && encryptPassword) {\n            const encResp = await fetch(API_BASE + '/api/walrus/encrypt', {\n              method: 'POST', headers: { 'Content-Type': 'application/json' },\n              body: JSON.stringify({ text: combinedText, password: encryptPassword })\n            });\n            if (encResp.ok) { const encData = await encResp.json(); combinedText = '<ENCRYPTED>'+encData.encrypted; }\n          }";
      if (c.includes(oldMem)) {
        c = c.replace(oldMem, newMem);
        console.log('Save logic encrypt patched');
      } else {
        console.log('Save logic oldMem NOT found');
      }
    } else {
      console.log('Encrypt already in save logic');
    }
  } else {
    console.log('dataType memory not found');
  }
}

fs.writeFileSync(p, c);
console.log('All patches done. Size:', c.length);
