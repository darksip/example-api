/**
 * Halapi client configuration for this application
 *
 * Uses the halapi-js SDK with a custom Vite/Docker adapter
 */

import { createHalapiClient, type ConfigProvider, type HalapiConfig } from '../../halapi-js/src'

// Runtime config is injected by Docker entrypoint into window.__ENV__
declare global {
  interface Window {
    __ENV__?: {
      VITE_HALAPI_URL?: string
      VITE_HALAPI_TOKEN?: string
    }
  }
}

/**
 * Get environment variable from Docker runtime config or Vite env
 */
function getEnvVar(name: string): string {
  // First check runtime config (Docker), then Vite env vars
  if (typeof window !== 'undefined' && window.__ENV__?.[name as keyof typeof window.__ENV__]) {
    return window.__ENV__[name as keyof typeof window.__ENV__] || ''
  }
  return import.meta.env[name] || ''
}

/**
 * Vite/Docker configuration adapter
 */
const viteAdapter: ConfigProvider = (): HalapiConfig => ({
  apiUrl: getEnvVar('VITE_HALAPI_URL'),
  apiToken: getEnvVar('VITE_HALAPI_TOKEN'),
})

/**
 * Pre-configured Halapi client instance
 */
export const halapiClient = createHalapiClient(viteAdapter)

/**
 * Check if the API is configured (has a token)
 */
export function isConfigured(): boolean {
  const token = getEnvVar('VITE_HALAPI_TOKEN')
  return Boolean(token)
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get the SHA-256 hash of the expected token (from env)
 * Used to verify user-provided token without exposing the actual token
 */
export async function getExpectedTokenHash(): Promise<string | null> {
  const token = getEnvVar('VITE_HALAPI_TOKEN')
  if (!token) {
    return null
  }
  return hashString(token)
}

// Re-export types that components may need
export type { HalapiConfig }
