import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose SUPABASE_* to import.meta.env alongside VITE_* (anon key is safe for browser).
  envPrefix: ['VITE_', 'SUPABASE_'],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
})
