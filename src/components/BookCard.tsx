import { useState } from 'react'
import type { Book } from '../../halapi-js/src'
import { BookPreviewModal } from './BookPreviewModal'

interface BookCardProps {
  /** The book data to display */
  book: Book
}

/**
 * Displays a book recommendation card.
 * Shows cover image, title, author, year, ISBN, description, and subjects.
 * Clicking the card opens a preview modal with the book's presentation.
 */
export function BookCard({ book }: BookCardProps) {
  const [showPreview, setShowPreview] = useState(false)

  const hasIsbn = Boolean(book.isbn13 || book.isbn)

  return (
    <>
      <div
        className={`artifact-card book-card ${hasIsbn ? 'clickable' : ''}`}
        onClick={hasIsbn ? () => setShowPreview(true) : undefined}
        role={hasIsbn ? 'button' : undefined}
        tabIndex={hasIsbn ? 0 : undefined}
        onKeyDown={
          hasIsbn
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setShowPreview(true)
                }
              }
            : undefined
        }
      >
        {book.coverUrl && <img src={book.coverUrl} alt={book.title} className="artifact-cover" />}
        <div className="artifact-info">
          <strong className="artifact-title">{book.title}</strong>
          <span className="artifact-author">{book.author}</span>
          {book.year && <span className="artifact-year">({book.year})</span>}
          {(book.isbn13 || book.isbn) && (
            <span className="artifact-isbn">ISBN: {book.isbn13 || book.isbn}</span>
          )}
          {book.description && <p className="artifact-description">{book.description}</p>}
          {book.subjects && book.subjects.length > 0 && (
            <div className="artifact-tags">
              {book.subjects.map((subject) => (
                <span key={subject} className="artifact-tag">
                  {subject}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPreview && <BookPreviewModal book={book} onClose={() => setShowPreview(false)} />}
    </>
  )
}
