import { useCallback, useEffect, useState } from 'react'
import { halapiClient, isConfigured } from '../config/api'
import type { Conversation } from '../../halapi-js/src'

interface UseConversationsReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setError('API not configured. Please set URL and token in Settings.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await halapiClient.getConversations()
      setConversations(response.conversations)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
