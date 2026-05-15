import { StateCreator } from 'zustand';
import { CartItem, MenuItem } from '../types';

export interface OrderRecord {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: string; // ISO string so it survives serialisation
}

export interface OrderHistorySlice {
  orderHistory: OrderRecord[];
  addOrderToHistory: (items: CartItem[], total: number) => void;
  getFavoriteItems: () => Array<{ menuItem: MenuItem; timesOrdered: number }>;
}

export const createOrderHistorySlice: StateCreator<OrderHistorySlice, [], [], OrderHistorySlice> = (set, get) => ({
  orderHistory: [],

  addOrderToHistory: (items, total) => {
    const record: OrderRecord = {
      id: Date.now().toString(),
      items,
      total,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ orderHistory: [record, ...state.orderHistory] }));
  },

  getFavoriteItems: () => {
    const counts = new Map<string, { menuItem: MenuItem; timesOrdered: number }>();
    for (const order of get().orderHistory) {
      for (const { menuItem, quantity } of order.items) {
        const prev = counts.get(menuItem.id);
        if (prev) {
          prev.timesOrdered += quantity;
        } else {
          counts.set(menuItem.id, { menuItem, timesOrdered: quantity });
        }
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.timesOrdered - a.timesOrdered);
  },
});
