import { KeyRound, Loader2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'

interface AuthGateProps {
  isLoading: boolean
  error: string | null
  onAuthenticate: (token: string) => Promise<boolean>
}

export function AuthGate({ isLoading, error, onAuthenticate }: AuthGateProps) {
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim() || isSubmitting) return

    setIsSubmitting(true)
    await onAuthenticate(token.trim())
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-loading">
            <Loader2 className="auth-spinner" size={32} />
            <p>Vérification de l'authentification...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            <KeyRound size={48} />
          </div>
          <h1>Halapi Demo</h1>
          <p>Entrez votre token d'autorisation pour accéder à l'application.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <input
              type="password"
              className="auth-input"
              placeholder="Token d'autorisation"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={!token.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="auth-btn-spinner" size={16} />
                Vérification...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </form>

        <p className="auth-hint">
          Le token est stocké localement et vérifié auprès du serveur.
        </p>
      </div>
    </div>
  )
}
