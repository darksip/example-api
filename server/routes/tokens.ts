/**
 * Token management routes
 *
 * POST /tokens/register - Register a new token
 * DELETE /tokens/:hash - Delete a stored token
 * GET /tokens - List all registered tokens (hash + apiUrl only)
 */

import { Hono } from 'hono'
import { statements, type TokenListRow } from '../db'
import { hashToken } from '../hash'

const tokens = new Hono()

/**
 * Register a new token
 * Receives the actual token, stores it with its hash, returns the hash
 */
tokens.post('/register', async (c) => {
  const body = await c.req.json<{ token: string; apiUrl: string }>()
  const { token, apiUrl } = body

  if (!token || !apiUrl) {
    return c.json({ error: 'token and apiUrl are required' }, 400)
  }

  // Validate URL format
  try {
    new URL(apiUrl)
  } catch {
    return c.json({ error: 'Invalid apiUrl format' }, 400)
  }

  const hash = hashToken(token)

  try {
    statements.insertToken.run(hash, token, apiUrl)
    console.log(`[tokens] Registered token hash: ${hash.slice(0, 16)}... for ${apiUrl}`)
    return c.json({ hash, apiUrl })
  } catch (err) {
    console.error('[tokens] Failed to register token:', err)
    return c.json({ error: 'Failed to register token' }, 500)
  }
})

/**
 * Delete a token by its hash
 */
tokens.delete('/:hash', (c) => {
  const hash = c.req.param('hash')

  const result = statements.deleteToken.run(hash)

  if (result.changes === 0) {
    return c.json({ error: 'Token not found' }, 404)
  }

  console.log(`[tokens] Deleted token hash: ${hash.slice(0, 16)}...`)
  return c.json({ success: true })
})

/**
 * List all registered tokens (only hash and apiUrl, never the actual token)
 */
tokens.get('/', (c) => {
  const rows = statements.getAllTokens.all() as TokenListRow[]
  return c.json({
    tokens: rows.map((row) => ({
      hash: row.hash,
      apiUrl: row.api_url,
      createdAt: row.created_at,
    })),
  })
})

export { tokens }
