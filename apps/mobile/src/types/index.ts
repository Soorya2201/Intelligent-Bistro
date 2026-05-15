export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  dietary: string[];
  pairings: string[];
  image: string;
  category?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface UserProfile {
  restrictions: string[];
  name?: string;
}

export type ActionOp = 'add' | 'remove' | 'update' | 'clear' | 'upsell' | 'clarify';

export interface CartAction {
  op: ActionOp;
  items?: Array<{
    id: string;
    name: string;
    qty: number;
    price: number;
    specialInstructions?: string;
  }>;
  question?: string;
  options?: string[];
  upsellItem?: string;
  upsellMessage?: string;
}

export interface StreamChunk {
  type: 'text' | 'action' | 'done';
  text?: string;
  action?: CartAction;
}
