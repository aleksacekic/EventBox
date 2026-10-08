import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy u index.html mora da dozvoli adresu backenda (API pozivi, SignalR
// websocket, slike sa /Resources). Adresa se ne pise rucno u index.html, nego dolazi iz
// VITE_API_URL (.env / .env.production), pa produkcioni build automatski dobija pravi domen.
//   %API_ORIGIN%    -> npr. http://localhost:5153   ili https://api.eventbox.rs
//   %API_WS_ORIGIN% -> npr. ws://localhost:5153     ili wss://api.eventbox.rs
function cspIzEnv(apiUrl) {
  const origin = new URL(apiUrl).origin
  const wsOrigin = origin.replace(/^http/, 'ws')
  return {
    name: 'eventbox-csp-api-origin',
    transformIndexHtml: (html) =>
      html.replaceAll('%API_ORIGIN%', origin).replaceAll('%API_WS_ORIGIN%', wsOrigin),
  }
}

// CRA dev server ran on port 3000 and the backend CORS whitelist (Program.cs)
// only allows :3000, so we pin it and fail loudly instead of hopping to :3001.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Ista podrazumevana adresa kao u src/api.js
  const apiUrl = env.VITE_API_URL || 'http://localhost:5153'

  return {
    plugins: [react(), cspIzEnv(apiUrl)],
    server: {
      port: 3000,
      strictPort: true,
      open: true,
    },
  }
})
