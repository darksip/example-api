import { ConversationItem } from '../components/ConversationItem'
import { isConfigured } from '../config/api'
import { useConversations } from '../hooks/useConversations'

interface ConversationsPageProps {
  onSelectConversation: (id: string) => void
  onNavigateToSettings: () => void
}

export function ConversationsPage({
  onSelectConversation,
  onNavigateToSettings,
}: ConversationsPageProps) {
  const { conversations, isLoading, error, refresh } = useConversations()
  const configured = isConfigured()

  if (!configured) {
    return (
      <div className="conversations-page">
        <div className="chat-unconfigured">
          <h2>Configuration Required</h2>
          <p>Please configure the API URL and token to view conversations.</p>
          <button className="btn btn-primary" onClick={onNavigateToSettings} type="button">
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="conversations-page">
      <div className="page-header">
        <h2>Conversations</h2>
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
