import { useEffect, useRef } from 'react'
import { ChatInput } from '../components/ChatInput'
import { ChatMessage } from '../components/ChatMessage'
import { isConfigured } from '../config/api'
import { useChat } from '../hooks/useChat'

interface ChatPageProps {
  conversationId?: string
  onNavigateToSettings: () => void
}

export function ChatPage({ conversationId, onNavigateToSettings }: ChatPageProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, loadConversation, clearChat } =
    useChat({ initialConversationId: conversationId })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const configured = isConfigured()

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    }
  }, [conversationId, loadConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!configured) {
    return (
      <div className="chat-page">
        <div className="chat-unconfigured">
          <h2>Configuration Required</h2>
          <p>Please configure the API URL and token to start chatting.</p>
          <button className="btn btn-primary" onClick={onNavigateToSettings} type="button">
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>Chat</h2>
        {messages.length > 0 && (
          <button className="btn btn-secondary" onClick={clearChat} type="button">
            New Chat
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation by asking about books or music.</p>
            <p className="hint">Example: "Recommend me some classic jazz albums"</p>
          </div>
        ) : (
          messages.map((message) => <ChatMessage key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  )
}
