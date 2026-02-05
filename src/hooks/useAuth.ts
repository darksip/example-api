import { useCallback, useEffect, useState } from 'react'
import { getExpectedTokenHash } from '../config/api'

const AUTH_STORAGE_KEY = 'halapi_auth_hash'

/**
 * Hash a token using SHA-256
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get stored hash from localStorage
 */
function getStoredHash(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Store hash in localStorage
 */
function storeHash(hash: string): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, hash)
  } catch {
    console.warn('[useAuth] Failed to store auth hash in localStorage')
  }
}

/**
 * Clear stored hash from localStorage
 */
function clearStoredHash(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    console.warn('[useAuth] Failed to clear auth hash from localStorage')
  }
}

interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  authenticate: (token: string) => Promise<boolean>
  logout: () => void
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Verify authentication by comparing stored hash with expected hash
   */
  const verifyAuth = useCallback(async (): Promise<boolean> => {
    const storedHash = getStoredHash()
    if (!storedHash) {
      return false
    }

    // Compare with expected token hash
    const expectedHash = await getExpectedTokenHash()
    if (!expectedHash) {
      // No token configured in env
      return false
    }

    return storedHash === expectedHash
  }, [])

  /**
   * Authenticate with a token
   */
  const authenticate = useCallback(async (token: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)

    try {
      // Hash the provided token
      const inputHash = await hashToken(token)

      // Get expected hash from env token
      const expectedHash = await getExpectedTokenHash()

      if (!expectedHash) {
        setError('Configuration manquante. Le token API n\'est pas configuré.')
        setIsLoading(false)
        return false
      }

      // Compare hashes
      if (inputHash === expectedHash) {
        storeHash(inputHash)
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      } else {
        setError('Token invalide. Veuillez vérifier votre token d\'autorisation.')
        setIsAuthenticated(false)
        setIsLoading(false)
        return false
      }
    } catch {
      setError('Erreur lors de la vérification du token.')
      setIsLoading(false)
      return false
    }
  }, [])

  /**
   * Logout - clear stored authentication
   */
  const logout = useCallback(() => {
    clearStoredHash()
    setIsAuthenticated(false)
    setError(null)
  }, [])

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      const isValid = await verifyAuth()
      setIsAuthenticated(isValid)
      setIsLoading(false)
    }

    checkAuth()
  }, [verifyAuth])

  return {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    logout,
  }
}
