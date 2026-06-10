import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const JudgeDemo = lazy(() => import('./JudgeDemo.jsx'))

const isJudgeRoute = window.location.pathname === '/judge'

const fallback = (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0d0a07', color: '#ff2a6d', fontFamily: 'monospace', fontSize: 18
  }}>
    Loading...
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isJudgeRoute ? (
      <Suspense fallback={fallback}>
        <JudgeDemo />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
)
