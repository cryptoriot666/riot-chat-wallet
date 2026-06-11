import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { WalletProvider } from '@suiet/wallet-kit'
import '@suiet/wallet-kit/style.css'
import App from './App.jsx'

const isJudgeRoute = window.location.pathname === '/judge'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isJudgeRoute ? (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d0a07', color: '#ff2a6d', fontFamily: "'Rubik Glitch', cursive", fontSize: 24
      }}>
        🔴 Loading... (go to / for the main app)
      </div>
    ) : (
      <WalletProvider>
        <App />
      </WalletProvider>
    )}
  </React.StrictMode>,
)
