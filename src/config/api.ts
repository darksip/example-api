/**
 * Halapi client configuration for this application
 *
 * Uses localStorage to store token hash and API URL.
 * The actual token is stored server-side in SQLite.
 * All API requests go through the local Hono proxy which injects the real token.
 */

import { createHalapiClient, type HalapiConfig } from '../../halapi-js/src'

const STORAGE_KEY = 'halapi_config'

/**
 * Configuration stored in localStorage
 */
export interface StoredConfig {
  /** SHA-256 hash of the token (used to identify the token on the server) */
  tokenHash: string
  /** Original API URL (for display purposes) */
  apiUrl: string
}

/**
 * Get stored config from localStorage
 */
export function getStoredConfig(): StoredConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredConfig
  } catch {
    return null
  }
}

/**
 * Store config in localStorage
 */
export function storeConfig(config: StoredConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/**
 * Clear stored config from localStorage
 */
export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if the API is configured (has a stored token hash)
 */
export function isConfigured(): boolean {
  return getStoredConfig() !== null
}

/**
 * Custom fetch that adds X-Token-Hash header to all requests
 * This allows the Hono proxy to look up the actual token from SQLite
 */
function createFetchWithTokenHash(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const config = getStoredConfig()
    if (!config) {
      return Promise.reject(new Error('Not configured - please register a token in Settings'))
    }

    const headers = new Headers(init?.headers)
    headers.set('X-Token-Hash', config.tokenHash)

    return fetch(input, { ...init, headers })
  }
}

/**
 * Proxy configuration adapter
 * Uses empty apiUrl (relative URLs) since the Hono server proxies requests
 * The apiToken is a placeholder - actual auth is via X-Token-Hash header
 */
const proxyAdapter = (): HalapiConfig => ({
  apiUrl: '', // Empty = relative URLs, proxied by Hono
  apiToken: 'via-proxy', // Placeholder - real token looked up by server
})

/**
 * Pre-configured Halapi client instance
 * Uses custom fetch to inject X-Token-Hash header
 */
export const halapiClient = createHalapiClient(proxyAdapter, {
  customFetch: createFetchWithTokenHash(),
})

/**
 * Register a token with the server
 * The server stores the actual token and returns its hash
 */
export async function registerToken(token: string, apiUrl: string): Promise<StoredConfig> {
  const response = await fetch('/tokens/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, apiUrl }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to register token' }))
    throw new Error(error.error || 'Failed to register token')
  }

  const { hash } = await response.json()
  const config: StoredConfig = { tokenHash: hash, apiUrl }
  storeConfig(config)
  return config
}

/**
 * Delete the current token from the server and clear local storage
 */
export async function deleteToken(): Promise<void> {
  const config = getStoredConfig()
  if (!config) return

  try {
    await fetch(`/tokens/${config.tokenHash}`, { method: 'DELETE' })
  } catch {
    // Ignore errors - clear local storage anyway
  }

  clearConfig()
}

// Re-export types that components may need
export type { HalapiConfig }
