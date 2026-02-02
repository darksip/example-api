import { useCallback, useEffect, useState } from 'react'
import { isConfigured } from '../config/api'
import { getConversations } from '../services/halapi'
import type { Conversation } from '../types/halapi'

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
      const response = await getConversations()
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
