const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// ===== PATCH 1: Remove import widgets =====
const lines = c.split(/\r?\n/);
const filtered = lines.filter(l => !l.includes("from './widgets"));
c = filtered.join('\n');

// ===== PATCH 2: Inline widget components =====
const appIdx = c.indexOf('export default function App');
const defs = `
const TaskTracker = ({tasks,setTasks,agents,onSave}) => {
  const [vInput, setInput] = React.useState('');
  const [vFilter, setFilter] = React.useState('ALL');
  const addTask = () => {
    if (!vInput.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: vInput.trim(), done: false, agent_id: vFilter === 'ALL' ? 'J4' : vFilter }]);
    setInput('');
  };
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const filtered = vFilter === 'ALL' ? tasks : tasks.filter(t => t.agent_id === vFilter);
  return React.createElement('div',null,
    React.createElement('div',{style:{display:'flex',gap:'6px',marginBottom:'12px'}},
      React.createElement('input',{value:vInput,onChange:e=>setInput(e.target.value),placeholder:'New task...',maxLength:60,
        style:{flex:1,padding:'6px 10px',fontSize:'11px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:'#e0d0c0',fontFamily:'monospace',outline:'none'},
        onKeyDown:e=>{if(e.key==='Enter')addTask()}}),
      React.createElement('select',{value:vFilter,onChange:e=>setFilter(e.target.value),
        style:{padding:'6px',fontSize:'10px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(0,0,0,0.5)',color:'#a08060',fontFamily:'monospace',maxWidth:'52px'}},
        React.createElement('option',{value:'ALL'},'ALL'),
        agents && agents.slice(0,10).map(a=>React.createElement('option',{key:a.id,value:a.id},a.id))),
      React.createElement('button',{onClick:addTask,style:{padding:'6px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'+')),
    filtered.length===0
      ? React.createElement('div',{style:{fontSize:'11px',color:'#6a5040',textAlign:'center',padding:'20px',fontFamily:'monospace'}},'no tasks yet')
      : filtered.map(t=>React.createElement('div',{key:t.id,style:{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}},
          React.createElement('input',{type:'checkbox',checked:t.done,onChange:()=>toggleTask(t.id),style:{accentColor:'#2ec4b6',width:'14px',height:'14px'}}),
          React.createElement('span',{style:{flex:1,fontSize:'11px',color:t.done?'#6a5040':'#e0d0c0',textDecoration:t.done?'line-through':'none',fontFamily:'monospace'}},t.text),
          React.createElement('span',{style:{fontSize:'9px',color:'#00b4d8',fontFamily:'monospace'}},'['+t.agent_id+']'),
          React.createElement('span',{onClick:()=>deleteTask(t.id),style:{cursor:'pointer',fontSize:'12px',color:'#ff4444'}},'x'))));
};
const DraftWriter = ({draftText,setDraftText,onSendToAgent,onSaveDraft}) => {
  const m=280;const r=m-draftText.length;const w=r<=40;const o=r<0;
  return React.createElement('div',null,
    React.createElement('textarea',{value:draftText,onChange:e=>setDraftText(e.target.value),placeholder:'Type a draft... (max 280 chars)',maxLength:m,
      style:{width:'100%',height:'80px',padding:'10px',fontSize:'11px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(255,183,3,0.03)',color:'#e0d0c0',fontFamily:'monospace',resize:'none',outline:'none',boxSizing:'border-box'}}),
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}},
      React.createElement('span',{style:{fontSize:'10px',color:o?'#ff4444':w?'#ffb703':'#6a5040',fontFamily:'monospace'}},r+' chars left'),
      React.createElement('div',{style:{display:'flex',gap:'4px'}},
        React.createElement('button',{onClick:onSaveDraft,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SAVE'),
        React.createElement('button',{onClick:onSendToAgent,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(255,183,3,0.3)',color:'#ffb703',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SEND TO AGENT'))));
};
const WidgetTabs = ({tab,setTab}) => React.createElement('div',{style:{display:'flex',gap:'4px'}},
  React.createElement('button',{onClick:()=>setTab('tasks'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='tasks'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='tasks'?'#2ec4b6':'#a08060'}},'TASKS'),
  React.createElement('button',{onClick:()=>setTab('draft'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='draft'?'rgba(255,183,3,0.3)':'rgba(255,255,255,0.05)',color:tab==='draft'?'#ffb703':'#a08060'}},'DRAFT'),
  React.createElement('button',{onClick:()=>setTab('verify'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='verify'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='verify'?'#2ec4b6':'#a08060'}},'VERIFY'));
const EncryptModal = ({isOpen,onClose,onEnable,password,setPassword,mode}) => {
  if(!isOpen)return null;
  return React.createElement('div',{style:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999},onClick:onClose},
    React.createElement('div',{style:{background:'linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)',border:'2px solid rgba(255,183,3,0.3)',borderRadius:'12px',padding:'24px',maxWidth:'380px',width:'90%'},onClick:e=>e.stopPropagation()},
      React.createElement('h3',{style:{fontFamily:"'Rubik Glitch', cursive",fontSize:'14px',color:'#ffb703',margin:'0 0 16px 0',textShadow:'0 0 10px rgba(255,183,3,0.4)'}},'SEAL ENCRYPTION'),
      React.createElement('p',{style:{fontSize:'11px',color:'#a08060',fontFamily:'monospace',marginBottom:'12px'}},'Set a password to encrypt your memory with AES-256-CTR before storing to Walrus.'),
      React.createElement('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),placeholder:'Encryption password...',
        style:{width:'100%',padding:'10px',fontSize:'12px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(0,0,0,0.5)',color:'#e0d0c0',fontFamily:'monospace',outline:'none',boxSizing:'border-box',marginBottom:'16px'},
        onKeyDown:e=>{if(e.key==='Enter')onEnable()}}),
      React.createElement('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end'}},
        React.createElement('button',{onClick:()=>{onClose();setPassword('')},style:{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'2px solid rgba(255,255,255,0.1)',background:'transparent',color:'#a08060',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'CANCEL'),
        React.createElement('button',{onClick:onEnable,style:{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'none',background:'linear-gradient(135deg,#ffb703,#ff6b35)',color:'#000',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},mode==='save'?'ENABLE & SAVE':'ENABLE'))));
};
`;

c = c.slice(0, appIdx) + '\n' + defs + '\n' + c.slice(appIdx);

// ===== PATCH 3: Add encrypt states =====
const state1 = "const handleEncryptEnable = () => {";
const stateBefore = "const [walrusStatus, setWalrusStatus] = useState('')\n";

// Find the handleEncryptEnable declaration — there might already be one from d586d8c
const encFnIdx = c.indexOf("handleEncryptEnable = () =>");
if (encFnIdx >= 0) {
  // Already has it — just need to add states before it
  const walrusStatusIdx = c.lastIndexOf("const [walrusStatus, setWalrusStatus] = useState('')", encFnIdx);
  if (walrusStatusIdx >= 0) {
    // Find line end
    const lineEnd = c.indexOf('\n', walrusStatusIdx);
    const newStates = "\n  const [showEncryptModal, setShowEncryptModal] = useState(false)\n  const [encryptEnabled, setEncryptEnabled] = useState(false)\n  const [encryptPassword, setEncryptPassword] = useState('')\n  const [pendingEncryptConfirm, setPendingEncryptConfirm] = useState(false)\n  const [widgetTab, setWidgetTab] = useState('verify')\n  const [tasks, setTasks] = useState([])\n  const [draftText, setDraftText] = useState('')";
    c = c.slice(0, lineEnd) + newStates + c.slice(lineEnd);
  }
}

// ===== PATCH 4: Save button SEAL/NO SEAL =====
const oldSave = "{isSaving ? saveStatus || 'Saving...' : 'SAVE MEMORY'}\n    </button>\n\n    <ImmortalizeButton";
const newSave = "{isSaving ? saveStatus || 'Saving...' : encryptEnabled ? 'SEAL SAVE' : 'SAVE MEMORY'}\n    </button>\n\n    <button onClick={encryptEnabled ? handleEncryptDisable : ()=>{setShowEncryptModal(true);setPendingEncryptConfirm(false)}}\n      style={{padding:'6px 10px',fontSize:'10px',borderRadius:'6px',border:'none',background:encryptEnabled?'rgba(255,183,3,0.2)':'rgba(255,255,255,0.05)',color:encryptEnabled?'#ffb703':'#6a5040',cursor:'pointer',fontFamily:\"'Rubik Mono One', sans-serif\",transition:'all 0.2s'}}\n      title={encryptEnabled?'Disable encryption':'Enable Seal encryption'}>{encryptEnabled?'SEAL':'NO SEAL'}</button>\n\n    <ImmortalizeButton";

if (c.includes(oldSave)) {
  c = c.replace(oldSave, newSave);
  console.log('Save button patched');
} else {
  // Try CRLF
  const oldSaveCR = "{isSaving ? saveStatus || 'Saving...' : 'SAVE MEMORY'}\r\n    </button>\r\n\r\n    <ImmortalizeButton";
  const newSaveCR = "{isSaving ? saveStatus || 'Saving...' : encryptEnabled ? 'SEAL SAVE' : 'SAVE MEMORY'}\r\n    </button>\r\n\r\n    <button onClick={encryptEnabled ? handleEncryptDisable : ()=>{setShowEncryptModal(true);setPendingEncryptConfirm(false)}}\r\n      style={{padding:'6px 10px',fontSize:'10px',borderRadius:'6px',border:'none',background:encryptEnabled?'rgba(255,183,3,0.2)':'rgba(255,255,255,0.05)',color:encryptEnabled?'#ffb703':'#6a5040',cursor:'pointer',fontFamily:\"'Rubik Mono One', sans-serif\",transition:'all 0.2s'}}\r\n      title={encryptEnabled?'Disable encryption':'Enable Seal encryption'}>{encryptEnabled?'SEAL':'NO SEAL'}</button>\r\n\r\n    <ImmortalizeButton";
  if (c.includes(oldSaveCR)) {
    c = c.replace(oldSaveCR, newSaveCR);
    console.log('Save button patched CRLF');
  } else {
    console.log('Save NOT found. Checking...');
    console.log(JSON.stringify(c.slice(c.indexOf("isSaving ? saveStatus"), c.indexOf("SAVE MEMORY") + 60)));
  }
}

// ===== PATCH 5: EncryptModal JSX =====
const oldModal = "      />\n\n\n      {/* Name Ask Modal */}";
const newModal = "      />\n\n      <EncryptModal isOpen={showEncryptModal} onClose={()=>{setShowEncryptModal(false);setEncryptPassword('')}} onEnable={handleEncryptEnable}\n        password={encryptPassword} setPassword={setEncryptPassword} mode={pendingEncryptConfirm?'save':'enable'} />\n\n      {/* Name Ask Modal *//>";
if (c.includes(oldModal)) {
  c = c.replace(oldModal, newModal);
  console.log('Modal patched');
} else {
  // CRLF
  const oldModalCR = "      />\r\n\r\n\r\n      {/* Name Ask Modal */}";
  const newModalCR = "      />\r\n\r\n      <EncryptModal isOpen={showEncryptModal} onClose={()=>{setShowEncryptModal(false);setEncryptPassword('')}} onEnable={handleEncryptEnable}\r\n        password={encryptPassword} setPassword={setEncryptPassword} mode={pendingEncryptConfirm?'save':'enable'} />\r\n\r\n      {/* Name Ask Modal */}";
  if (c.includes(oldModalCR)) {
    c = c.replace(oldModalCR, newModalCR);
    console.log('Modal patched CRLF');
  }
}

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
console.log('All patches applied. Size:', c.length);
