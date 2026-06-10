// memwal-integration.jsx - Bridge between App and MemWal client
import { useState, useEffect } from 'react'
import {
  initMemWal,
  memwalRemember,
  memwalRecall,
  memwalAnalyze,
  memwalCrossAgentRecall,
  isMemWalReady,
  getMemWalHealth
} from './memwal-client'

// Cross-agent memory hook
export function useCrossAgentMemory(walletAddress) {
  const [memory, setMemory] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!walletAddress) return
    setLoading(true)
    memwalCrossAgentRecall(walletAddress, 'ALL', 10)
      .then(result => { setMemory(result); setLoading(false) })
      .catch(() => setLoading(false))
  }, [walletAddress])

  return { memory, loading }
}

// Cross-agent indicator component
export function CrossAgentIndicator({ agentCount, visitedAgents, currentAgentId }) {
  if (!visitedAgents || visitedAgents.length === 0) return null
  return (
    <div style={{
      fontSize: '9px', color: '#6a5040', fontFamily: "'Rubik Mono One', sans-serif",
      display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px'
    }}>
      <span style={{ color: '#2ec4b6' }}>LINK</span>
    </div>
  )
}

// Handoff banner component
export function HandoffBanner({ handoffMessage, fromAgentName, toAgentName }) {
  return (
    <div style={{
      padding: '8px 16px', background: 'rgba(255,42,109,0.1)',
      border: '2px solid rgba(255,42,109,0.3)', borderRadius: '8px',
      fontSize: '12px', color: '#ff2a6d', fontFamily: "'Rubik Mono One', sans-serif",
      textAlign: 'center', marginBottom: '8px'
    }}>
      {fromAgentName} to {toAgentName}: {handoffMessage}
    </div>
  )
}

export { memwalRemember, memwalRecall, memwalAnalyze, initMemWal, isMemWalReady, getMemWalHealth }
