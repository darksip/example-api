/**
 * Halapi client configuration for this application
 *
 * Uses localStorage to store token hash and API URL.
 * The actual token is stored server-side in SQLite.
 * All API requests go through the local Hono proxy which injects the real token.
 */

import { createHalapiClient, type HalapiConfig } from '../../halapi-js/src'

const STORAGE_KEY = 'halapi_config'
const VIRTUAL_USERS_KEY = 'halapi_virtual_users'
const CURRENT_USER_KEY = 'halapi_current_user'

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
 * Store config in localStorage (internal use only)
 */
function storeConfig(config: StoredConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/**
 * Clear stored config from localStorage (internal use only)
 */
function clearConfig(): void {
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

// ============================================================================
// Virtual Users Management
// ============================================================================

/**
 * Represents a virtual user for the demo application.
 * Virtual users allow testing multi-tenant scenarios with different externalUserIds.
 */
export interface VirtualUser {
  /** The externalUserId sent to the API (must be unique within the organization) */
  id: string
  /** Display name for the user (defaults to id if not provided) */
  name: string
  /** Timestamp when the user was created */
  createdAt: number
}

/**
 * Get all virtual users from localStorage
 */
export function getVirtualUsers(): VirtualUser[] {
  try {
    const raw = localStorage.getItem(VIRTUAL_USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VirtualUser[]
  } catch {
    return []
  }
}

/**
 * Add a new virtual user to localStorage
 * @param id - The externalUserId (must be unique, responsibility of the integrator)
 * @param name - Optional display name (defaults to id)
 * @returns The created virtual user
 * @throws Error if a user with the same id already exists
 */
export function addVirtualUser(id: string, name?: string): VirtualUser {
  const users = getVirtualUsers()
  if (users.some((u) => u.id === id)) {
    throw new Error(`Un utilisateur avec l'ID "${id}" existe déjà`)
  }

  const newUser: VirtualUser = {
    id,
    name: name?.trim() || id,
    createdAt: Date.now(),
  }

  users.push(newUser)
  localStorage.setItem(VIRTUAL_USERS_KEY, JSON.stringify(users))
  return newUser
}

/**
 * Delete a virtual user from localStorage
 * Also clears the current user if it matches the deleted user
 * @param id - The id of the user to delete
 */
export function deleteVirtualUser(id: string): void {
  const users = getVirtualUsers().filter((u) => u.id !== id)
  localStorage.setItem(VIRTUAL_USERS_KEY, JSON.stringify(users))

  // Clear current user if it was the deleted one
  const currentId = localStorage.getItem(CURRENT_USER_KEY)
  if (currentId === id) {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
}

/**
 * Get the currently selected virtual user
 * @returns The current virtual user, or null if none selected
 */
export function getCurrentUser(): VirtualUser | null {
  const currentId = localStorage.getItem(CURRENT_USER_KEY)
  if (!currentId) return null

  const users = getVirtualUsers()
  return users.find((u) => u.id === currentId) || null
}

/**
 * Set the current virtual user
 * @param id - The id of the user to set as current, or null to clear
 */
export function setCurrentUser(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    localStorage.setItem(CURRENT_USER_KEY, id)
  }
}
