import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/halap': {
        target: 'https://haldev.cybermeet.fr',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
