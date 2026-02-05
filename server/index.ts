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
import type { Context, Next } from 'hono'
import { tokens } from './routes/tokens'
import { proxy } from './routes/proxy'
import { db } from './db'

const isDev = process.env.NODE_ENV !== 'production'
const VITE_DEV_SERVER = 'http://localhost:5174'

// ============================================================================
// Rate Limiter (in-memory, per-IP)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration: 10 requests per minute per IP
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

// Clean up expired entries periodically (every 5 minutes)
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

// Prevent cleanup interval from keeping the process alive
cleanupInterval.unref()

/**
 * Rate limiting middleware for /tokens/* routes
 * Limits to 10 requests per minute per IP
 */
function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
             c.req.header('x-real-ip') ||
             'unknown'

  const now = Date.now()
  const key = `tokens:${ip}`

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt <= now) {
    // Create new window
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    rateLimitStore.set(key, entry)
  } else {
    entry.count++
  }

  // Set rate limit headers
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count)
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000)

  c.header('X-RateLimit-Limit', String(RATE_LIMIT_MAX))
  c.header('X-RateLimit-Remaining', String(remaining))
  c.header('X-RateLimit-Reset', String(resetSeconds))

  if (entry.count > RATE_LIMIT_MAX) {
    c.header('Retry-After', String(resetSeconds))
    return c.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per minute. Try again in ${resetSeconds} seconds.`,
      },
      429
    )
  }

  return next()
}

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check endpoint
app.get('/health', (c) => c.text('OK'))

// Apply rate limiting to /tokens/* routes
app.use('/tokens/*', rateLimiter)

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

const server = serve({ fetch: app.fetch, port })

// ============================================================================
// Graceful Shutdown
// ============================================================================

let isShuttingDown = false

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log(`[${signal}] Shutdown already in progress...`)
    return
  }

  isShuttingDown = true
  console.log(`\n[${signal}] Received shutdown signal, starting graceful shutdown...`)

  try {
    // Stop accepting new connections
    console.log('[Shutdown] Closing HTTP server...')
    server.close((err) => {
      if (err) {
        console.error('[Shutdown] Error closing HTTP server:', err)
      } else {
        console.log('[Shutdown] HTTP server closed')
      }
    })

    // Clear the rate limiter cleanup interval
    clearInterval(cleanupInterval)
    console.log('[Shutdown] Rate limiter cleanup stopped')

    // Close the SQLite database
    console.log('[Shutdown] Closing SQLite database...')
    db.close()
    console.log('[Shutdown] SQLite database closed')

    console.log('[Shutdown] Graceful shutdown complete')
    process.exit(0)
  } catch (error) {
    console.error('[Shutdown] Error during graceful shutdown:', error)
    process.exit(1)
  }
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
