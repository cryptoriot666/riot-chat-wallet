import React from 'react'

const RIOT_PINK = '#ff2a6d'

export default function App() {
  const [input, setInput] = React.useState('')

  return React.createElement('div', {
    style: { width: '100vw', height: '100vh', background: '#0d0a07', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }
  },
    React.createElement('div', {
      style: { padding: '20px', borderBottom: '2px solid rgba(255,42,109,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }
    },
      React.createElement('h1', {
        style: { fontFamily: 'monospace', fontSize: '24px', color: RIOT_PINK, margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }
      }, '$RIOT'),
      React.createElement('span', { style: { fontSize: '12px', color: '#6a5040' } }, 'DISCONNECTED'),
      React.createElement('button', {
        style: { padding: '8px 16px', background: 'linear-gradient(135deg, #ff2a6d, #ff6b35)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', textTransform: 'uppercase' }
      }, 'CONNECT WALLET')
    ),
    React.createElement('div', {
      style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }
    },
      React.createElement('h2', {
        style: { fontFamily: 'monospace', fontSize: '28px', color: RIOT_PINK, textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 0 20px rgba(255,42,109,0.5)' }
      }, 'RESURRECTION MACHINE'),
      React.createElement('p', {
        style: { fontSize: '14px', color: '#a08060', maxWidth: '400px', textAlign: 'center', lineHeight: '1.8' }
      }, 'Dead JPEGs can become living agents. Your NFT has been waiting. Wake it up.'),
      React.createElement('button', {
        style: { padding: '12px 28px', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', color: '#a08060', borderRadius: '10px', cursor: 'pointer', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px' }
      }, 'TRY DEMO')
    ),
    React.createElement('div', {
      style: { padding: '20px 30px', borderTop: '2px solid rgba(255,42,109,0.2)', display: 'flex', gap: '12px' }
    },
      React.createElement('input', {
        value: input,
        onChange: e => setInput(e.target.value),
        placeholder: 'Connect wallet to chat',
        disabled: true,
        style: { flex: 1, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }
      }),
      React.createElement('button', {
        disabled: true,
        style: { padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'not-allowed', fontSize: '14px', fontFamily: 'monospace' }
      }, 'SEND')
    )
  )
}
