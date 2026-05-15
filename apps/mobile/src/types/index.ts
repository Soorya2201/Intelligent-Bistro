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

export interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  suggestedItems?: SuggestedItem[];
}

export interface UserProfile {
  restrictions: string[];
  likedItems?: Array<{ id: string; name: string; price: number }>;
  name?: string;
}

export type ActionOp = 'add' | 'remove' | 'update' | 'clear' | 'upsell' | 'clarify' | 'suggest';

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
