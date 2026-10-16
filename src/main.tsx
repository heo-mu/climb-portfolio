import React from 'react'
import ReactDOM from 'react-dom/client'
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css'
import './styles.css'
import { App } from './App'

// Start at Home unless the URL names a checkpoint. Expedition resolves that
// semantic destination after the scene is ready, including reload/deep links.
history.scrollRestoration = 'manual'
if (location.pathname === '/') {
  window.scrollTo({ top: 0, behavior: 'instant' })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
