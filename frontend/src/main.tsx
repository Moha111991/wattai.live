import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import MobileRelay from './pages/MobileRelay'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import Terms from './pages/Terms'
import { registerSW } from 'virtual:pwa-register'

/*
if (window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}
*/

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/mobile" element={<MobileRelay />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const ok = confirm('Ein Update ist verfügbar. Jetzt neu laden?')
    if (ok) updateSW(true)
  },
  onOfflineReady() {
    console.log('App ist offline bereit.')
  }
})
