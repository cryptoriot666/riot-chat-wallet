const fs = require('fs');
const p = 'C:/Users/nandacamp/.openclaw/workspace/riot-chat-wallet-temp/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// Hapus import widgets line
const importLine = "import { TaskTracker, DraftWriter, WidgetTabs, EncryptModal } from './widgets'\n";
if (c.startsWith(importLine)) {
  c = c.slice(importLine.length);
  console.log('Removed import line from start');
}

// Cek apakah widgets impor ada di posisi lain
const importIdx = c.indexOf(importLine);
if (importIdx >= 0) {
  c = c.slice(0, importIdx) + c.slice(importIdx + importLine.length);
  console.log('Removed import line at', importIdx);
}

// Inline functions before export default function App
const appIdx = c.indexOf('export default function App');

const inline = [
  'function TaskTracker({tasks,setTasks,agents,onSave}){const[i,si]=React.useState(\'\');const[f,sf]=React.useState(\'ALL\');',
  'const a=()=>{if(!i.trim())return;setTasks(p=>[...p,{id:Date.now(),text:i.trim(),done:false,agent_id:f===\'ALL\'?\'J4\':f}]);si(\'\')};',
  'const t=(id)=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));const d=(id)=>setTasks(p=>p.filter(t=>t.id!==id));',
  'const l=f===\'ALL\'?tasks:tasks.filter(t=>t.agent_id===f);return React.createElement(\'div\',null,',
  'React.createElement(\'div\',{style:{display:\'flex\',gap:\'6px\',marginBottom:\'12px\'}},',
  'React.createElement(\'input\',{value:i,onChange:e=>si(e.target.value),placeholder:\'New task...\',maxLength:60,',
  'style:{flex:1,padding:\'6px 10px\',fontSize:\'11px\',borderRadius:\'4px\',border:\'1px solid rgba(255,255,255,0.1)\',',
  'background:\'rgba(255,255,255,0.03)\',color:\'#e0d0c0\',fontFamily:\'monospace\',outline:\'none\'},',
  'onKeyDown:e=>{if(e.key===\'Enter\')a()}}),',
  'React.createElement(\'select\',{value:f,onChange:e=>{const v=e.target.value;v===\'ALL\'?sf(\'ALL\'):sf(v)},',
  'style:{padding:\'6px\',fontSize:\'10px\',borderRadius:\'4px\',border:\'1px solid rgba(255,255,255,0.1)\',',
  'background:\'rgba(0,0,0,0.5)\',color:\'#a08060\',fontFamily:\'monospace\',maxWidth:\'52px\'}},',
  'React.createElement(\'option\',{value:\'ALL\'},\'ALL\'),agents&&agents.slice(0,10).map(a=>React.createElement(\'option\',{key:a.id,value:a.id},a.id))),',
  'React.createElement(\'button\',{onClick:a,style:{padding:\'6px 10px\',fontSize:\'10px\',borderRadius:\'4px\',border:\'none\',',
  'background:\'rgba(46,196,182,0.3)\',color:\'#2ec4b6\',cursor:\'pointer\',fontFamily:"\'Rubik Mono One\', sans-serif"}},\'+\')),',
  'l.length===0?React.createElement(\'div\',{style:{fontSize:\'11px\',color:\'#6a5040\',textAlign:\'center\',padding:\'20px\',fontFamily:\'monospace\'}},\'no tasks yet\'):',
  'l.map(t=>React.createElement(\'div\',{key:t.id,style:{display:\'flex\',alignItems:\'center\',gap:\'8px\',padding:\'6px 0\',borderBottom:\'1px solid rgba(255,255,255,0.04)\'}},',
  'React.createElement(\'input\',{type:\'checkbox\',checked:t.done,onChange:()=>t(t.id),style:{accentColor:\'#2ec4b6\',width:\'14px\',height:\'14px\'}}),',
  'React.createElement(\'span\',{style:{flex:1,fontSize:\'11px\',color:t.done?\'#6a5040\':\'#e0d0c0\',textDecoration:t.done?\'line-through\':\'none\',fontFamily:\'monospace\'}},t.text),',
  'React.createElement(\'span\',{style:{fontSize:\'9px\',color:\'#00b4d8\',fontFamily:\'monospace\'}},\'[\'+t.agent_id+\']\'),',
  'React.createElement(\'span\',{onClick:()=>d(t.id),style:{cursor:\'pointer\',fontSize:\'12px\',color:\'#ff4444\'}},\'x\'))))}',
].join('\n');

const inline2 = [
  '',
  'function DraftWriter({draftText,setDraftText,onSendToAgent,onSaveDraft}){',
  'const m=280;const r=m-draftText.length;const w=r<=40;const o=r<0;',
  'return React.createElement(\'div\',null,',
  'React.createElement(\'textarea\',{value:draftText,onChange:e=>setDraftText(e.target.value),',
  'placeholder:\'Type a draft... (max 280 chars)\',maxLength:m,',
  'style:{width:\'100%\',height:\'80px\',padding:\'10px\',fontSize:\'11px\',borderRadius:\'6px\',',
  'border:\'2px solid rgba(255,183,3,0.2)\',background:\'rgba(255,183,3,0.03)\',color:\'#e0d0c0\',fontFamily:\'monospace\',resize:\'none\',outline:\'none\',boxSizing:\'border-box\'}}),',
  'React.createElement(\'div\',{style:{display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\',marginTop:\'6px\'}},',
  'React.createElement(\'span\',{style:{fontSize:\'10px\',color:o?\'#ff4444\':w?\'#ffb703\':\'#6a5040\',fontFamily:\'monospace\'}},r+\' chars left\'),',
  'React.createElement(\'div\',{style:{display:\'flex\',gap:\'4px\'}},',
  'React.createElement(\'button\',{onClick:onSaveDraft,style:{padding:\'4px 10px\',fontSize:\'10px\',borderRadius:\'4px\',',
  'border:\'none\',background:\'rgba(46,196,182,0.3)\',color:\'#2ec4b6\',cursor:\'pointer\',fontFamily:"\'Rubik Mono One\', sans-serif"}},\'SAVE\'),',
  'React.createElement(\'button\',{onClick:onSendToAgent,style:{padding:\'4px 10px\',fontSize:\'10px\',borderRadius:\'4px\',',
  'border:\'none\',background:\'rgba(255,183,3,0.3)\',color:\'#ffb703\',cursor:\'pointer\',fontFamily:"\'Rubik Mono One\', sans-serif"}},\'SEND TO AGENT\'))))}',
].join('\n');

const inline3 = [
  '',
  'function EncryptModal({isOpen,onClose,onEnable,password,setPassword,mode}){',
  'if(!isOpen)return null;',
  'return React.createElement(\'div\',{style:{position:\'fixed\',top:0,left:0,right:0,bottom:0,background:\'rgba(0,0,0,0.85)\',',
  'display:\'flex\',alignItems:\'center\',justifyContent:\'center\',zIndex:9999},onClick:onClose},',
  'React.createElement(\'div\',{style:{background:\'linear-gradient(180deg,#0d0a07 0%,#1a1209 100%)\',',
  'border:\'2px solid rgba(255,183,3,0.3)\',borderRadius:\'12px\',padding:\'24px\',maxWidth:\'380px\',width:\'90%\'},onClick:e=>e.stopPropagation()},',
  'React.createElement(\'h3\',{style:{fontFamily:"\'Rubik Glitch\', cursive",fontSize:\'14px\',color:\'#ffb703\',margin:\'0 0 16px 0\',textShadow:\'0 0 10px rgba(255,183,3,0.4)\'}},\'SEAL ENCRYPTION\'),',
  'React.createElement(\'p\',{style:{fontSize:\'11px\',color:\'#a08060\',fontFamily:\'monospace\',marginBottom:\'12px\'}},\'Set a password to encrypt your memory with AES-256-CTR before storing to Walrus.\'),',
  'React.createElement(\'input\',{type:\'password\',value:password,onChange:e=>setPassword(e.target.value),placeholder:\'Encryption password...\',',
  'style:{width:\'100%\',padding:\'10px\',fontSize:\'12px\',borderRadius:\'6px\',border:\'2px solid rgba(255,183,3,0.2)\',',
  'background:\'rgba(0,0,0,0.5)\',color:\'#e0d0c0\',fontFamily:\'monospace\',outline:\'none\',boxSizing:\'border-box\',marginBottom:\'16px\'},',
  'onKeyDown:e=>{if(e.key===\'Enter\')onEnable()}}),',
  'React.createElement(\'div\',{style:{display:\'flex\',gap:\'8px\',justifyContent:\'flex-end\'}},',
  'React.createElement(\'button\',{onClick:()=>{onClose();setPassword(\'\')},style:{padding:\'8px 16px\',fontSize:\'10px\',',
  'borderRadius:\'6px\',border:\'2px solid rgba(255,255,255,0.1)\',background:\'transparent\',color:\'#a08060\',cursor:\'pointer\',fontFamily:"\'Rubik Mono One\', sans-serif"}},\'CANCEL\'),',
  'React.createElement(\'button\',{onClick:onEnable,style:{padding:\'8px 16px\',fontSize:\'10px\',borderRadius:\'6px\',border:\'none\',',
  'background:\'linear-gradient(135deg,#ffb703,#ff6b35)\',color:\'#000\',cursor:\'pointer\',fontFamily:"\'Rubik Mono One\', sans-serif"}},',
  'mode===\'save\'?\'ENABLE & SAVE\':\'ENABLE\'))))}',
].join('\n');

const allInlines = inline + inline2 + inline3 + '\n';
c = c.slice(0, appIdx) + allInlines + c.slice(appIdx);
fs.writeFileSync(p, c);
console.log('Inline functions inserted. File size:', c.length);
