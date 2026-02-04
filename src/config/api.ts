// API Configuration from environment variables

// In development, use empty string so requests go to /api/halap/* which is proxied by Vite
// In production, use the configured environment variable
const API_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_HALAPI_URL || ''
const API_TOKEN = import.meta.env.VITE_HALAPI_TOKEN || ''

export interface ApiConfig {
  apiUrl: string
  apiToken: string
}

export function getApiConfig(): ApiConfig {
  return {
    apiUrl: API_URL,
    apiToken: API_TOKEN,
  }
}

export function isConfigured(): boolean {
  // In development, apiUrl can be empty (uses proxy), so only check token
  // In production, both apiUrl and apiToken are required
  if (import.meta.env.DEV) {
    return Boolean(API_TOKEN)
  }
  return Boolean(API_URL && API_TOKEN)
}
