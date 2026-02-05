import { User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ChatInput } from '../components/ChatInput'
import { ChatMessage } from '../components/ChatMessage'
import { isConfigured, type VirtualUser } from '../config/api'
import { useChat } from '../hooks/useChat'

/**
 * Props for the ChatPage component
 */
interface ChatPageProps {
  /**
   * Optional ID of an existing conversation to load and continue.
   * If provided, the conversation history will be loaded on mount.
   * If undefined, starts a new conversation.
   */
  conversationId?: string
  /**
   * Current virtual user (passed from App)
   */
  currentUser: VirtualUser | null
}

/**
 * Main chat interface page for the Halapi application.
 *
 * This component provides the primary chat functionality including:
 * - Displaying chat messages in a scrollable container
 * - Sending new messages via the ChatInput component
 * - Loading existing conversations by ID
 * - Auto-scrolling to the latest message
 * - Starting new chat sessions
 *
 * The page requires API configuration (VITE_HALAPI_TOKEN) to function.
 * If not configured, it displays a configuration required message.
 *
 * @param props - The component props
 * @param props.conversationId - Optional conversation ID to load on mount
 * @returns The rendered chat page component
 *
 * @example
 * // New conversation
 * <ChatPage />
 *
 * @example
 * // Continue existing conversation
 * <ChatPage conversationId="conv_123abc" />
 */
export function ChatPage({ conversationId, currentUser }: ChatPageProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, loadConversation, clearChat } =
    useChat({ initialConversationId: conversationId })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousUserIdRef = useRef<string | null | undefined>(undefined)
  const configured = isConfigured()

  // Load conversation when conversationId changes, or clear chat when switching users
  useEffect(() => {
    const currentUserId = currentUser?.id ?? null
    const userChanged = previousUserIdRef.current !== undefined && previousUserIdRef.current !== currentUserId
    previousUserIdRef.current = currentUserId

    if (conversationId) {
      loadConversation(conversationId)
    } else if (userChanged || messages.length > 0) {
      // Clear chat when user changed or when there are leftover messages
      clearChat()
    }
  }, [conversationId, currentUser?.id, loadConversation, clearChat, messages.length])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!configured) {
    return (
      <div className="chat-page">
        <div className="chat-unconfigured">
          <h2>Configuration Required</h2>
          <p>Please set VITE_HALAPI_TOKEN in your .env file.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>Chat</h2>
        <div className="chat-header-actions">
          {currentUser && (
            <span className="current-user-badge">
              <User size={14} />
              {currentUser.name}
            </span>
          )}
          {messages.length > 0 && (
            <button className="btn btn-secondary" onClick={clearChat} type="button">
              New Chat
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation by asking about books or music.</p>
            <p className="hint">Example: "Recommend me some classic jazz albums"</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} onSuggestionClick={sendMessage} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  )
}
