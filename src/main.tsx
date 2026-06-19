import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
// Spa theme override — loaded only for the Valkyrie Peptides build.
// Set VITE_THEME=spa in the Vercel environment for valkyriepeptides.com.
if (import.meta.env.VITE_THEME === 'spa') {
  import('./themes/spa.css')
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
