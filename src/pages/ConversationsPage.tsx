import { Filter } from 'lucide-react'
import { ConversationItem } from '../components/ConversationItem'
import { isConfigured, type VirtualUser } from '../config/api'
import { useConversations } from '../hooks/useConversations'

/**
 * Props for the ConversationsPage component
 */
interface ConversationsPageProps {
  /**
   * Callback invoked when a user selects a conversation from the list.
   * Typically used to navigate to the ChatPage with the selected conversation.
   * @param id - The unique identifier of the selected conversation
   */
  onSelectConversation: (id: string) => void
  /**
   * Current virtual user (passed from App)
   */
  currentUser: VirtualUser | null
}

/**
 * Conversation history list page for the Halapi application.
 *
 * This component displays a list of all previous conversations and allows users to:
 * - View their conversation history
 * - Select a conversation to continue chatting
 * - Refresh the conversation list
 *
 * The page requires API configuration (VITE_HALAPI_TOKEN) to function.
 * If not configured, it displays a configuration required message.
 *
 * @param props - The component props
 * @param props.onSelectConversation - Callback when a conversation is selected
 * @returns The rendered conversations page component
 *
 * @example
 * <ConversationsPage
 *   onSelectConversation={(id) => navigateToChat(id)}
 * />
 */
export function ConversationsPage({ onSelectConversation, currentUser }: ConversationsPageProps) {
  const { conversations, isLoading, error, refresh } = useConversations()
  const configured = isConfigured()

  if (!configured) {
    return (
      <div className="conversations-page">
        <div className="chat-unconfigured">
          <h2>Configuration Required</h2>
          <p>Please set VITE_HALAPI_TOKEN in your .env file.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="conversations-page">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Conversations</h2>
          {currentUser && (
            <span className="filter-badge">
              <Filter size={12} />
              {currentUser.name}
            </span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={refresh} disabled={isLoading} type="button">
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="conversations-list">
        {isLoading && conversations.length === 0 ? (
          <div className="loading">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-list">
            <p>No conversations yet.</p>
            <p className="hint">Start a chat to create your first conversation.</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
