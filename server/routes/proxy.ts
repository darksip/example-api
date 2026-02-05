/**
 * API proxy routes
 *
 * Proxies all /api/halap/* requests to the actual Halapi API
 * using the token resolved from the X-Token-Hash header.
 */

import { Hono } from 'hono'
import { tokenResolver, type TokenContext } from '../middleware/tokenResolver'

const proxy = new Hono<{ Variables: { tokenContext: TokenContext } }>()

// Apply token resolution to all proxy routes
proxy.use('/*', tokenResolver)

/**
 * Proxy handler for all API requests
 * Forwards the request to the target API with the resolved Bearer token
 */
proxy.all('/*', async (c) => {
  const { token, apiUrl } = c.get('tokenContext')

  // Build target URL: apiUrl + the path after /api/halap
  // c.req.path is the full path including /api/halap
  const path = c.req.path
  const targetUrl = `${apiUrl}${path}`

  // Clone headers, add authorization, remove internal headers
  const headers = new Headers()
  c.req.raw.headers.forEach((value, key) => {
    // Skip hop-by-hop headers and internal headers
    // Also skip accept-encoding to prevent compression issues with SSE
    const skipHeaders = ['host', 'x-token-hash', 'connection', 'keep-alive', 'transfer-encoding', 'accept-encoding']
    if (!skipHeaders.includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Host', new URL(apiUrl).host)

  // Include query string in the target URL
  const queryString = new URL(c.req.url).search
  const fullTargetUrl = `${targetUrl}${queryString}`
  console.log(`[proxy] ${c.req.method} ${path}${queryString} -> ${fullTargetUrl}`)

  try {
    const response = await fetch(fullTargetUrl, {
      method: c.req.method,
      headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      duplex: 'half',
    })

    console.log(`[proxy] Response: ${response.status}`)

    // Create response headers, preserving important ones
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      // Skip hop-by-hop headers and content-encoding (we don't decompress)
      const skipResponseHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'content-encoding']
      if (!skipResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    // Check if this is a streaming response (SSE)
    const contentType = response.headers.get('content-type') || ''
    const isStreaming = contentType.includes('text/event-stream')

    if (isStreaming) {
      // For SSE, stream the response body directly
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // For non-streaming responses, clone and consume the response fully
    // Using clone() to ensure we get the complete body
    const clonedResponse = response.clone()
    const bodyText = await clonedResponse.text()

    // Debug log for JSON responses
    if (contentType.includes('application/json')) {
      console.log(`[proxy] JSON response: ${bodyText.length} bytes, complete: ${bodyText.endsWith('}') || bodyText.endsWith(']')}`)
    }

    // Set explicit content-length to ensure full transmission
    responseHeaders.set('Content-Length', String(Buffer.byteLength(bodyText, 'utf8')))

    return new Response(bodyText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error(`[proxy] Error proxying request:`, err)
    return c.json(
      { error: 'Failed to proxy request', details: err instanceof Error ? err.message : 'Unknown error' },
      502
    )
  }
})

export { proxy }
