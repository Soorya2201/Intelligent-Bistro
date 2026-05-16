import { Platform } from 'react-native';
import { ChatMessage, CartItem, UserProfile } from '../types';
import { ToolCallRecord, RecommendationItem } from '../types';

const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : 'http://100.64.155.208:3001';

export const fetchMenu = async () => {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('Error fetching menu:', error);
    return null;
  }
};

export const fetchRecommendations = async (
  sessionId: string,
  cartItemIds: string[],
  dietary: string[] = [],
) => {
  try {
    const params = new URLSearchParams({
      sessionId,
      cartItemIds: cartItemIds.join(','),
      dietary: dietary.join(','),
    });
    const res = await fetch(`${API_BASE}/api/recommendations?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  } catch {
    return [];
  }
};

export const placeOrder = async (data: {
  sessionId: string;
  items: Array<{ item_id: string; name: string; quantity: number; price: number; notes?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  email?: string;
}) => {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to place order');
  return res.json();
};

export interface StreamChatCallbacks {
  onActions: (actions: ToolCallRecord[]) => void;
  onDelta: (text: string) => void;
  onRecommendations: (items: RecommendationItem[]) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

// XHR instead of fetch: React Native's XMLHttpRequest is native and its
// onprogress callback handles SSE reliably on Android.
export const streamChat = (
  messages: ChatMessage[],
  cart: CartItem[],
  profile: UserProfile,
  callbacks: StreamChatCallbacks,
  sessionId?: string,
): Promise<void> => {
  return new Promise((resolve) => {
    const xhr   = new XMLHttpRequest();
    let buffer  = '';
    let lastPos = 0;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
      resolve();
    };

    const flush = () => {
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const event of parts) {
        const line = event.trim();
        if (!line || line === ':keep-alive') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.error || parsed.type === 'error') {
            settle(() => callbacks.onError(parsed.message || parsed.error || 'Server error'));
            return;
          }

          switch (parsed.type) {
            case 'actions':
              if (parsed.actions) callbacks.onActions(parsed.actions);
              break;
            case 'delta':
              if (parsed.text) callbacks.onDelta(parsed.text);
              break;
            case 'recommendations':
              if (parsed.items) callbacks.onRecommendations(parsed.items);
              break;
            case 'done':
              settle(callbacks.onDone);
              return;

            // Legacy support for old SSE format
            default:
              if (parsed.done)  { settle(callbacks.onDone); return; }
              if (parsed.text)  { callbacks.onDelta(parsed.text); }
          }
        } catch {
          console.warn('SSE parse — skipped partial chunk');
        }
      }
    };

    xhr.open('POST', `${API_BASE}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 90_000;

    xhr.onprogress = () => {
      const fresh = xhr.responseText.slice(lastPos);
      lastPos     = xhr.responseText.length;
      buffer     += fresh;
      flush();
    };

    xhr.onload = () => {
      buffer += '\n\n';
      flush();
      settle(callbacks.onDone);
    };

    xhr.onerror   = () => settle(() => callbacks.onError('Cannot reach server — is the API running?'));
    xhr.ontimeout = () => settle(() => callbacks.onError('Request timed out.'));

    // Normalise cart for the API
    const normalisedCart = cart.map(c => ({
      item_id:  c.menuItem.id,
      name:     c.menuItem.name,
      quantity: c.quantity,
      price:    c.menuItem.price,
      notes:    c.specialInstructions,
    }));

    xhr.send(JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      cart: normalisedCart,
      profile: {
        restrictions: profile.restrictions,
        dietary:      profile.restrictions,
        likedItems:   profile.likedItems,
        liked:        (profile.likedItems || []).map(i => i.id),
      },
      sessionId,
    }));
  });
};
