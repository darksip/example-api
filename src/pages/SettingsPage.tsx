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

import { AlertCircle, Check, Loader2, Plus, Settings, Trash2, User } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import {
  addVirtualUser,
  deleteToken,
  deleteVirtualUser,
  getStoredConfig,
  getVirtualUsers,
  registerToken,
  type StoredConfig,
  type VirtualUser,
} from '../config/api'

/**
 * Props for the SettingsPage component
 */
interface SettingsPageProps {
  /**
   * Callback invoked when virtual users list changes (add/delete)
   */
  onUsersChange: () => void
}

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
 * <SettingsPage onUsersChange={() => refreshUsers()} />
 */
export function SettingsPage({ onUsersChange }: SettingsPageProps) {
  const [apiUrl, setApiUrl] = useState('https://haldev.cybermeet.fr')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState<StoredConfig | null>(null)

  // Virtual users state
  const [virtualUsers, setVirtualUsers] = useState<VirtualUser[]>([])
  const [newUserId, setNewUserId] = useState('')
  const [newUserName, setNewUserName] = useState('')

  // Load current config and virtual users on mount
  useEffect(() => {
    setCurrentConfig(getStoredConfig())
    setVirtualUsers(getVirtualUsers())
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

  /**
   * Handles adding a new virtual user.
   */
  const handleAddUser = (e: FormEvent) => {
    e.preventDefault()
    if (!newUserId.trim()) return

    setError(null)
    setSuccess(null)

    try {
      const user = addVirtualUser(newUserId.trim(), newUserName.trim() || undefined)
      setVirtualUsers(getVirtualUsers())
      setNewUserId('')
      setNewUserName('')
      setSuccess(`Utilisateur "${user.name}" ajouté`)
      onUsersChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'utilisateur")
    }
  }

  /**
   * Handles deleting a virtual user.
   */
  const handleDeleteUser = (id: string) => {
    setError(null)
    setSuccess(null)

    deleteVirtualUser(id)
    setVirtualUsers(getVirtualUsers())
    setSuccess('Utilisateur supprimé')
    onUsersChange()
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

        {/* Virtual Users Section - only show when configured */}
        {currentConfig && (
          <div className="virtual-users-section">
            <h2>
              <User size={20} />
              Utilisateurs Virtuels
            </h2>

            {/* Required user creation alert */}
            {virtualUsers.length === 0 && (
              <div className="settings-message settings-warning">
                <AlertCircle size={16} />
                Vous devez créer au moins un utilisateur virtuel pour utiliser l'application.
              </div>
            )}

            <p className="virtual-users-description">
              Les utilisateurs virtuels permettent de tester des scénarios multi-utilisateurs.
              Chaque utilisateur a son propre historique de conversations.
              Sélectionnez l'utilisateur courant dans le header.
            </p>

            {/* Add user form */}
            <form className="add-user-form" onSubmit={handleAddUser}>
              <div className="add-user-fields">
                <div className="settings-field">
                  <label htmlFor="newUserId">ID utilisateur</label>
                  <input
                    id="newUserId"
                    type="text"
                    className="settings-input"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="ex: guest-42, pierre@demo"
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="newUserName">Nom (optionnel)</label>
                  <input
                    id="newUserName"
                    type="text"
                    className="settings-input"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="ex: Invité 42"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={!newUserId.trim()}
              >
                <Plus size={16} />
                Ajouter
              </button>
            </form>

            {/* Users list */}
            {virtualUsers.length > 0 && (
              <div className="users-list">
                <h3>Utilisateurs enregistrés</h3>
                {virtualUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-list-item"
                  >
                    <div className="user-info">
                      <User size={16} />
                      <span className="user-name">{user.name}</span>
                      {user.name !== user.id && (
                        <span className="user-id">({user.id})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-danger-icon"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="settings-hint">
              L'ID utilisateur (externalUserId) est envoyé à l'API pour identifier vos conversations.
              L'unicité de l'ID au sein de votre organisation est de votre responsabilité.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
