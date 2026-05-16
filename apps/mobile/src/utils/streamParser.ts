export type SSEEventType = 'actions' | 'delta' | 'done' | 'recommendations' | 'error';

export interface ToolCallPayload {
  name: string;
  input: Record<string, unknown>;
  status: 'applied' | 'rejected';
  rejectionReason?: string;
}

export interface RecommendationItem {
  item_id: string;
  name: string;
  price: number;
  image: string;
  reason: string;
  score: number;
  source: string;
}

export interface ParsedSSEEvent {
  type: SSEEventType;
  text?: string;
  actions?: ToolCallPayload[];
  recommendations?: RecommendationItem[];
  message?: string;
}

export function parseSSEEvent(line: string): ParsedSSEEvent | null {
  if (!line.startsWith('data: ')) return null;
  const jsonStr = line.slice(6).trim();
  if (!jsonStr) return null;

  try {
    const raw = JSON.parse(jsonStr) as Record<string, unknown>;
    if (!raw.type) return null;

    const event: ParsedSSEEvent = { type: raw.type as SSEEventType };

    if (raw.text !== undefined)    event.text    = raw.text as string;
    if (raw.actions !== undefined) event.actions = raw.actions as ToolCallPayload[];
    if (raw.message !== undefined) event.message = raw.message as string;

    // Backend sends "items" for recommendations — normalise to "recommendations"
    if (raw.items !== undefined)          event.recommendations = raw.items as RecommendationItem[];
    if (raw.recommendations !== undefined) event.recommendations = raw.recommendations as RecommendationItem[];

    return event;
  } catch {
    return null;
  }
}

export function stripSentinels(text: string): string {
  return text.replace(/✦ACTION✦.*?✦END✦/gs, '').replace(/\s{2,}/g, ' ').trim();
}
