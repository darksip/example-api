/**
 * Halapi Demo Server
 *
 * Hono-based server that:
 * - Manages API tokens in SQLite
 * - Proxies API requests with token injection
 * - Serves the frontend static files (prod) or proxies to Vite (dev)
 */

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { tokens } from './routes/tokens'
import { proxy } from './routes/proxy'

const isDev = process.env.NODE_ENV !== 'production'
const VITE_DEV_SERVER = 'http://localhost:5173'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check endpoint
app.get('/health', (c) => c.text('OK'))

// Token management routes
app.route('/tokens', tokens)

// API proxy routes (must be before static files)
app.route('/api/halap', proxy)

if (isDev) {
  // In development, proxy all other requests to Vite dev server
  app.all('*', async (c) => {
    const url = new URL(c.req.url)
    const targetUrl = `${VITE_DEV_SERVER}${url.pathname}${url.search}`

    try {
      const response = await fetch(targetUrl, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
        // @ts-ignore
        duplex: 'half',
      })

      const headers = new Headers(response.headers)
      return new Response(response.body, {
        status: response.status,
        headers,
      })
    } catch {
      return c.text('Vite dev server not running. Start it with: npm run dev:client', 502)
    }
  })
} else {
  // In production, serve static files from dist/
  app.use('/*', serveStatic({ root: './dist' }))
  // SPA fallback - serve index.html for client-side routes
  app.get('*', serveStatic({ path: './dist/index.html' }))
}

const port = Number(process.env.PORT) || 3333

console.log(`
╔═══════════════════════════════════════════════╗
║         Halapi Demo Server                    ║
╠═══════════════════════════════════════════════╣
║  Server running on http://localhost:${port}      ║
║  Mode: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}                          ║
${isDev ? `║  Vite proxy: ${VITE_DEV_SERVER}            ║\n` : ''}╚═══════════════════════════════════════════════╝
`)

serve({ fetch: app.fetch, port })
