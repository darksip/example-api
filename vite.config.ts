import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_HALAPI_PROXY_TARGET || 'https://haldev.cybermeet.fr'

  console.log('[vite] Proxy target:', proxyTarget)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/halap': {
          target: proxyTarget,
        changeOrigin: true,
        secure: true,
        // No rewrite needed - the path /api/halap/... is forwarded as-is
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxy] Request:', req.method, req.url, '-> target:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[proxy] Response:', req.url, 'status:', proxyRes.statusCode);

            // Pour les requêtes d'artifacts, logger le body de la réponse
            if (req.url?.includes('/artifacts/')) {
              let body = '';
              proxyRes.on('data', (chunk: Buffer) => {
                body += chunk.toString('utf8');
              });
              proxyRes.on('end', () => {
                console.log('[proxy] Artifacts response body:', body);
              });
            }
          });
        },
      },
    },
  },
}})
