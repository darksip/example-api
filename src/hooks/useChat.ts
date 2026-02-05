import { useCallback, useRef, useState } from 'react'
import { halapiClient } from '../config/api'
import type { Artifacts, Message, ToolCall } from '../../halapi-js/src'
import { generateUUID } from '../../halapi-js/src'

interface UseChatOptions {
  initialConversationId?: string
}

interface UseChatReturn {
  messages: Message[]
  isStreaming: boolean
  conversationId: string | null
  error: string | null
  sendMessage: (query: string) => Promise<void>
  stopStreaming: () => void
  loadConversation: (id: string) => Promise<void>
  clearChat: () => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(
    options.initialConversationId || null
  )
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isStreaming) return

      setError(null)

      // Add user message
      const userMessage: Message = {
        id: generateUUID(),
        conversationId: conversationId || '',
        role: 'user',
        content: query,
        createdAt: Date.now(),
      }

      // Add placeholder for assistant response
      const assistantId = generateUUID()
      const assistantMessage: Message = {
        id: assistantId,
        conversationId: conversationId || '',
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      try {
        abortControllerRef.current = new AbortController()

        let fullContent = ''
        let artifacts: Artifacts = { books: [], music: [] }
        let toolCalls: ToolCall[] = []
        let newConversationId = conversationId
        let finalMessageId: string | null = null

        const stream = halapiClient.chatStream({
          query,
          conversationId: conversationId || undefined,
          signal: abortControllerRef.current.signal,
        })

        for await (const event of stream) {
          switch (event.type) {
            case 'text-delta':
              fullContent += event.data.delta
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
              )
              break

            case 'tool-call':
              toolCalls = [
                ...toolCalls,
                {
                  toolCallId: event.data.toolCallId,
                  toolName: event.data.toolName,
                  status: 'pending',
                },
              ]
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m))
              )
              break

            case 'tool-result':
              toolCalls = toolCalls.map((tc) =>
                tc.toolCallId === event.data.toolCallId
                  ? { ...tc, status: event.data.success ? 'success' : 'error' }
                  : tc
              )
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m))
              )
              break

            case 'artifacts':
              artifacts = event.data
              console.log('[useChat] Artifacts received from stream:', artifacts)
              break

            case 'done':
              newConversationId = event.data.conversationId
              finalMessageId = event.data.messageId
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        id: finalMessageId || m.id,
                        conversationId: newConversationId || m.conversationId,
                        content: fullContent,
                        artifacts,
                        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                        isStreaming: false,
                        tokensInput: event.data.totalTokens.input,
                        tokensOutput: event.data.totalTokens.output,
                        executionTimeMs: event.data.executionTimeMs,
                        agentUsed: event.data.agentUsed,
                        modelUsed: event.data.modelUsed,
                      }
                    : m
                )
              )
              if (newConversationId) {
                setConversationId(newConversationId)
              }
              break

            case 'error':
              throw new Error(event.data.message || 'Unknown error from server')
          }
        }

        // Mark as complete if no done event received
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.isStreaming ? { ...m, isStreaming: false, artifacts } : m
          )
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Streaming was stopped by user
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false, content: `${m.content} [stopped]` }
                : m
            )
          )
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred'
          setError(errorMessage)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isStreaming: false,
                    content: `Error: ${errorMessage}`,
                  }
                : m
            )
          )
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [conversationId, isStreaming]
  )

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    try {
      setError(null)
      const response = await halapiClient.getConversation(id)
      setConversationId(id)
      setMessages(
        response.messages.map((m) => ({
          ...m,
          isStreaming: false,
        }))
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation'
      setError(errorMessage)
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    conversationId,
    error,
    sendMessage,
    stopStreaming,
    loadConversation,
    clearChat,
  }
}
