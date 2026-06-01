const fs = require('fs');
let c = fs.readFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', 'utf8');

// Define widget implementations inline as React.createElement calls
// These will be stored in variables, not declared as functions

// Find the JSX references that use WidgetTabs, TaskTracker, DraftWriter, EncryptModal
// Replace JSX tags with React.createElement calls

// First, add inline definitions BEFORE export default function App
const appIdx = c.indexOf('export default function App');

const widgetDefs = `
// ──── WIDGET DEFINITIONS ────
const TaskTrackerW = ({tasks,setTasks,agents,onSave}) => {
  const [i,si]=React.useState('');const [f,sf]=React.useState('ALL');
  const a=()=>{if(!i.trim())return;setTasks(p=>[...p,{id:Date.now(),text:i.trim(),done:false,agent_id:f==='ALL'?'J4':f}]);si('')};
  const t=(id)=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));const d=(id)=>setTasks(p=>p.filter(t=>t.id!==id));
  const l=f==='ALL'?tasks:tasks.filter(t=>t.agent_id===f);
  return React.createElement('div',null,
    React.createElement('div',{style:{display:'flex',gap:'6px',marginBottom:'12px'}},
      React.createElement('input',{value:i,onChange:e=>si(e.target.value),placeholder:'New task...',maxLength:60,
        style:{flex:1,padding:'6px 10px',fontSize:'11px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:'#e0d0c0',fontFamily:'monospace',outline:'none'},
        onKeyDown:e=>{if(e.key==='Enter')a()}}),
      React.createElement('select',{value:f,onChange:e=>{const v=e.target.value;v==='ALL'?sf('ALL'):sf(v)},
        style:{padding:'6px',fontSize:'10px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(0,0,0,0.5)',color:'#a08060',fontFamily:'monospace',maxWidth:'52px'}},
        React.createElement('option',{value:'ALL'},'ALL'),
        agents && agents.slice(0,10).map(aa=>React.createElement('option',{key:aa.id,value:aa.id},aa.id))),
      React.createElement('button',{onClick:a,style:{padding:'6px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'+')),
    l.length===0
      ? React.createElement('div',{style:{fontSize:'11px',color:'#6a5040',textAlign:'center',padding:'20px',fontFamily:'monospace'}},'no tasks yet')
      : l.map(tt=>React.createElement('div',{key:tt.id,style:{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}},
          React.createElement('input',{type:'checkbox',checked:tt.done,onChange:()=>t(tt.id),style:{accentColor:'#2ec4b6',width:'14px',height:'14px'}}),
          React.createElement('span',{style:{flex:1,fontSize:'11px',color:tt.done?'#6a5040':'#e0d0c0',textDecoration:tt.done?'line-through':'none',fontFamily:'monospace'}},tt.text),
          React.createElement('span',{style:{fontSize:'9px',color:'#00b4d8',fontFamily:'monospace'}},'['+tt.agent_id+']'),
          React.createElement('span',{onClick:()=>d(tt.id),style:{cursor:'pointer',fontSize:'12px',color:'#ff4444'}},'x'))))};

const DraftWriterW = ({draftText,setDraftText,onSendToAgent,onSaveDraft}) => {
  const m=280;const r=m-draftText.length;const w=r<=40;const o=r<0;
  return React.createElement('div',null,
    React.createElement('textarea',{value:draftText,onChange:e=>setDraftText(e.target.value),placeholder:'Type a draft... (max 280 chars)',maxLength:m,
      style:{width:'100%',height:'80px',padding:'10px',fontSize:'11px',borderRadius:'6px',border:'2px solid rgba(255,183,3,0.2)',background:'rgba(255,183,3,0.03)',color:'#e0d0c0',fontFamily:'monospace',resize:'none',outline:'none',boxSizing:'border-box'}}),
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}},
      React.createElement('span',{style:{fontSize:'10px',color:o?'#ff4444':w?'#ffb703':'#6a5040',fontFamily:'monospace'}},r+' chars left'),
      React.createElement('div',{style:{display:'flex',gap:'4px'}},
        React.createElement('button',{onClick:onSaveDraft,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(46,196,182,0.3)',color:'#2ec4b6',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SAVE'),
        React.createElement('button',{onClick:onSendToAgent,style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',background:'rgba(255,183,3,0.3)',color:'#ffb703',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},'SEND TO AGENT'))))};

const WidgetTabsW = ({tab,setTab}) => React.createElement('div',{style:{display:'flex',gap:'4px'}},
  React.createElement('button',{onClick:()=>setTab('tasks'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='tasks'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='tasks'?'#2ec4b6':'#a08060'}},'TASKS'),
  React.createElement('button',{onClick:()=>setTab('draft'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='draft'?'rgba(255,183,3,0.3)':'rgba(255,255,255,0.05)',color:tab==='draft'?'#ffb703':'#a08060'}},'DRAFT'),
  React.createElement('button',{onClick:()=>setTab('verify'),style:{padding:'4px 10px',fontSize:'10px',borderRadius:'4px',border:'none',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif",background:tab==='verify'?'rgba(46,196,182,0.3)':'rgba(255,255,255,0.05)',color:tab==='verify'?'#2ec4b6':'#a08060'}},'VERIFY'));

const EncryptModalW = ({isOpen,onClose,onEnable,password,setPassword,mode}) => {
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
        React.createElement('button',{onClick:onEnable,style:{padding:'8px 16px',fontSize:'10px',borderRadius:'6px',border:'none',background:'linear-gradient(135deg,#ffb703,#ff6b35)',color:'#000',cursor:'pointer',fontFamily:"'Rubik Mono One', sans-serif"}},mode==='save'?'ENABLE & SAVE':'ENABLE'))))};

`;

c = c.slice(0, appIdx) + '\n' + widgetDefs + c.slice(appIdx);

// Now replace ALL JSX tags: <TaskTracker → {React.createElement(TaskTrackerW
// <DraftWriter → {React.createElement(DraftWriterW
// <WidgetTabs → {React.createElement(WidgetTabsW
// <EncryptModal → {React.createElement(EncryptModalW

// Close JSX: /> → ,null)}
c = c.replace(/<TaskTracker /g, 'React.createElement(TaskTrackerW, ');
c = c.replace(/<DraftWriter /g, 'React.createElement(DraftWriterW, ');
c = c.replace(/<WidgetTabs /g, 'React.createElement(WidgetTabsW, ');
c = c.replace(/<EncryptModal /g, 'React.createElement(EncryptModalW, ');

// Close self-closing: /> → ,null)}
c = c.replace(/\/>/g, ',null)');

// Close non-self-closing (no closing tags needed since we use ,null) approach)
// Actually we need to handle: <Component>...</Component>
// Replace closing tags with nothing since React.createElement handles children
c = c.replace(/<\/TaskTracker>/g, ')');
c = c.replace(/<\/DraftWriter>/g, ')');
c = c.replace(/<\/WidgetTabs>/g, ')');

fs.writeFileSync('C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx', c);
console.log('Done. Size:', c.length);
