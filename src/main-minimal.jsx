import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return React.createElement('div', {
    style: { width: '100vw', height: '100vh', background: '#0d0a07', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }
  },
    React.createElement('h1', {
      style: { color: '#ff2a6d', fontFamily: 'monospace', fontSize: '32px', textTransform: 'uppercase', letterSpacing: '4px' }
    }, '$RIOT FULL APP'),
    React.createElement('p', {
      style: { color: '#a08060', fontFamily: 'monospace', fontSize: '14px' }
    }, 'React rendering works!')
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
)