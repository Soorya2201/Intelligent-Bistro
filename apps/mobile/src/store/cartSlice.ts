import { StateCreator } from 'zustand';
import { CartItem, MenuItem } from '../types';

export interface CartSlice {
  items: CartItem[];
  isAnimating: boolean;
  addItem: (menuItem: MenuItem, qty: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const createCartSlice: StateCreator<CartSlice, [], [], CartSlice> = (set, get) => ({
  items: [],
  isAnimating: false,
  addItem: (menuItem, qty) => {
    set((state) => {
      const existing = state.items.find(i => i.menuItem.id === menuItem.id);
      let newItems;
      if (existing) {
        newItems = state.items.map(i => 
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        newItems = [...state.items, { menuItem, quantity: qty }];
      }
      return { items: newItems, isAnimating: true };
    });
    setTimeout(() => set({ isAnimating: false }), 600);
  },
  removeItem: (menuItemId) => {
    set((state) => ({ items: state.items.filter(i => i.menuItem.id !== menuItemId), isAnimating: true }));
    setTimeout(() => set({ isAnimating: false }), 600);
  },
  updateQuantity: (menuItemId, qty) => {
    if (qty <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set((state) => ({
      items: state.items.map(i => i.menuItem.id === menuItemId ? { ...i, quantity: qty } : i),
      isAnimating: true
    }));
    setTimeout(() => set({ isAnimating: false }), 600);
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0)
});
