import { useCallback, useRef, useState } from 'react'
import { halapiClient } from '../config/api'
import type { Artifacts, Message, ToolCall } from '../../halapi-js/src'
import { generateUUID } from '../../halapi-js/src'

/**
 * Configuration options for the useChat hook.
 */
interface UseChatOptions {
  /**
   * Optional conversation ID to initialize the chat with.
   * If provided, the hook will use this ID for subsequent messages.
   * If not provided, a new conversation will be created on the first message.
   */
  initialConversationId?: string
}

/**
 * Return type for the useChat hook, containing state and control functions.
 */
interface UseChatReturn {
  /**
   * Array of all messages in the current conversation, including both user
   * and assistant messages. Messages are ordered chronologically.
   */
  messages: Message[]

  /**
   * Indicates whether a streaming response is currently in progress.
   * When true, the assistant is actively generating a response.
   */
  isStreaming: boolean

  /**
   * The current conversation ID, or null if no conversation has been started.
   * This ID is set after the first message is sent or when loading an existing conversation.
   */
  conversationId: string | null

  /**
   * Current error message, or null if no error has occurred.
   * Errors are cleared when a new message is sent or when clearChat is called.
   */
  error: string | null

  /**
   * Sends a user message and initiates a streaming response from the assistant.
   * Creates the conversation if one doesn't exist yet.
   * @param query - The user's message text to send
   */
  sendMessage: (query: string) => Promise<void>

  /**
   * Stops the current streaming response by aborting the underlying request.
   * The partial response will be preserved with "[stopped]" appended.
   */
  stopStreaming: () => void

  /**
   * Loads an existing conversation by ID, replacing current messages.
   * @param id - The conversation ID to load
   */
  loadConversation: (id: string) => Promise<void>

  /**
   * Clears all messages, resets the conversation ID, and clears any errors.
   * Use this to start a fresh conversation.
   */
  clearChat: () => void
}

/**
 * A React hook for managing chat conversations with streaming support.
 *
 * This hook provides complete chat functionality including:
 * - Sending messages with real-time streaming responses
 * - Handling tool calls and their results during streaming
 * - Managing conversation state and history
 * - Aborting in-progress streams
 * - Loading existing conversations
 *
 * ## Stream Event Types
 *
 * The hook processes the following server-sent event types during streaming:
 *
 * - **text-delta**: Incremental text content from the assistant.
 *   Contains `{ delta: string }` with the new text chunk to append.
 *
 * - **tool-call**: Indicates the assistant is invoking a tool.
 *   Contains `{ toolCallId: string, toolName: string }`.
 *   The tool call is initially marked as "pending".
 *
 * - **tool-result**: The result of a previously invoked tool.
 *   Contains `{ toolCallId: string, success: boolean }`.
 *   Updates the corresponding tool call status to "success" or "error".
 *
 * - **artifacts**: Structured data extracted from the response.
 *   Contains `{ books: Array, music: Array }` or similar domain objects.
 *
 * - **done**: Signals the stream has completed successfully.
 *   Contains final metadata including `conversationId`, `messageId`,
 *   `totalTokens`, `executionTimeMs`, `agentUsed`, and `modelUsed`.
 *
 * - **error**: Indicates an error occurred during streaming.
 *   Contains `{ message: string }` with the error description.
 *
 * ## AbortController Usage
 *
 * The hook uses an AbortController to support cancellation of streaming requests.
 * When `stopStreaming()` is called:
 * 1. The AbortController's `abort()` method is invoked
 * 2. The underlying fetch request is cancelled
 * 3. An AbortError is caught and handled gracefully
 * 4. The partial response is preserved with "[stopped]" appended
 * 5. The AbortController ref is reset to null for the next request
 *
 * @param options - Configuration options for the hook
 * @returns An object containing chat state and control functions
 *
 * @example
 * ```tsx
 * const { messages, isStreaming, sendMessage, stopStreaming } = useChat();
 *
 * // Send a message
 * await sendMessage("Hello, how are you?");
 *
 * // Stop streaming if needed
 * if (isStreaming) {
 *   stopStreaming();
 * }
 * ```
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  // State for storing all messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([])

  // Tracks whether a streaming response is currently in progress
  const [isStreaming, setIsStreaming] = useState(false)

  // The current conversation ID, initialized from options or null for new conversations
  const [conversationId, setConversationId] = useState<string | null>(
    options.initialConversationId || null
  )

  // Stores any error that occurred during the last operation
  const [error, setError] = useState<string | null>(null)

  // Ref to hold the AbortController for the current streaming request.
  // This allows stopStreaming() to cancel the request at any time.
  // Using a ref instead of state because we don't need re-renders when it changes.
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Sends a message to the chat API and processes the streaming response.
   * This function handles the complete lifecycle of a chat interaction:
   * 1. Validates input and guards against concurrent requests
   * 2. Creates optimistic UI updates for user and assistant messages
   * 3. Initiates the streaming request with abort support
   * 4. Processes each stream event type and updates state accordingly
   * 5. Handles errors and cleanup
   */
  const sendMessage = useCallback(
    async (query: string) => {
      // Guard: Ignore empty messages or concurrent requests
      if (!query.trim() || isStreaming) return

      // Clear any previous error before starting a new request
      setError(null)

      // Create the user message with a temporary UUID.
      // The actual message ID will be confirmed by the server, but we use this
      // for optimistic UI rendering.
      const userMessage: Message = {
        id: generateUUID(),
        conversationId: conversationId || '',
        role: 'user',
        content: query,
        createdAt: Date.now(),
      }

      // Create a placeholder message for the assistant's response.
      // This ID is temporary and will be updated when the stream completes
      // with the 'done' event containing the server-assigned ID.
      const assistantId = generateUUID()
      const assistantMessage: Message = {
        id: assistantId,
        conversationId: conversationId || '',
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true, // Indicates this message is still being generated
      }

      // Optimistically add both messages to the UI immediately
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      try {
        // Create a new AbortController for this request.
        // Store it in a ref so stopStreaming() can access it.
        abortControllerRef.current = new AbortController()

        // Accumulators for building the complete response from stream events
        let fullContent = '' // Accumulates text-delta events
        let artifacts: Artifacts = { books: [], music: [] } // Populated by artifacts event
        let toolCalls: ToolCall[] = [] // Tracks tool-call and tool-result events
        let newConversationId = conversationId // Updated by done event for new conversations
        let finalMessageId: string | null = null // Server-assigned message ID from done event

        // Initiate the streaming request.
        // The signal allows us to abort the request when stopStreaming() is called.
        const stream = halapiClient.chatStream({
          query,
          conversationId: conversationId || undefined,
          signal: abortControllerRef.current.signal,
        })

        // Process each event from the async iterator stream.
        // Events arrive in real-time as the server generates the response.
        for await (const event of stream) {
          switch (event.type) {
            // TEXT-DELTA: Incremental text content from the LLM.
            // Each delta is a small chunk of text that should be appended
            // to the accumulated content.
            case 'text-delta':
              fullContent += event.data.delta
              // Update the message in state to show real-time typing effect
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
              )
              break

            // TOOL-CALL: The assistant is invoking a tool/function.
            // This event fires when the LLM decides to use a tool.
            // We add it to our tracking array with 'pending' status.
            case 'tool-call':
              toolCalls = [
                ...toolCalls,
                {
                  toolCallId: event.data.toolCallId,
                  toolName: event.data.toolName,
                  status: 'pending', // Will be updated to 'success' or 'error' by tool-result
                },
              ]
              // Update UI to show the pending tool call
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m))
              )
              break

            // TOOL-RESULT: The result of a previously called tool.
            // Updates the status of the matching tool call based on success/failure.
            case 'tool-result':
              toolCalls = toolCalls.map((tc) =>
                tc.toolCallId === event.data.toolCallId
                  ? { ...tc, status: event.data.success ? 'success' : 'error' }
                  : tc
              )
              // Update UI to reflect the tool execution result
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m))
              )
              break

            // ARTIFACTS: Structured data extracted from the response.
            // Contains domain-specific objects like books or music recommendations.
            // Stored and attached to the message when streaming completes.
            case 'artifacts':
              artifacts = event.data
              console.log('[useChat] Artifacts received from stream:', artifacts)
              break

            // DONE: The stream has completed successfully.
            // Contains final metadata about the completed response.
            // This is where we finalize the message with server-provided IDs and metadata.
            case 'done':
              newConversationId = event.data.conversationId
              finalMessageId = event.data.messageId
              // Replace the temporary message with the finalized version
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        // Replace temporary ID with server-assigned ID
                        id: finalMessageId || m.id,
                        // Update conversation ID (important for new conversations)
                        conversationId: newConversationId || m.conversationId,
                        content: fullContent,
                        artifacts,
                        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                        isStreaming: false, // Mark as complete
                        // Attach usage metadata for analytics/display
                        tokensInput: event.data.totalTokens.input,
                        tokensOutput: event.data.totalTokens.output,
                        executionTimeMs: event.data.executionTimeMs,
                        agentUsed: event.data.agentUsed,
                        modelUsed: event.data.modelUsed,
                      }
                    : m
                )
              )
              // Update conversation ID state for subsequent messages
              if (newConversationId) {
                setConversationId(newConversationId)
              }
              break

            // ERROR: The server encountered an error during streaming.
            // Convert to an exception so it's handled by the catch block.
            case 'error':
              throw new Error(event.data.message || 'Unknown error from server')
          }
        }

        // Fallback: Mark as complete if no 'done' event was received.
        // This handles edge cases where the stream ends without a proper done event.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.isStreaming ? { ...m, isStreaming: false, artifacts } : m
          )
        )
      } catch (err) {
        // Handle different error scenarios
        if (err instanceof Error && err.name === 'AbortError') {
          // AbortError: User intentionally stopped the stream via stopStreaming().
          // This is not an error condition - preserve the partial response and mark it.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false, content: `${m.content} [stopped]` }
                : m
            )
          )
        } else {
          // Actual error: Could be network failure, server error, or stream error event.
          // Display the error in the message content and set the error state.
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
        // Always clean up streaming state, regardless of success or failure
        setIsStreaming(false)
        // Reset the AbortController ref for the next request
        abortControllerRef.current = null
      }
    },
    // Dependencies: re-create callback when these values change
    [conversationId, isStreaming]
  )

  /**
   * Stops the current streaming response by aborting the underlying request.
   *
   * How AbortController cancellation works:
   * 1. When called, this invokes abort() on the current AbortController
   * 2. The abort signal propagates to the fetch request in chatStream()
   * 3. The for-await loop throws an AbortError
   * 4. The catch block in sendMessage detects AbortError by checking err.name
   * 5. The partial response is preserved with "[stopped]" appended
   *
   * This is safe to call even when not streaming - the optional chaining
   * handles the case where abortControllerRef.current is null.
   */
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  /**
   * Loads an existing conversation from the server and replaces current state.
   * Fetches all messages for the specified conversation ID and updates the UI.
   *
   * @param id - The conversation ID to load
   */
  const loadConversation = useCallback(async (id: string) => {
    try {
      setError(null)
      // Fetch the full conversation including all messages
      const response = await halapiClient.getConversation(id)
      setConversationId(id)
      // Map messages and ensure isStreaming is false for all loaded messages
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

  /**
   * Clears all chat state to start a fresh conversation.
   * Resets messages, conversation ID, and error state.
   * Does not affect any in-progress streaming (call stopStreaming first if needed).
   */
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
