import type { Conversation } from '../../halapi-js/src'

interface ConversationItemProps {
  /** The conversation data to display */
  conversation: Conversation
  /** Callback when the conversation item is clicked */
  onClick: () => void
}

/**
 * Formats a timestamp into a human-readable relative date.
 * Shows time for today, "Yesterday", weekday name for last 7 days,
 * or short date for older dates.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' })
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined,
    })
  }
}

/**
 * Displays a conversation in the conversations list.
 * Shows date, message count, and truncated conversation ID.
 */
export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  return (
    <button className="conversation-item" onClick={onClick} type="button">
      <div className="conversation-info">
        <span className="conversation-date">{formatDate(conversation.updatedAt)}</span>
        <span className="conversation-messages">
          {conversation.messageCount} message
          {conversation.messageCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="conversation-id">ID: {conversation.id.slice(0, 8)}...</div>
    </button>
  )
}
