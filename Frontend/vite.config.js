import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CRA dev server ran on port 3000 and the backend CORS whitelist (Program.cs)
// only allows :3000, so we pin it and fail loudly instead of hopping to :3001.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
})
