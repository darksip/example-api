import { AlertCircle, Book, Check, Loader2, Search, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { isConfigured } from '../config/api'
import { useBookPresentations } from '../hooks/useBookPresentations'

/**
 * Parse input text to extract ISBN-13 values.
 * Accepts comma-separated, newline-separated, or whitespace-separated values.
 */
function parseIsbnInput(input: string): string[] {
  return input
    .split(/[,\n\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Demo page for testing the Book Presentations API endpoint.
 *
 * Allows users to:
 * - Enter one or more ISBN-13 values (comma or newline separated)
 * - Submit the request and view results
 * - See which books were found vs not found
 * - View the presentation text for found books
 */
export function BookPresentationsPage() {
  const [inputValue, setInputValue] = useState('')
  const { presentations, isLoading, error, metadata, fetchPresentations, clear } =
    useBookPresentations()
  const configured = isConfigured()

  if (!configured) {
    return (
      <div className="presentations-page">
        <div className="chat-unconfigured">
          <h2>Configuration Required</h2>
          <p>Please configure your API token in Settings.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const isbn13s = parseIsbnInput(inputValue)
    await fetchPresentations(isbn13s)
  }

  const handleClear = () => {
    setInputValue('')
    clear()
  }

  const isbn13s = parseIsbnInput(inputValue)
  const isValidInput = isbn13s.length >= 1 && isbn13s.length <= 100

  return (
    <div className="presentations-page">
      <div className="page-header">
        <div className="page-header-title">
          <h2>
            <Book size={24} />
            Book Presentations
          </h2>
        </div>
      </div>

      <p className="page-description">
        Enter ISBN-13 values to retrieve book presentations. You can enter multiple ISBNs separated
        by commas, newlines, or spaces. Minimum 1, maximum 100 ISBNs per request.
      </p>

      {/* Input Form */}
      <form className="presentations-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="isbn-input">ISBN-13 Values</label>
          <textarea
            id="isbn-input"
            className="presentations-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={'9782070360048\n9782253004226\n9782070368228'}
            rows={5}
            disabled={isLoading}
          />
          <span className="form-hint">
            {isbn13s.length} ISBN{isbn13s.length !== 1 ? 's' : ''} entered
            {isbn13s.length > 100 && ' (max 100)'}
          </span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={!isValidInput || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="btn-spinner" size={16} />
                Fetching...
              </>
            ) : (
              <>
                <Search size={16} />
                Fetch Presentations
              </>
            )}
          </button>
          {(presentations.length > 0 || inputValue) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {metadata && (
        <div className="presentations-results">
          <div className="results-header">
            <h3>Results</h3>
            <div className="results-summary">
              <span className="summary-item summary-found">
                <Check size={14} />
                {metadata.found} found
              </span>
              <span className="summary-item summary-not-found">
                <X size={14} />
                {metadata.notFound} not found
              </span>
            </div>
          </div>

          <div className="presentations-list">
            {presentations.map((item) => (
              <div
                key={item.isbn13}
                className={`presentation-card ${item.found ? 'found' : 'not-found'}`}
              >
                <div className="presentation-header">
                  <span className="presentation-isbn">{item.isbn13}</span>
                  <span
                    className={`presentation-status ${item.found ? 'status-found' : 'status-not-found'}`}
                  >
                    {item.found ? (
                      <>
                        <Check size={12} />
                        Found
                      </>
                    ) : (
                      <>
                        <X size={12} />
                        Not Found
                      </>
                    )}
                  </span>
                </div>
                {item.found && item.presentation && (
                  <p className="presentation-text">{item.presentation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="results-metadata">
            <span>Request ID: {metadata.requestId}</span>
            <span>Timestamp: {new Date(metadata.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
