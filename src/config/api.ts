// API Configuration with localStorage fallback to environment variables

const STORAGE_KEYS = {
  API_URL: 'halapi_url',
  API_TOKEN: 'halapi_token',
} as const;

export interface ApiConfig {
  apiUrl: string;
  apiToken: string;
}

export function getApiConfig(): ApiConfig {
  const storedUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
  const storedToken = localStorage.getItem(STORAGE_KEYS.API_TOKEN);

  return {
    apiUrl: storedUrl || import.meta.env.VITE_HALAPI_URL || '',
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
  return Boolean(config.apiUrl && config.apiToken);
}
