import { useCallback, useEffect, useState } from 'react'
import { getCurrentUser, halapiClient, isConfigured } from '../config/api'
import type { Conversation } from '../../halapi-js/src'

/**
 * Return type for the useConversations hook.
 */
interface UseConversationsReturn {
  /**
   * Array of all conversations for the current user.
   * Each conversation contains metadata like ID, title, and timestamps.
   * The list is sorted by the server (typically most recent first).
   */
  conversations: Conversation[]

  /**
   * Indicates whether the conversations are currently being fetched.
   * Use this to show loading spinners or skeleton UI.
   */
  isLoading: boolean

  /**
   * Current error message, or null if no error has occurred.
   * Errors are cleared when refresh() is called.
   */
  error: string | null

  /**
   * Manually triggers a refresh of the conversation list.
   * Call this after creating a new conversation or when the user
   * explicitly requests a refresh.
   */
  refresh: () => Promise<void>
}

/**
 * A React hook for fetching and managing the list of conversations.
 *
 * This hook provides functionality to:
 * - Automatically fetch conversations on mount (if API is configured)
 * - Manually refresh the conversation list
 * - Track loading and error states
 *
 * The hook checks if the API is properly configured before making requests.
 * If the API URL or token is not set, it will set an error state prompting
 * the user to configure settings.
 *
 * ## Automatic Fetching
 *
 * The hook automatically fetches conversations when:
 * 1. The component mounts
 * 2. The API is configured (URL and token are set)
 *
 * If the API is not configured on mount, no fetch occurs, but the refresh
 * function can be called later once configuration is complete.
 *
 * @returns An object containing conversations list, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * function ConversationList() {
 *   const { conversations, isLoading, error, refresh } = useConversations();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <ul>
 *       {conversations.map(conv => (
 *         <li key={conv.id}>{conv.title}</li>
 *       ))}
 *       <button onClick={refresh}>Refresh</button>
 *     </ul>
 *   );
 * }
 * ```
 */
export function useConversations(): UseConversationsReturn {
  // State for storing the list of conversations
  const [conversations, setConversations] = useState<Conversation[]>([])

  // Loading state for showing progress indicators
  const [isLoading, setIsLoading] = useState(false)

  // Error state for displaying error messages
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches the list of conversations from the API.
   * Checks API configuration before making the request to provide
   * a helpful error message if setup is incomplete.
   */
  const refresh = useCallback(async () => {
    // Guard: Check if API is configured before attempting fetch.
    // This prevents confusing network errors when setup is incomplete.
    if (!isConfigured()) {
      setError('API not configured. Please set URL and token in Settings.')
      return
    }

    setIsLoading(true)
    setError(null) // Clear any previous error

    try {
      // Get current virtual user for filtering
      const currentUser = getCurrentUser()
      // Fetch conversations, filtered by externalUserId if a user is selected
      const response = await halapiClient.getConversations(currentUser?.id, 50)
      setConversations(response.conversations)
    } catch (err) {
      // Handle fetch errors (network issues, auth failures, etc.)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(errorMessage)
    } finally {
      // Always clear loading state, regardless of success or failure
      setIsLoading(false)
    }
  }, [])

  /**
   * Effect: Auto-fetch conversations on mount.
   * Only runs if the API is configured to avoid unnecessary error states
   * when the app first loads without configuration.
   */
  useEffect(() => {
    if (isConfigured()) {
      refresh()
    }
  }, [refresh])

  return {
    conversations,
    isLoading,
    error,
    refresh,
  }
}
