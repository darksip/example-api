import { useCallback, useState } from 'react'
import { halapiClient, isConfigured } from '../config/api'
import type { BookPresentation } from '../../halapi-js/src'

/**
 * Metadata from a book presentations response
 */
interface PresentationsMetadata {
  requestId: string
  timestamp: string
  requested: number
  found: number
  notFound: number
}

/**
 * Return type for the useBookPresentations hook.
 */
interface UseBookPresentationsReturn {
  /** Array of book presentation results */
  presentations: BookPresentation[]
  /** Loading state */
  isLoading: boolean
  /** Error message or null */
  error: string | null
  /** Metadata from the last successful request */
  metadata: PresentationsMetadata | null
  /** Fetch presentations for the given ISBNs */
  fetchPresentations: (isbn13s: string[]) => Promise<void>
  /** Clear all state */
  clear: () => void
}

/**
 * A React hook for fetching book presentations by ISBN-13.
 *
 * This hook provides functionality to:
 * - Fetch presentations for multiple ISBN-13 values
 * - Track loading and error states
 * - Clear results
 *
 * @returns An object containing presentations, loading state, error, metadata, and control functions
 *
 * @example
 * ```tsx
 * const { presentations, isLoading, error, fetchPresentations } = useBookPresentations()
 *
 * const handleSubmit = async (isbns: string[]) => {
 *   await fetchPresentations(isbns)
 * }
 * ```
 */
export function useBookPresentations(): UseBookPresentationsReturn {
  const [presentations, setPresentations] = useState<BookPresentation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PresentationsMetadata | null>(null)

  const fetchPresentations = useCallback(async (isbn13s: string[]) => {
    if (!isConfigured()) {
      setError('API not configured. Please set URL and token in Settings.')
      return
    }

    // Client-side validation
    if (!isbn13s || isbn13s.length === 0) {
      setError('Please enter at least one ISBN-13')
      return
    }
    if (isbn13s.length > 100) {
      setError('Maximum 100 ISBN-13s allowed')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await halapiClient.getBookPresentations(isbn13s)
      setPresentations(response.presentations)
      setMetadata(response.metadata)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch presentations'
      setError(errorMessage)
      setPresentations([])
      setMetadata(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setPresentations([])
    setError(null)
    setMetadata(null)
  }, [])

  return {
    presentations,
    isLoading,
    error,
    metadata,
    fetchPresentations,
    clear,
  }
}
