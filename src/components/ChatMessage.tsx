import type { Message } from '../types/halapi'
import { BookCard } from './BookCard'
import { MusicCard } from './MusicCard'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasBooks = message.artifacts?.books && message.artifacts.books.length > 0
  const hasMusic = message.artifacts?.music && message.artifacts.music.length > 0

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'Assistant'}</span>
      </div>
      <div className="message-content">
        {message.content}
        {message.isStreaming && <span className="streaming-cursor">|</span>}
      </div>

      {hasMusic && (
        <div className="message-artifacts">
          <h4>Music Recommendations</h4>
          <div className="artifacts-grid">
            {message.artifacts!.music.map((music, i) => (
              <MusicCard key={i} music={music} />
            ))}
          </div>
        </div>
      )}

      {hasBooks && (
        <div className="message-artifacts">
          <h4>Book Recommendations</h4>
          <div className="artifacts-grid">
            {message.artifacts!.books.map((book, i) => (
              <BookCard key={i} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
