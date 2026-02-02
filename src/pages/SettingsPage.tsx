import { type FormEvent, useEffect, useState } from 'react'
import { getApiConfig, isConfigured, setApiConfig } from '../config/api'

interface SettingsPageProps {
  onSave: () => void
}

export function SettingsPage({ onSave }: SettingsPageProps) {
  const [apiUrl, setApiUrl] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const config = getApiConfig()
    setApiUrl(config.apiUrl)
    setApiToken(config.apiToken)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setApiConfig({ apiUrl, apiToken })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSave()
  }

  const handleClear = () => {
    setApiConfig({ apiUrl: '', apiToken: '' })
    setApiUrl('')
    setApiToken('')
    setSaved(false)
  }

  const configured = isConfigured()

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="apiUrl">API URL</label>
          <input
            type="url"
            id="apiUrl"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-domain.com"
          />
          <span className="form-hint">The base URL of the Halapi server (without /api/halap)</span>
        </div>

        <div className="form-group">
          <label htmlFor="apiToken">Bearer Token</label>
          <input
            type="password"
            id="apiToken"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="hap_sk_live_..."
          />
          <span className="form-hint">Your Halapi API token starting with hap_sk_live_</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
          {configured && (
            <button type="button" className="btn btn-danger" onClick={handleClear}>
              Clear Configuration
            </button>
          )}
        </div>

        {saved && <div className="success-message">Settings saved successfully!</div>}
      </form>

      <div className="settings-info">
        <h3>Configuration Status</h3>
        <p>
          Status:{' '}
          <span className={configured ? 'status-ok' : 'status-error'}>
            {configured ? 'Configured' : 'Not Configured'}
          </span>
        </p>
        {!configured && <p className="hint">Both URL and token are required to use the API.</p>}
      </div>

      <div className="settings-info">
        <h3>Environment Variables</h3>
        <p>
          You can also configure the API using environment variables in your <code>.env</code> file:
        </p>
        <pre>
          VITE_HALAPI_URL=https://your-domain.com{'\n'}
          VITE_HALAPI_TOKEN=hap_sk_live_...
        </pre>
        <p className="hint">Settings saved here will override environment variables.</p>
      </div>
    </div>
  )
}
