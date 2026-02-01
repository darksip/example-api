// Halapi API service with streaming support

import { getApiConfig } from '../config/api';
import type {
  SSEEvent,
  ConversationsListResponse,
  ConversationDetailResponse,
  BookArtifactsResponse,
  MusicArtifactsResponse,
  Artifacts,
} from '../types/halapi';

interface ChatStreamOptions {
  query: string;
  conversationId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
}

interface ChatStreamResult {
  conversationId: string | null;
  messageId: string | null;
}

export async function* chatStream(
  options: ChatStreamOptions
): AsyncGenerator<SSEEvent, ChatStreamResult, undefined> {
  const { apiUrl, apiToken } = getApiConfig();

  if (!apiToken) {
    throw new Error('API not configured. Please set token in Settings.');
  }

  const response = await fetch(`${apiUrl}/api/halap/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: options.query,
      conversationId: options.conversationId,
      externalUserId: options.externalUserId || 'demo-user',
      metadata: options.metadata,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`
    );
  }

  const conversationId = response.headers.get('X-Conversation-Id');
  const messageId = response.headers.get('X-Message-Id');

  console.log('[halapi] chatStream response headers:', { conversationId, messageId });

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent;
            if (event.type === 'artifacts') {
              console.log('[halapi] SSE artifacts event received:', event.data);
            }
            yield event;
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { conversationId, messageId };
}

export async function getConversations(
  externalUserId?: string,
  limit: number = 20
): Promise<ConversationsListResponse> {
  const { apiUrl, apiToken } = getApiConfig();

  if (!apiToken) {
    throw new Error('API not configured. Please set token in Settings.');
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (externalUserId) {
    params.set('externalUserId', externalUserId);
  }

  const response = await fetch(
    `${apiUrl}/api/halap/conversations?${params}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`
    );
  }

  return response.json();
}

export async function getConversation(
  conversationId: string
): Promise<ConversationDetailResponse> {
  const { apiUrl, apiToken } = getApiConfig();

  if (!apiToken) {
    throw new Error('API not configured. Please set token in Settings.');
  }

  const response = await fetch(
    `${apiUrl}/api/halap/conversations/${conversationId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`
    );
  }

  return response.json();
}

export async function getBookArtifacts(
  messageId: string
): Promise<BookArtifactsResponse> {
  const { apiUrl, apiToken } = getApiConfig();

  if (!apiToken) {
    throw new Error('API not configured. Please set token in Settings.');
  }

  const response = await fetch(
    `${apiUrl}/api/halap/artifacts/books/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`
    );
  }

  const data = await response.json();
  console.log('[halapi] getBookArtifacts response:', data);
  return data;
}

export async function getMusicArtifacts(
  messageId: string
): Promise<MusicArtifactsResponse> {
  const { apiUrl, apiToken } = getApiConfig();

  if (!apiToken) {
    throw new Error('API not configured. Please set token in Settings.');
  }

  const response = await fetch(
    `${apiUrl}/api/halap/artifacts/music/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`
    );
  }

  const data = await response.json();
  console.log('[halapi] getMusicArtifacts response:', data);
  return data;
}

// Helper to extract artifacts from SSE events
export function extractArtifactsFromEvents(events: SSEEvent[]): Artifacts {
  for (const event of events) {
    if (event.type === 'artifacts') {
      return event.data;
    }
  }
  return { books: [], music: [] };
}
