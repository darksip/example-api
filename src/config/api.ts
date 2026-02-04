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

export interface ApiConfig {
  apiUrl: string
  apiToken: string
}

export function getApiConfig(): ApiConfig {
  // Both dev (Vite proxy) and prod (Nginx proxy) use relative URLs
  // Only use absolute URL if explicitly set in VITE_HALAPI_URL
  return {
    apiUrl: getEnvVar('VITE_HALAPI_URL'),
    apiToken: getEnvVar('VITE_HALAPI_TOKEN'),
  }
}

export function isConfigured(): boolean {
  // Only token is required - URL can be empty (uses proxy)
  const token = getEnvVar('VITE_HALAPI_TOKEN')
  return Boolean(token)
}
