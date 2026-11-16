import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, requestPersistentStorage } from './pwa'
import { initTheme } from './theme'

initTheme()

registerServiceWorker()
requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
