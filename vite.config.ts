import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/halap': {
        target: process.env.VITE_HALAPI_PROXY_TARGET || 'https://haldev.cybermeet.fr',
        changeOrigin: true,
        secure: true,
        // No rewrite needed - the path /api/halap/... is forwarded as-is
      },
    },
  },
})
