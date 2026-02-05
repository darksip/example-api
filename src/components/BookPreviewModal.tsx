import { AlertCircle, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Book } from '../../halapi-js/src'
import { halapiClient } from '../config/api'

interface BookPreviewModalProps {
  /** The book to preview */
  book: Book
  /** Callback when modal is closed */
  onClose: () => void
}

/**
 * Modal dialog that displays a book preview with its presentation.
 * Fetches the presentation from the API when opened.
 */
export function BookPreviewModal({ book, onClose }: BookPreviewModalProps) {
  const [presentation, setPresentation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch presentation when modal opens
  useEffect(() => {
    const fetchPresentation = async () => {
      const isbn = book.isbn13 || book.isbn
      if (!isbn) {
        setError('No ISBN available for this book')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await halapiClient.getBookPresentations([isbn])
        const result = response.presentations[0]
        if (result?.found && result.presentation) {
          setPresentation(result.presentation)
        } else {
          setError('No presentation available for this book')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch presentation'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresentation()
  }, [book.isbn13, book.isbn])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content book-preview-modal">
        <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
          <X size={20} />
        </button>

        <div className="book-preview-header">
          {book.coverUrl && (
            <img src={book.coverUrl} alt={book.title} className="book-preview-cover" />
          )}
          <div className="book-preview-info">
            <h2 className="book-preview-title">{book.title}</h2>
            <p className="book-preview-author">{book.author}</p>
            {book.year && <span className="book-preview-year">{book.year}</span>}
            {(book.isbn13 || book.isbn) && (
              <span className="book-preview-isbn">ISBN: {book.isbn13 || book.isbn}</span>
            )}
          </div>
        </div>

        <div className="book-preview-body">
          {isLoading && (
            <div className="book-preview-loading">
              <Loader2 className="btn-spinner" size={24} />
              <span>Loading presentation...</span>
            </div>
          )}

          {error && (
            <div className="book-preview-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {presentation && (
            <div className="book-preview-presentation">
              <h3>Presentation</h3>
              <p>{presentation}</p>
            </div>
          )}

          {book.description && (
            <div className="book-preview-description">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}

          {book.subjects && book.subjects.length > 0 && (
            <div className="book-preview-subjects">
              <h3>Subjects</h3>
              <div className="artifact-tags">
                {book.subjects.map((subject) => (
                  <span key={subject} className="artifact-tag">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
