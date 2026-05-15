import { Platform } from 'react-native';
import { ChatMessage, CartItem, UserProfile } from '../types';

// Web (browser on same machine) → localhost
// Native (physical device via Tailscale or tunnel) → Tailscale/LAN IP
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

export const streamChat = async (
  messages: ChatMessage[],
  cart: CartItem[],
  profile: UserProfile,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) => {
  try {
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: formattedMessages, cart, profile })
    });

    if (!response.body) throw new Error('No readable stream');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const events = text.split('\n\n').filter(Boolean);

      for (const event of events) {
        if (event === ':keep-alive') continue;
        if (event.startsWith('data: ')) {
          const jsonStr = event.slice('data: '.length);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.done) {
              onDone();
              return;
            }
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            console.error('JSON parse error on SSE chunk:', e, jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err.message);
  }
};
