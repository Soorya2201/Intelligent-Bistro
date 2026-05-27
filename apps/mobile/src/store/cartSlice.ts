import { StateCreator } from 'zustand';
import { CartItem, CartLine, CartLineCustomization, MenuItem } from '../types';
import { getDefaultCustomizations, calculatePriceDelta } from '../utils/customizations';

let _lineCounter = 0;
function newLineId(): string {
  return `line-${Date.now()}-${++_lineCounter}`;
}

export interface CartSlice {
  items: CartItem[];
  isAnimating: boolean;

  // ── New per-line API ───────────────────────────────────────────────────────
  addLine: (menuItem: MenuItem, customizations?: CartLineCustomization[], notes?: string) => string;
  removeLine: (lineId: string) => void;
  updateLineCustomizations: (lineId: string, customizations: CartLineCustomization[]) => void;
  updateLineQuantity: (lineId: string, qty: number) => void;
  updateLineInstructions: (lineId: string, instructions: string) => void;
  splitLine: (lineId: string) => string[];   // explode qty>1 into N qty=1 lines; returns all lineIds
  getLinesByMenuItem: (menuItemId: string) => CartLine[];

  // ── Legacy adapters (backward-compatible) ─────────────────────────────────
  addItem: (menuItem: MenuItem, qty: number, notes?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, qty: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function buildLine(
  menuItem: MenuItem,
  qty: number,
  customizations: CartLineCustomization[],
  notes?: string,
): CartItem {
  const delta = calculatePriceDelta(menuItem.id, customizations);
  return {
    lineId: newLineId(),
    menuItem,
    quantity: qty,
    customizations,
    customizationPriceDelta: delta,
    specialInstructions: notes,
  };
}

function sameCustomizations(a: CartLineCustomization[], b: CartLineCustomization[]): boolean {
  if (a.length !== b.length) return false;
  for (const aEntry of a) {
    const bEntry = b.find(x => x.groupId === aEntry.groupId);
    if (!bEntry) return false;
    if ([...aEntry.selectedOptionIds].sort().join(',') !== [...bEntry.selectedOptionIds].sort().join(',')) return false;
  }
  return true;
}

export const createCartSlice: StateCreator<CartSlice, [], [], CartSlice> = (set, get) => ({
  items: [],
  isAnimating: false,

  addLine: (menuItem, customizations, notes) => {
    const customs = customizations ?? getDefaultCustomizations(menuItem.id);
    const line    = buildLine(menuItem, 1, customs, notes);
    set(state => ({ items: [...state.items, line], isAnimating: true }));
    setTimeout(() => set({ isAnimating: false }), 600);
    return line.lineId;
  },

  removeLine: (lineId) => {
    set(state => ({ items: state.items.filter(i => i.lineId !== lineId), isAnimating: true }));
    setTimeout(() => set({ isAnimating: false }), 600);
  },

  updateLineCustomizations: (lineId, customizations) => {
    set(state => ({
      items: state.items.map(i => {
        if (i.lineId !== lineId) return i;
        return {
          ...i,
          customizations,
          customizationPriceDelta: calculatePriceDelta(i.menuItem.id, customizations),
        };
      }),
    }));
  },

  getLinesByMenuItem: (menuItemId) => get().items.filter(i => i.menuItem.id === menuItemId),

  updateLineQuantity: (lineId, qty) => {
    if (qty <= 0) {
      get().removeLine(lineId);
      return;
    }
    set(state => ({
      items: state.items.map(i => i.lineId === lineId ? { ...i, quantity: qty } : i),
    }));
  },

  updateLineInstructions: (lineId, instructions) => {
    set(state => ({
      items: state.items.map(i => i.lineId === lineId ? { ...i, specialInstructions: instructions } : i),
    }));
  },

  splitLine: (lineId) => {
    const line = get().items.find(i => i.lineId === lineId);
    if (!line || line.quantity <= 1) return [lineId];

    // Pre-generate IDs so we can return them synchronously
    const extraIds = Array.from({ length: line.quantity - 1 }, () => newLineId());

    set(state => {
      const extraLines = extraIds.map(id => ({
        ...line,
        lineId: id,
        quantity: 1,
        // Each extra line starts with same customizations as the original
      }));
      return {
        items: state.items.flatMap(i =>
          i.lineId === lineId
            ? [{ ...i, quantity: 1 }, ...extraLines]
            : [i]
        ),
      };
    });

    return [lineId, ...extraIds];
  },

  // ── Legacy: merge by menuItemId + same customizations ────────────────────

  addItem: (menuItem, qty, notes) => {
    set(state => {
      const defaults = getDefaultCustomizations(menuItem.id);
      const existing = state.items.find(
        i => i.menuItem.id === menuItem.id && sameCustomizations(i.customizations, defaults)
      );
      if (existing) {
        return {
          items: state.items.map(i =>
            i.lineId === existing.lineId
              ? { ...i, quantity: i.quantity + qty, ...(notes !== undefined && { specialInstructions: notes }) }
              : i
          ),
          isAnimating: true,
        };
      }
      const line = buildLine(menuItem, qty, defaults, notes);
      return { items: [...state.items, line], isAnimating: true };
    });
    setTimeout(() => set({ isAnimating: false }), 600);
  },

  removeItem: (menuItemId) => {
    set(state => ({ items: state.items.filter(i => i.menuItem.id !== menuItemId), isAnimating: true }));
    setTimeout(() => set({ isAnimating: false }), 600);
  },

  updateQuantity: (menuItemId, qty) => {
    if (qty <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set(state => ({
      items: state.items.map(i => i.menuItem.id === menuItemId ? { ...i, quantity: qty } : i),
      isAnimating: true,
    }));
    setTimeout(() => set({ isAnimating: false }), 600);
  },

  updateInstructions: (menuItemId, instructions) => {
    set(state => ({
      items: state.items.map(i =>
        i.menuItem.id === menuItemId ? { ...i, specialInstructions: instructions } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotal: () =>
    get().items.reduce(
      (sum, item) => sum + (item.menuItem.price + item.customizationPriceDelta) * item.quantity,
      0,
    ),

  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
});
