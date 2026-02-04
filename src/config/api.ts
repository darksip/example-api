// API Configuration from environment variables or runtime config

// Runtime config is injected by Docker entrypoint into window.__ENV__
declare global {
  interface Window {
    __ENV__?: {
      VITE_HALAPI_URL?: string
      VITE_HALAPI_TOKEN?: string
    }
  }
}

function getEnvVar(name: string): string {
  // First check runtime config (Docker), then Vite env vars
  if (typeof window !== 'undefined' && window.__ENV__?.[name as keyof typeof window.__ENV__]) {
    return window.__ENV__[name as keyof typeof window.__ENV__] || ''
  }
  return import.meta.env[name] || ''
}

// In development, use empty string so requests go to /api/halap/* which is proxied by Vite
// In production, use the configured environment variable
const API_URL = import.meta.env.DEV ? '' : getEnvVar('VITE_HALAPI_URL')
const API_TOKEN = getEnvVar('VITE_HALAPI_TOKEN')

export interface ApiConfig {
  apiUrl: string
  apiToken: string
}

export function getApiConfig(): ApiConfig {
  return {
    apiUrl: import.meta.env.DEV ? '' : getEnvVar('VITE_HALAPI_URL'),
    apiToken: getEnvVar('VITE_HALAPI_TOKEN'),
  }
}

export function isConfigured(): boolean {
  const token = getEnvVar('VITE_HALAPI_TOKEN')
  // In development, apiUrl can be empty (uses proxy), so only check token
  // In production, both apiUrl and apiToken are required
  if (import.meta.env.DEV) {
    return Boolean(token)
  }
  const url = getEnvVar('VITE_HALAPI_URL')
  return Boolean(url && token)
}
