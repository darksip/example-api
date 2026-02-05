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
      // For SSE, intercept and log events while streaming - TEMPORARY for debugging
      const reader = response.body?.getReader()
      if (!reader) {
        return new Response(null, { status: 500, statusText: 'No response body' })
      }

      const stream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }

            // Pass through the data
            controller.enqueue(value)

            // Also log artifacts events
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6))
                  if (event.type === 'artifacts' && event.data?.books) {
                    console.log('[proxy] SSE artifacts event - Books:')
                    event.data.books.forEach((book: Record<string, unknown>, i: number) => {
                      console.log(`  [${i}] title: ${book.title}, isbn13: ${book.isbn13}, coverUrl: ${book.coverUrl}`)
                    })
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }
        },
      })

      return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // For non-streaming responses, clone and consume the response fully
    // Using clone() to ensure we get the complete body
    const clonedResponse = response.clone()
    const bodyText = await clonedResponse.text()

    // Debug log for JSON responses - TEMPORARY for debugging coverUrl
    if (contentType.includes('application/json')) {
      console.log(`[proxy] JSON response: ${bodyText.length} bytes`)
      try {
        const jsonData = JSON.parse(bodyText)
        // Log books if present (from artifacts or direct response)
        if (jsonData.books) {
          console.log('[proxy] Books in response:')
          jsonData.books.forEach((book: Record<string, unknown>, i: number) => {
            console.log(`  [${i}] title: ${book.title}, isbn13: ${book.isbn13}, coverUrl: ${book.coverUrl}`)
          })
        }
        // Log presentations if present
        if (jsonData.presentations) {
          console.log('[proxy] Presentations in response:')
          jsonData.presentations.forEach((p: Record<string, unknown>, i: number) => {
            console.log(`  [${i}] isbn13: ${p.isbn13}, found: ${p.found}`)
          })
        }
      } catch {
        console.log('[proxy] Could not parse JSON for logging')
      }
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
