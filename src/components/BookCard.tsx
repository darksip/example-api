import type { Book } from '../types/halapi'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="artifact-card book-card">
      {book.coverUrl && <img src={book.coverUrl} alt={book.title} className="artifact-cover" />}
      <div className="artifact-info">
        <strong className="artifact-title">{book.title}</strong>
        <span className="artifact-author">{book.author}</span>
        {book.year && <span className="artifact-year">({book.year})</span>}
        {book.isbn && <span className="artifact-isbn">ISBN: {book.isbn}</span>}
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
  )
}
