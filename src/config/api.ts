// API Configuration with localStorage fallback to environment variables

const STORAGE_KEYS = {
  API_URL: 'halapi_url',
  API_TOKEN: 'halapi_token',
} as const;

// In development, use empty string so requests go to /api/halap/* which is proxied by Vite
// In production, use the configured environment variable
const DEFAULT_API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_HALAPI_URL || '');

export interface ApiConfig {
  apiUrl: string;
  apiToken: string;
}

export function getApiConfig(): ApiConfig {
  const storedUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
  const storedToken = localStorage.getItem(STORAGE_KEYS.API_TOKEN);

  // In development, use the proxy (empty URL) to avoid CORS issues
  // unless the user has configured a different URL
  let apiUrl = storedUrl || DEFAULT_API_URL;
  if (import.meta.env.DEV && storedUrl?.includes('haldev.cybermeet.fr')) {
    // Use proxy instead of direct connection to avoid CORS
    apiUrl = '';
  }

  return {
    apiUrl,
    apiToken: storedToken || import.meta.env.VITE_HALAPI_TOKEN || '',
  };
}

export function setApiConfig(config: Partial<ApiConfig>): void {
  if (config.apiUrl !== undefined) {
    if (config.apiUrl) {
      localStorage.setItem(STORAGE_KEYS.API_URL, config.apiUrl);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_URL);
    }
  }

  if (config.apiToken !== undefined) {
    if (config.apiToken) {
      localStorage.setItem(STORAGE_KEYS.API_TOKEN, config.apiToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_TOKEN);
    }
  }
}

export function isConfigured(): boolean {
  const config = getApiConfig();
  // In development, apiUrl can be empty (uses proxy), so only check token
  // In production, both apiUrl and apiToken are required
  if (import.meta.env.DEV) {
    return Boolean(config.apiToken);
  }
  return Boolean(config.apiUrl && config.apiToken);
}
