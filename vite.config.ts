import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/halap': {
        target: process.env.VITE_HALAPI_URL || 'https://haldev.cybermeet.fr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/halap/, ''),
      },
    },
  },
})
