/**
 * Token resolver middleware
 *
 * Reads X-Token-Hash header, looks up the actual token from SQLite,
 * and adds it to the request context for use by proxy routes.
 */

import { createMiddleware } from 'hono/factory'
import { statements, type TokenRow } from '../db'

export interface TokenContext {
  token: string
  apiUrl: string
}

/**
 * Middleware that resolves a token hash to actual credentials
 * Stores the resolved token in c.var.tokenContext
 */
export const tokenResolver = createMiddleware<{
  Variables: { tokenContext: TokenContext }
}>(async (c, next) => {
  const tokenHash = c.req.header('X-Token-Hash')

  if (!tokenHash) {
    return c.json({ error: 'X-Token-Hash header required' }, 401)
  }

  const row = statements.getToken.get(tokenHash) as TokenRow | undefined

  if (!row) {
    return c.json({ error: 'Invalid token hash - token not registered' }, 401)
  }

  c.set('tokenContext', { token: row.token, apiUrl: row.api_url })
  await next()
})
