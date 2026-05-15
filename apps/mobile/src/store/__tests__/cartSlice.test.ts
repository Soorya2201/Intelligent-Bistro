import { create } from 'zustand';
import { CartSlice, createCartSlice } from '../cartSlice';
import { MenuItem } from '../../types';

function makeStore() {
  return create<CartSlice>()((...a) => createCartSlice(...a));
}

const burger: MenuItem = {
  id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5,
  description: '8oz beef patty', dietary: ['gluten'], pairings: ['truffle-fries'], image: '🍔',
};
const fries: MenuItem = {
  id: 'truffle-fries', name: 'Truffle Fries', price: 8.5,
  description: 'Truffle oil fries', dietary: ['vegetarian'], pairings: [], image: '🍟',
};
const soda: MenuItem = {
  id: 'classic-soda', name: 'Classic Soda', price: 3.5,
  description: 'Coke, Sprite', dietary: ['vegan'], pairings: [], image: '🥤',
};

describe('cartSlice — initial state', () => {
  it('starts with empty items', () => {
    const s = makeStore().getState();
    expect(s.items).toHaveLength(0);
  });

  it('starts with getTotal() = 0', () => {
    expect(makeStore().getState().getTotal()).toBe(0);
  });

  it('starts with getItemCount() = 0', () => {
    expect(makeStore().getState().getItemCount()).toBe(0);
  });
});

describe('cartSlice — addItem', () => {
  it('adds a new item', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].menuItem.id).toBe('classic-burger');
    expect(store.getState().items[0].quantity).toBe(1);
  });

  it('adds a new item with qty > 1', () => {
    const store = makeStore();
    store.getState().addItem(burger, 3);
    expect(store.getState().items[0].quantity).toBe(3);
  });

  it('increments quantity for an existing item', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().addItem(burger, 2);
    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].quantity).toBe(3);
  });

  it('adds multiple distinct items', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().addItem(fries, 1);
    expect(store.getState().items).toHaveLength(2);
  });
});

describe('cartSlice — getTotal / getItemCount', () => {
  it('calculates total as price × quantity for one item', () => {
    const store = makeStore();
    store.getState().addItem(burger, 2);
    expect(store.getState().getTotal()).toBeCloseTo(14.5 * 2);
  });

  it('sums across multiple items', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().addItem(fries, 2);
    store.getState().addItem(soda, 3);
    expect(store.getState().getTotal()).toBeCloseTo(14.5 + 8.5 * 2 + 3.5 * 3);
  });

  it('counts total quantity across all items', () => {
    const store = makeStore();
    store.getState().addItem(burger, 2);
    store.getState().addItem(fries, 3);
    expect(store.getState().getItemCount()).toBe(5);
  });
});

describe('cartSlice — removeItem', () => {
  it('removes the correct item', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().addItem(fries, 1);
    store.getState().removeItem('classic-burger');
    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].menuItem.id).toBe('truffle-fries');
  });

  it('removing a non-existent id leaves cart unchanged', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().removeItem('nonexistent');
    expect(store.getState().items).toHaveLength(1);
  });

  it('total is 0 after removing the only item', () => {
    const store = makeStore();
    store.getState().addItem(burger, 2);
    store.getState().removeItem('classic-burger');
    expect(store.getState().getTotal()).toBe(0);
  });
});

describe('cartSlice — updateQuantity', () => {
  it('sets an exact quantity', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().updateQuantity('classic-burger', 5);
    expect(store.getState().items[0].quantity).toBe(5);
  });

  it('removing when qty is updated to 0', () => {
    const store = makeStore();
    store.getState().addItem(burger, 2);
    store.getState().updateQuantity('classic-burger', 0);
    expect(store.getState().items).toHaveLength(0);
  });

  it('does not affect other items', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    store.getState().addItem(fries, 1);
    store.getState().updateQuantity('classic-burger', 4);
    expect(store.getState().items.find(i => i.menuItem.id === 'truffle-fries')!.quantity).toBe(1);
  });
});

describe('cartSlice — clearCart', () => {
  it('empties all items', () => {
    const store = makeStore();
    store.getState().addItem(burger, 2);
    store.getState().addItem(fries, 1);
    store.getState().clearCart();
    expect(store.getState().items).toHaveLength(0);
  });

  it('getTotal is 0 after clear', () => {
    const store = makeStore();
    store.getState().addItem(burger, 3);
    store.getState().clearCart();
    expect(store.getState().getTotal()).toBe(0);
  });

  it('getItemCount is 0 after clear', () => {
    const store = makeStore();
    store.getState().addItem(burger, 3);
    store.getState().addItem(fries, 2);
    store.getState().clearCart();
    expect(store.getState().getItemCount()).toBe(0);
  });
});
