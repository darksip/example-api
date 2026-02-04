// Halapi API service with streaming support

import { getApiConfig } from '../config/api'
import type {
  BookArtifactsResponse,
  ConversationDetailResponse,
  ConversationsListResponse,
  MusicArtifactsResponse,
  SSEEvent,
} from '../types/halapi'

interface ChatStreamOptions {
  query: string
  conversationId?: string
  externalUserId?: string
  metadata?: Record<string, unknown>
  signal?: AbortSignal
}

interface ChatStreamResult {
  conversationId: string | null
  messageId: string | null
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthHeaders(): HeadersInit {
  const { apiToken } = getApiConfig()
  if (!apiToken) {
    throw new ApiError('API token not configured. Set VITE_HALAPI_TOKEN in .env file.')
  }
  return {
    Authorization: `Bearer ${apiToken}`,
  }
}

function getApiUrl(path: string): string {
  const { apiUrl } = getApiConfig()
  return `${apiUrl}${path}`
}

async function handleErrorResponse(response: Response, context: string): Promise<never> {
  let errorMessage = `${context}: HTTP ${response.status}`
  try {
    const errorData = await response.json()
    if (errorData.error?.message) {
      errorMessage = `${context}: ${errorData.error.message}`
    }
  } catch {
    // Keep default error message if JSON parsing fails
  }
  throw new ApiError(errorMessage, response.status)
}

export async function* chatStream(
  options: ChatStreamOptions
): AsyncGenerator<SSEEvent, ChatStreamResult, undefined> {
  const headers = getAuthHeaders()
  const url = getApiUrl('/api/halap/chat/stream')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: options.query,
      conversationId: options.conversationId,
      externalUserId: options.externalUserId ?? 'demo-user',
      metadata: options.metadata,
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    await handleErrorResponse(response, 'Chat stream failed')
  }

  const conversationId = response.headers.get('X-Conversation-Id')
  const messageId = response.headers.get('X-Message-Id')

  const reader = response.body?.getReader()
  if (!reader) {
    throw new ApiError('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent
            yield event
          } catch {
            console.warn('[halapi] Failed to parse SSE event:', line)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return { conversationId, messageId }
}

export async function getConversations(
  externalUserId?: string,
  limit = 20
): Promise<ConversationsListResponse> {
  const headers = getAuthHeaders()
  const params = new URLSearchParams({ limit: String(limit) })
  if (externalUserId) {
    params.set('externalUserId', externalUserId)
  }

  const response = await fetch(getApiUrl(`/api/halap/conversations?${params}`), { headers })

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch conversations')
  }

  return response.json() as Promise<ConversationsListResponse>
}

export async function getConversation(conversationId: string): Promise<ConversationDetailResponse> {
  const headers = getAuthHeaders()

  const response = await fetch(getApiUrl(`/api/halap/conversations/${conversationId}`), { headers })

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch conversation')
  }

  return response.json() as Promise<ConversationDetailResponse>
}

export async function getBookArtifacts(messageId: string): Promise<BookArtifactsResponse> {
  const headers = getAuthHeaders()

  const response = await fetch(getApiUrl(`/api/halap/artifacts/books/${messageId}`), { headers })

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch book artifacts')
  }

  return response.json() as Promise<BookArtifactsResponse>
}

export async function getMusicArtifacts(messageId: string): Promise<MusicArtifactsResponse> {
  const headers = getAuthHeaders()

  const response = await fetch(getApiUrl(`/api/halap/artifacts/music/${messageId}`), { headers })

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch music artifacts')
  }

  return response.json() as Promise<MusicArtifactsResponse>
}
