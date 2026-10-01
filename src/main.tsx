import React from 'react'
import ReactDOM from 'react-dom/client'
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css'
import './styles.css'
import { App } from './App'

// A new document always starts the journey at Home. SPA detail/back navigation
// stays separate and can still restore its in-memory position.
history.scrollRestoration = 'manual'
if (location.pathname === '/') {
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
  window.scrollTo({ top: 0, behavior: 'instant' })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
