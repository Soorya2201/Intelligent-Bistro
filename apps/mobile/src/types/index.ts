export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  dietary?: string[];
  tags?: string[];
  allergens?: string[];
  pairings: string[];
  image: string;
  category?: string;
  calories?: number;
  popular?: boolean;
}

export interface CartLineCustomization {
  groupId: string;
  selectedOptionIds: string[];
}

export interface CartLine {
  lineId: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: CartLineCustomization[];
  customizationPriceDelta: number;
  specialInstructions?: string;
}

export type CartItem = CartLine;

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

export interface RecommendationItem {
  item_id: string;
  name: string;
  price: number;
  image: string;
  reason: string;
  score: number;
  source: string;
  calories?: number;
  allergens?: string[];
}

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  status: 'applied' | 'rejected';
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  suggestedItems?: SuggestedItem[];
  recommendations?: RecommendationItem[];
  toolCalls?: ToolCallRecord[];
  inputMethod?: 'voice' | 'text';
}

export interface OrderHistorySummaryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface OrderHistorySummary {
  timestamp: string;
  items: OrderHistorySummaryItem[];
  total: number;
}

export interface UserProfile {
  restrictions: string[];
  likedItems?: Array<{ id: string; name: string; price: number }>;
  name?: string;
  orderHistory?: OrderHistorySummary[];
}

// Legacy sentinel-based action types (kept for compatibility)
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
