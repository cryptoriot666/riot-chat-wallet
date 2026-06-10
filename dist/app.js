import { createRoot } from 'https://esm.sh/react-dom@18/client'
const { createElement } = React
function App() {
  return createElement('div', {
    style: 'width:100vw;height:100vh;background:#0d0a07;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px'
  },
    createElement('h1', {
      style: 'color:#ff2a6d;font-family:monospace;font-size:32px;text-transform:uppercase;letter-spacing:4px'
    }, '$RIOT FULL APP'),
    createElement('p', {
      style: 'color:#a08060;font-family:monospace;font-size:14px'
    }, 'React rendering via CDN!')
  )
}
createRoot(document.getElementById('root')).render(createElement(App))