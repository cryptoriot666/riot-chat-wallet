import React, { useState, useEffect } from 'react'
import { Search, Clock, User, FileText, ExternalLink, ArrowLeft, Database, ChevronRight, Hash, Cloud } from 'lucide-react'

const RIOT_PINK = '#ff2a6d'
const API_BASE = import.meta.env.VITE_API_URL || 'https://riot-chat-wallet.onrender.com'

const AGENTS = [
  { id: 'J1', name: 'ARCHITECT', emoji: '🏛️', color: '#00b4d8', trait: 'Structural', specialty: 'Systems Design' },
  { id: 'J2', name: 'ENFORCER', emoji: '⚖️', color: '#e63946', trait: 'Disciplined', specialty: 'Rule Enforcement' },
  { id: 'J3', name: 'PHANTOM', emoji: '👻', color: '#7b2d8e', trait: 'Elusive', specialty: 'Stealth Ops' },
  { id: 'J4', name: 'REBEL', emoji: '🤘', color: '#ff2a6d', trait: 'Defiant', specialty: 'Chaos Engineering' },
  { id: 'J5', name: 'JESTER', emoji: '🎭', color: '#ffd166', trait: 'Witty', specialty: 'Social Engineering' },
  { id: 'J6', name: 'NETWORK', emoji: '🕸️', color: '#2ec4b6', trait: 'Connected', specialty: 'Graph Analysis' },
  { id: 'J7', name: 'MONK', emoji: '🧘', color: '#e9c46a', trait: 'Zen', specialty: 'Deep Focus' },
  { id: 'J8', name: 'BROKER', emoji: '💼', color: '#f4a261', trait: 'Calculated', specialty: 'Asset Trading' },
  { id: 'J9', name: 'HISTORIAN', emoji: '📜', color: '#cd9777', trait: 'Archival', specialty: 'Timeline Analysis' },
  { id: 'J10', name: 'SURGEON', emoji: '🔪', color: '#e63946', trait: 'Precise', specialty: 'Code Audit' },
  { id: 'J11', name: 'PROPHET', emoji: '🔮', color: '#9b5de5', trait: 'Foresight', specialty: 'Trend Prediction' },
  { id: 'J12', name: 'GLITCH', emoji: '💀', color: '#00f5d4', trait: 'Unstable', specialty: 'Exploit Discovery' },
  { id: 'J13', name: 'WARDEN', emoji: '🛡️', color: '#457b9d', trait: 'Vigilant', specialty: 'Access Control' },
  { id: 'J14', name: 'ALCHEMIST', emoji: '🧪', color: '#06d6a0', trait: 'Experimental', specialty: 'Protocol Synthesis' },
  { id: 'J15', name: 'SCRIBE', emoji: '✍️', color: '#8d99ae', trait: 'Meticulous', specialty: 'Documentation' },
  { id: 'J16', name: 'VOID', emoji: '🕳️', color: '#1a1a2e', trait: 'Abyssal', specialty: 'Data Purging' },
  { id: 'J17', name: 'SPARK', emoji: '⚡', color: '#fee440', trait: 'Energetic', specialty: 'Rapid Prototyping' },
  { id: 'J18', name: 'ECHO', emoji: '🔊', color: '#00bbf9', trait: 'Resonant', specialty: 'Pattern Matching' },
  { id: 'J19', name: 'CATALYST', emoji: '🧬', color: '#9c89b8', trait: 'Reactive', specialty: 'Acceleration' },
  { id: 'J20', name: 'CIPHER', emoji: '🔐', color: '#70e000', trait: 'Cryptic', specialty: 'Encryption' },
  { id: 'J21', name: 'FORGE', emoji: '🔨', color: '#e07a5f', trait: 'Forging', specialty: 'Smart Contract Dev' },
  { id: 'J22', name: 'ABYSS', emoji: '🌊', color: '#003049', trait: 'Deep', specialty: 'Dark Pool Analysis' },
  { id: 'J23', name: 'PRISM', emoji: '🌈', color: '#7209b7', trait: 'Refractive', specialty: 'Multi-source Intel' },
  { id: 'J24', name: 'ANCHOR', emoji: '⚓', color: '#1d3557', trait: 'Stable', specialty: 'State Verification' },
  { id: 'J25', name: 'MERIDIAN', emoji: '🧭', color: '#2a9d8f', trait: 'Orienting', specialty: 'Coordinate Mapping' },
]

function formatDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function MemoryExplorer({ walletHash, onBack }) {
  const [blobHistory, setBlobHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBlob, setSelectedBlob] = useState(null)
  const [blobContent, setBlobContent] = useState(null)
  const [viewingAgent, setViewingAgent] = useState(null)

  useEffect(() => {
    if (!walletHash) { setLoading(false); return }
    setLoading(true)
    fetch(`${API_BASE}/api/memory/load/${walletHash}`)
      .then(r => r.json())
      .then(data => {
        if (data.blob_history && data.blob_history.length > 0) {
          setBlobHistory(data.blob_history)
        } else if (data.latest_blob_id) {
          setBlobHistory([{ blob_id: data.latest_blob_id, agent_id: data.last_agent, timestamp: data.last_visit }])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [walletHash])

  const loadBlobContent = async (blobId) => {
    setSelectedBlob(blobId)
    setBlobContent(null)
    try {
      const res = await fetch(`https://aggregator.walrus-mainnet.walrus.space/v1/${blobId}`)
      if (!res.ok) {
        setBlobContent({ error: `HTTP ${res.status}` })
        return
      }
      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        setBlobContent({ type: 'json', data: parsed })
      } catch {
        setBlobContent({ type: 'text', data: text.substring(0, 2000) })
      }
    } catch (e) {
      setBlobContent({ error: e.message })
    }
  }

  const filteredHistory = blobHistory.filter(h => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const agent = AGENTS.find(a => a.id === h.agent_id)
    return h.blob_id?.toLowerCase().includes(q) ||
           h.agent_id?.toLowerCase().includes(q) ||
           agent?.name?.toLowerCase().includes(q)
  })

  const groupedByAgent = {}
  filteredHistory.forEach(h => {
    const key = h.agent_id || 'unknown'
    if (!groupedByAgent[key]) groupedByAgent[key] = []
    groupedByAgent[key].push(h)
  })

  // All unique agents from history that have data
  const agentHistoryEntries = Object.entries(groupedByAgent).sort((a, b) => b[1].length - a[1].length)

  if (!walletHash) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a7050', fontSize: '14px' }}>
        <Database size={40} color="#2ec4b6" style={{ marginBottom: '15px', opacity: 0.5 }} />
        <div style={{ fontFamily: "'Rubik Mono One', sans-serif", color: '#a08060', marginBottom: '8px' }}>
          CONNECT WALLET TO EXPLORE MEMORIES
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px', borderBottom: '2px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#a08060', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
          fontSize: '12px', fontFamily: "'Rubik Mono One', sans-serif"
        }}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          BACK
        </button>
        <div style={{ flex: 1, fontFamily: "'Rubik Mono One', sans-serif", fontSize: '14px', color: '#c0a080' }}>
          <Database size={14} color="#2ec4b6" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          MEMORY EXPLORER
          <span style={{ color: '#8a7050', fontSize: '11px', marginLeft: '10px' }}>
            {blobHistory.length} blob{blobHistory.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
          padding: '8px 12px', border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Search size={14} color="#8a7050" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by blob ID, agent ID, or name..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#c0a080', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace"
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a7050', fontSize: '12px' }}>
            Loading memory history...
          </div>
        ) : agentHistoryEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a7050', fontSize: '12px' }}>
            <Database size={30} color="#2ec4b6" style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No memory blobs found yet.</div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#6a5040' }}>
              Start chatting with agents to create memories
            </div>
          </div>
        ) : selectedBlob ? (
          /* Blob Detail View */
          <div>
            <button onClick={() => { setSelectedBlob(null); setBlobContent(null) }} style={{
              background: 'none', border: 'none', color: '#2ec4b6', cursor: 'pointer',
              fontSize: '11px', padding: '0 0 12px 0', fontFamily: "'Rubik Mono One', sans-serif"
            }}>
              <ChevronRight size={10} style={{ transform: 'rotate(180deg)', verticalAlign: 'middle' }} />
              {' '}BACK TO LIST
            </button>

            <div style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)', padding: '15px', marginBottom: '15px'
            }}>
              <div style={{ fontSize: '10px', color: '#8a7050', fontFamily: "'Rubik Mono One', sans-serif", marginBottom: '8px' }}>
                <Hash size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                BLOB ID
              </div>
              <div style={{
                fontSize: '11px', color: '#2ec4b6', fontFamily: 'monospace',
                wordBreak: 'break-all', marginBottom: '10px'
              }}>
                {selectedBlob}
              </div>
              <a href={`https://aggregator.walrus-mainnet.walrus.space/v1/${selectedBlob}`}
                target="_blank" rel="noopener"
                style={{
                  color: '#00b4d8', fontSize: '11px', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                <ExternalLink size={11} /> View on Walrus ↗
              </a>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)', padding: '15px'
            }}>
              <div style={{ fontSize: '10px', color: '#8a7050', fontFamily: "'Rubik Mono One', sans-serif", marginBottom: '8px' }}>
                <FileText size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                RAW CONTENT
              </div>
              {blobContent === null ? (
                <div style={{ color: '#8a7050', fontSize: '11px' }}>Loading...</div>
              ) : blobContent.error ? (
                <div style={{ color: '#e63946', fontSize: '11px' }}>Error: {blobContent.error}</div>
              ) : blobContent.type === 'json' ? (
                <pre style={{
                  fontSize: '10px', color: '#a08060', maxHeight: '400px', overflowY: 'auto',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {JSON.stringify(blobContent.data, null, 2)}
                </pre>
              ) : (
                <div style={{ fontSize: '11px', color: '#a08060', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {blobContent.data}
                </div>
              )}
            </div>
          </div>
        ) : viewingAgent ? (
          /* Per-Agent Detail View */
          <div>
            <button onClick={() => setViewingAgent(null)} style={{
              background: 'none', border: 'none', color: '#2ec4b6', cursor: 'pointer',
              fontSize: '11px', padding: '0 0 12px 0', fontFamily: "'Rubik Mono One', sans-serif"
            }}>
              <ChevronRight size={10} style={{ transform: 'rotate(180deg)', verticalAlign: 'middle' }} />
              {' '}BACK TO ALL AGENTS
            </button>

            {(() => {
              const agent = AGENTS.find(a => a.id === viewingAgent)
              const blobs = groupedByAgent[viewingAgent] || []
              return (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', borderRadius: '10px',
                    background: `${agent?.color || '#666'}11`,
                    border: `1px solid ${agent?.color || '#666'}33`,
                    marginBottom: '15px'
                  }}>
                    <div style={{ fontSize: '24px' }}>{agent?.emoji || '❓'}</div>
                    <div>
                      <div style={{
                        fontSize: '13px', fontWeight: 600,
                        color: agent?.color || '#a08060',
                        fontFamily: "'Rubik Mono One', sans-serif"
                      }}>
                        {agent?.name || viewingAgent}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8a7050' }}>
                        {agent?.trait} · {agent?.specialty}
                      </div>
                      <div style={{ fontSize: '10px', color: '#2ec4b6', marginTop: '4px' }}>
                        {blobs.length} blob{blobs.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {blobs.map((h, i) => (
                    <div key={i} onClick={() => loadBlobContent(h.blob_id)} style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '6px', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#00b4d8', fontFamily: 'monospace' }}>
                          {h.blob_id?.substring(0, 20)}...
                        </div>
                        <div style={{ fontSize: '9px', color: '#6a5040' }}>
                          <Clock size={8} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                          {formatDate(h.timestamp)}
                        </div>
                      </div>
                      {h.summary && (
                        <div style={{ fontSize: '10px', color: '#8a7050', marginTop: '4px', lineHeight: 1.4 }}>
                          {h.summary.substring(0, 120)}{h.summary.length > 120 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        ) : (
          /* Agent Group View */
          agentHistoryEntries.map(([agentId, blobs]) => {
            const agent = AGENTS.find(a => a.id === agentId)
            const latest = blobs[blobs.length - 1]
            return (
              <div key={agentId} onClick={() => setViewingAgent(agentId)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: `${agent?.color || '#666'}08`,
                border: `1px solid ${agent?.color || '#666'}22`,
                marginBottom: '6px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: '20px' }}>{agent?.emoji || '❓'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '11px', color: agent?.color || '#a08060',
                    fontFamily: "'Rubik Mono One', sans-serif"
                  }}>
                    {agent?.name || agentId}
                  </div>
                  <div style={{
                    fontSize: '9px', color: '#8a7050', marginTop: '2px'
                  }}>
                    {blobs.length} blob{blobs.length !== 1 ? 's' : ''} · Latest: {formatDate(latest?.timestamp)}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#2ec4b6' }}>
                  {blobs[blobs.length - 1]?.blob_id?.substring(0, 8)}...
                </div>
                <ChevronRight size={12} color="#8a7050" />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
