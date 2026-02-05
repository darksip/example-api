/**
 * Settings page for managing API configuration.
 *
 * This component provides token registration and management functionality:
 * - Register a new API token with a custom API URL
 * - View the current stored configuration (API URL and token hash)
 * - Delete the stored token to reset configuration
 *
 * The token is stored securely on the server, with only the hash
 * kept locally to identify the user's configuration.
 *
 * @module SettingsPage
 */

import { AlertCircle, Check, Loader2, Settings, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import {
  deleteToken,
  getStoredConfig,
  registerToken,
  type StoredConfig,
} from '../config/api'

/**
 * Settings page component for token registration and management.
 *
 * Displays either:
 * - A registration form if no token is configured
 * - Current configuration details with a delete option if configured
 *
 * @returns The rendered settings page component
 *
 * @example
 * <SettingsPage />
 */
export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('https://haldev.cybermeet.fr')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState<StoredConfig | null>(null)

  // Load current config on mount
  useEffect(() => {
    setCurrentConfig(getStoredConfig())
  }, [])

  /**
   * Handles the token registration form submission.
   *
   * Validates the input, registers the token with the API,
   * and updates the local configuration state on success.
   *
   * @param e - The form submission event
   */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim() || !apiUrl.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const config = await registerToken(token.trim(), apiUrl.trim())
      setCurrentConfig(config)
      setToken('')
      setSuccess('Token enregistré avec succès')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'enregistrement du token')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the token deletion action.
   *
   * Removes the stored token from the server and clears
   * the local configuration state. Shows success/error feedback.
   */
  const handleDelete = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteToken()
      setCurrentConfig(null)
      setSuccess('Token supprimé')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la suppression du token')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <div className="settings-icon">
            <Settings size={48} />
          </div>
          <h1>Configuration</h1>
          <p>Gérez votre connexion à l'API Halapi</p>
        </div>

        {/* Success/Error messages */}
        {error && (
          <div className="settings-message settings-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="settings-message settings-success">
            <Check size={16} />
            {success}
          </div>
        )}

        {currentConfig ? (
          /* Current configuration display */
          <div className="settings-current">
            <h2>Configuration actuelle</h2>
            <div className="settings-info">
              <div className="settings-info-row">
                <span className="settings-label">API URL</span>
                <span className="settings-value">{currentConfig.apiUrl}</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-label">Token Hash</span>
                <span className="settings-value settings-hash">
                  {currentConfig.tokenHash.slice(0, 16)}...
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger settings-delete"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="btn-spinner" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              Supprimer le token
            </button>
          </div>
        ) : (
          /* Registration form */
          <form className="settings-form" onSubmit={handleRegister}>
            <div className="settings-field">
              <label htmlFor="apiUrl">URL de l'API</label>
              <input
                id="apiUrl"
                type="url"
                className="settings-input"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://haldev.cybermeet.fr"
                disabled={isLoading}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="token">Token API</label>
              <input
                id="token"
                type="password"
                className="settings-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="hap_sk_live_..."
                disabled={isLoading}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary settings-submit"
              disabled={!token.trim() || !apiUrl.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="btn-spinner" size={16} />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le token'
              )}
            </button>
          </form>
        )}

        <p className="settings-hint">
          Le token est stocké de manière sécurisée sur le serveur. Seul son hash
          est conservé localement pour identifier votre configuration.
        </p>
      </div>
    </div>
  )
}
