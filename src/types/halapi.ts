// Types for Halapi API

export interface Book {
  title: string;
  author: string;
  isbn?: string;
  year?: number;
  coverUrl?: string;
  description?: string;
  subjects?: string[];
}

export interface MusicTrack {
  title: string;
  duration?: number;
}

export interface MusicAlbum {
  type: 'album';
  title: string;
  artist: string;
  year?: number;
  label?: string;
  coverUrl?: string;
  tracks?: MusicTrack[];
  genres?: string[];
}

export interface MusicTrackItem {
  type: 'track';
  title: string;
  artist: string;
  album?: string;
  year?: number;
  duration?: number;
  coverUrl?: string;
}

export type Music = MusicAlbum | MusicTrackItem;

export interface Artifacts {
  books: Book[];
  music: Music[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Artifacts;
  createdAt: number;
  isStreaming?: boolean;
  costSummary?: CostSummary;
  agentUsed?: string;
  modelUsed?: string;
  tokensInput?: number;
  tokensOutput?: number;
  executionTimeMs?: number;
}

export interface CostSummary {
  llm: {
    baseCost: number;
    withMargin: number;
  };
  total: {
    baseCost: number;
    withMargin: number;
  };
}

export interface Conversation {
  id: string;
  organizationId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// SSE Event Types
export interface SSETextDeltaEvent {
  type: 'text-delta';
  data: {
    delta: string;
  };
}

export interface SSEToolCallEvent {
  type: 'tool-call';
  data: {
    toolName: string;
    toolCallId: string;
    args: Record<string, unknown>;
  };
}

export interface SSEToolResultEvent {
  type: 'tool-result';
  data: {
    toolCallId: string;
    result: unknown;
    success: boolean;
  };
}

export interface SSEArtifactsEvent {
  type: 'artifacts';
  data: Artifacts;
}

export interface SSECostEvent {
  type: 'cost';
  data: {
    costSummary: CostSummary;
  };
}

export interface SSEDoneEvent {
  type: 'done';
  data: {
    messageId: string;
    conversationId: string;
    totalTokens: {
      input: number;
      output: number;
    };
    executionTimeMs: number;
  };
}

export interface SSEErrorEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

export type SSEEvent =
  | SSETextDeltaEvent
  | SSEToolCallEvent
  | SSEToolResultEvent
  | SSEArtifactsEvent
  | SSECostEvent
  | SSEDoneEvent
  | SSEErrorEvent;

// API Response types
export interface ConversationsListResponse {
  success: boolean;
  conversations: Conversation[];
  metadata: {
    requestId: string;
    timestamp: string;
    count: number;
    hasMore: boolean;
  };
}

export interface ConversationDetailResponse {
  success: boolean;
  conversation: Conversation;
  messages: Message[];
  metadata: {
    requestId: string;
    timestamp: string;
  };
}

export interface BookArtifactsResponse {
  success: boolean;
  messageId: string;
  books: Book[];
  metadata: {
    requestId: string;
    timestamp: string;
    count: number;
  };
}

export interface MusicArtifactsResponse {
  success: boolean;
  messageId: string;
  music: Music[];
  metadata: {
    requestId: string;
    timestamp: string;
    count: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
  metadata: {
    requestId: string;
    timestamp: string;
  };
}
