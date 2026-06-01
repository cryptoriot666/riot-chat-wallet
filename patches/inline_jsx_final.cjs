const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Remove import widgets line — match exactly from file
const lines = c.split(/\r?\n/);
const filtered = lines.filter(l => !l.includes("from './widgets"));
c = filtered.join('\n');

// Now find 'export default function App'
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
  return (
    <div>
      <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
        <input value={vInput} onChange={e=>setInput(e.target.value)} placeholder='New task...' maxLength={60}
          style={{flex:1,padding:'6px 10px',fontSize:'11px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:'#e0d0c0',fontFamily:'monospace',outline:'none'}}
          onKeyDown={e=>{if(e.key==='Enter')addTask()}} />
        <select value={vFilter} onChange={e=>setFilter(e.target.value)}
          style={{padding:'6px',fontSize:'10px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(0,0,0,0.5)',color:'#a08060',fontFamily:'monospace',maxWidth:'52px'}}>
          <option value='ALL'>ALL</option>
          {agents && agents.slice(0,10).map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
        </select>
        <button onClick={addTask} style={{padding:'6px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}}>+</button>
      </div>
      {filtered.length === 0 
        ? <div style={{fontSize:'11px',color:'#6a5040',textAlign:'center',padding:'20px',fontFamily:'monospace'}}>no tasks yet</div>
        : filtered.map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <input type='checkbox' checked={t.done} onChange={()=>toggleTask(t.id)} style={{accentColor:'#2ec4b6',width:'14px',height:'14px'}} />
              <span style={{flex:1,fontSize:'11px',color:t.done?'#6a5040':'#e0d0c0',textDecoration:t.done?'line-through':'none',fontFamily:'monospace'}}>{t.text}</span>
              <span style={{fontSize:'9px',color:'#00b4d8',fontFamily:'monospace'}}>[{t.agent_id}]</span>
              <span onClick={()=>deleteTask(t.id)} style={{cursor:'pointer',fontSize:'12px',color:'#ff4444'}}>x</span>
            </div>
          ))}
    </div>
  );
};

const DraftWriter = ({draftText,setDraftText,onSendToAgent,onSaveDraft}) => {
  const maxChars = 280;
  const remaining = maxChars - draftText.length;
  const isWarning = remaining <= 40;
  const isOver = remaining < 0;
  return (
    <div>
      <textarea value={draftText} onChange={e=>setDraftText(e.target.value)} placeholder='Type a draft... (max 280 chars)' maxLength={maxChars}
        style={{width:'100%',height:'80px',padding:'10px',fontSize:'11px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(255,183,3,0.03)',color:'#e0d0c0',fontFamily:'monospace',resize:'none',outline:'none',boxSizing:'border-box'}} />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}}>
        <span style={{fontSize:'10px',color:isOver?'#ff4444':isWarning?'#ffb703':'#6a5040',fontFamily:'monospace'}}>{remaining} chars left</span>
        <div style={{display:'flex',gap:'4px'}}>
          <button onClick={onSaveDraft} style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}}>SAVE</button>
          <button onClick={onSendToAgent} style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(255,183,3,0.3)',color:'#ffb703',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}}>SEND TO AGENT</button>
        </div>
      </div>
    </div>
  );
};

const WidgetTabs = ({tab,setTab}) => (
  <div style={{display:'flex',gap:'4px'}}>
    <button onClick={()=>setTab('tasks')} style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='tasks'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='tasks'?'#2ec4b6':'#a08060'}}>TASKS</button>
    <button onClick={()=>setTab('draft')} style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='draft'?'rgba(255,183,3,0.3)':'rgba(255,255,255,0.05)',color:tab==='draft'?'#ffb703':'#a08060'}}>DRAFT</button>
    <button onClick={()=>setTab('verify')} style={{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='verify'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='verify'?'#2ec4b6':'#a08060'}}>VERIFY</button>
  </div>
);

const EncryptModal = ({isOpen,onClose,onEnable,password,setPassword,mode}) => {
  if (!isOpen) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={onClose}>
      <div style={{background:'linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)',border:'2px solid rgba(255,183,3,0.3)',borderRadius:'12px',padding:'24px',maxWidth:'380px',width:'90%'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontFamily:"'Rubik Glitch', cursive",fontSize:'14px',color:'#ffb703',margin:'0 0 16px 0',textShadow:'0 0 10px rgba(255,183,3,0.4)'}}>SEAL ENCRYPTION</h3>
        <p style={{fontSize:'11px',color:'#a08060',fontFamily:'monospace',marginBottom:'12px'}}>Set a password to encrypt your memory with AES-256-CTR before storing to Walrus.</p>
        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Encryption password...'
          style={{width:'100%',padding:'10px',fontSize:'12px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(0,0,0,0.5)',color:'#e0d0c0',fontFamily:'monospace',outline:'none',boxSizing:'border-box',marginBottom:'16px'}}
          onKeyDown={e=>{if(e.key==='Enter')onEnable()}} />
        <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
          <button onClick={()=>{onClose();setPassword('')}} style={{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'2px solid rgba(255,255,255,0.1)',background:'transparent',color:'#a08060',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}}>CANCEL</button>
          <button onClick={onEnable} style={{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'none',background:'linear-gradient(135deg,#ffb703,#ff6b35)',color:'#000',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}}>{mode==='save'?'ENABLE & SAVE':'ENABLE'}</button>
        </div>
      </div>
    </div>
  );
};

`;

c = c.slice(0, appIdx) + '\n' + defs + '\n' + c.slice(appIdx);

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);

// Verify no remaining import
console.log('Has import:', c.includes("from './widgets"));
// Verify 1 definition each
console.log('TaskTracker#:', (c.match(/const TaskTracker =/g)||[]).length);
console.log('DraftWriter#:', (c.match(/const DraftWriter =/g)||[]).length);
console.log('WidgetTabs#:', (c.match(/const WidgetTabs =/g)||[]).length);
console.log('EncryptModal#:', (c.match(/const EncryptModal =/g)||[]).length);
console.log('Size:', c.length);
