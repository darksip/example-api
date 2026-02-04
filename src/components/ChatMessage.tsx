import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, Music, Suggestion, ToolCall } from '../types/halapi'
import { BookCard } from './BookCard'
import { MusicCard } from './MusicCard'

function getMusicKey(item: Music, index: number): string {
  if (item.type === 'album') {
    const title = item.album ?? item.title ?? index
    const artist = item.artist_name ?? item.artiste ?? item.artist ?? ''
    return `album-${title}-${artist}`
  }
  const title = item.track ?? item.title
  const artist = item.artist_name ?? item.artiste ?? item.artist
  return item.cb_track_id ?? item.cb ?? `track-${title}-${artist}-${index}`
}

interface ChatMessageProps {
  message: Message
  onSuggestionClick?: (query: string) => void
}

function ToolCallIndicator({ toolCall }: { toolCall: ToolCall }) {
  const statusClass =
    toolCall.status === 'success'
      ? 'tool-dot-success'
      : toolCall.status === 'error'
        ? 'tool-dot-error'
        : 'tool-dot-pending'

  return (
    <span className={`tool-dot ${statusClass}`} title={`${toolCall.toolName} (${toolCall.status})`}>
      •
    </span>
  )
}

function SuggestionButton({
  suggestion,
  onClick,
}: {
  suggestion: Suggestion
  onClick: (query: string) => void
}) {
  return (
    <button
      type="button"
      className="suggestion-button"
      onClick={() => onClick(suggestion.query)}
      title={suggestion.query}
    >
      <span className="suggestion-icon">✨</span>
      <span className="suggestion-label">{suggestion.label}</span>
    </button>
  )
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const { artifacts, toolCalls } = message
  const books = artifacts?.books ?? []
  const music = artifacts?.music ?? []
  const suggestions = artifacts?.suggestions ?? []
  const hasMetadata = !isUser && (message.agentUsed || message.modelUsed || message.executionTimeMs)

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'Assistant'}</span>
        {hasMetadata && (
          <span className="message-meta">
            {message.agentUsed && <span className="meta-agent">{message.agentUsed}</span>}
            {message.modelUsed && <span className="meta-model">{message.modelUsed}</span>}
            {message.executionTimeMs && (
              <span className="meta-time">{(message.executionTimeMs / 1000).toFixed(1)}s</span>
            )}
          </span>
        )}
      </div>

      {toolCalls && toolCalls.length > 0 && (
        <div className="tool-calls-indicator">
          {toolCalls.map((tc) => (
            <ToolCallIndicator key={tc.toolCallId} toolCall={tc} />
          ))}
        </div>
      )}

      <div className="message-content">
        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        {message.isStreaming && <span className="streaming-cursor">|</span>}
      </div>

      {music.length > 0 && (
        <div className="message-artifacts">
          <h4>Music Recommendations</h4>
          <div className="artifacts-grid">
            {music.map((item, index) => (
              <MusicCard key={getMusicKey(item, index)} music={item} />
            ))}
          </div>
        </div>
      )}

      {books.length > 0 && (
        <div className="message-artifacts">
          <h4>Book Recommendations</h4>
          <div className="artifacts-grid">
            {books.map((book, index) => (
              <BookCard key={book.isbn ?? `book-${index}`} book={book} />
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && onSuggestionClick && (
        <div className="message-suggestions">
          {suggestions.map((suggestion) => (
            <SuggestionButton
              key={suggestion.label}
              suggestion={suggestion}
              onClick={onSuggestionClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
