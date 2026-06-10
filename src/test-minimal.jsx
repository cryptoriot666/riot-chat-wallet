import React from 'react'
import ReactDOM from 'react-dom/client'

const App = () => React.createElement('h1', {
  style: { color: '#ff2a6d', fontFamily: 'monospace', padding: '40px', textAlign: 'center' }
}, 'RIOT APP WORKS!')

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App))
