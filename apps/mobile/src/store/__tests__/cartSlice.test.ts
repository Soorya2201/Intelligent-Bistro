import { create } from 'zustand';
import { CartSlice, createCartSlice } from '../cartSlice';
import { MenuItem, CartLineCustomization } from '../../types';

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

describe('cartSlice — CartLine fields', () => {
  it('every item has a lineId', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    expect(typeof store.getState().items[0].lineId).toBe('string');
    expect(store.getState().items[0].lineId.length).toBeGreaterThan(0);
  });

  it('every item has customizations array', () => {
    const store = makeStore();
    store.getState().addItem(burger, 1);
    expect(Array.isArray(store.getState().items[0].customizations)).toBe(true);
  });

  it('every item has customizationPriceDelta', () => {
    const store = makeStore();
    store.getState().addItem(fries, 1);
    expect(typeof store.getState().items[0].customizationPriceDelta).toBe('number');
  });
});

describe('cartSlice — addLine', () => {
  it('returns a lineId string', () => {
    const store  = makeStore();
    const lineId = store.getState().addLine(burger);
    expect(typeof lineId).toBe('string');
  });

  it('always creates a new line (no merging)', () => {
    const store = makeStore();
    store.getState().addLine(burger);
    store.getState().addLine(burger);
    expect(store.getState().items).toHaveLength(2);
  });

  it('line has quantity of 1', () => {
    const store = makeStore();
    store.getState().addLine(fries);
    expect(store.getState().items[0].quantity).toBe(1);
  });

  it('uses provided customizations', () => {
    const store  = makeStore();
    const customs: CartLineCustomization[] = [
      { groupId: 'sauce', selectedOptionIds: ['gravy'] },
    ];
    store.getState().addLine(fries, customs);
    expect(store.getState().items[0].customizations).toEqual(customs);
  });

  it('applies priceDelta from customizations', () => {
    const fries2 = { ...fries, id: 'truffle-fries' };
    const store  = makeStore();
    const customs: CartLineCustomization[] = [
      { groupId: 'sauce', selectedOptionIds: ['gravy'] }, // +1.00
    ];
    store.getState().addLine(fries2, customs);
    expect(store.getState().items[0].customizationPriceDelta).toBeCloseTo(1.0);
  });
});

describe('cartSlice — removeLine', () => {
  it('removes the correct line by lineId', () => {
    const store = makeStore();
    const lid1  = store.getState().addLine(burger);
    const lid2  = store.getState().addLine(fries);
    store.getState().removeLine(lid1);
    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].lineId).toBe(lid2);
  });

  it('no-ops on unknown lineId', () => {
    const store = makeStore();
    store.getState().addLine(burger);
    store.getState().removeLine('nonexistent');
    expect(store.getState().items).toHaveLength(1);
  });
});

describe('cartSlice — updateLineCustomizations', () => {
  it('updates customizations on the correct line', () => {
    const store  = makeStore();
    const lineId = store.getState().addLine(burger);
    const newCustoms: CartLineCustomization[] = [
      { groupId: 'cook', selectedOptionIds: ['rare'] },
    ];
    store.getState().updateLineCustomizations(lineId, newCustoms);
    expect(store.getState().items[0].customizations).toEqual(newCustoms);
  });

  it('does not affect other lines', () => {
    const store  = makeStore();
    const lid1   = store.getState().addLine(burger);
    const lid2   = store.getState().addLine(fries);
    const origCustoms = store.getState().items.find(i => i.lineId === lid2)!.customizations;
    store.getState().updateLineCustomizations(lid1, [{ groupId: 'cook', selectedOptionIds: ['rare'] }]);
    expect(store.getState().items.find(i => i.lineId === lid2)!.customizations).toEqual(origCustoms);
  });
});

describe('cartSlice — getLinesByMenuItem', () => {
  it('returns all lines for a given menuItemId', () => {
    const store = makeStore();
    store.getState().addLine(burger);
    store.getState().addLine(burger);
    store.getState().addLine(fries);
    expect(store.getState().getLinesByMenuItem(burger.id)).toHaveLength(2);
  });

  it('returns empty array when no lines match', () => {
    const store = makeStore();
    store.getState().addLine(burger);
    expect(store.getState().getLinesByMenuItem('ghost-id')).toHaveLength(0);
  });
});

describe('cartSlice — getTotal with customizationPriceDelta', () => {
  it('includes price delta from customizations', () => {
    const truffleFries = { ...fries, id: 'truffle-fries' };
    const store = makeStore();
    const customs: CartLineCustomization[] = [
      { groupId: 'sauce', selectedOptionIds: ['gravy'] }, // +1.00
    ];
    store.getState().addLine(truffleFries, customs);
    // price=8.5 + delta=1.0 = 9.5
    expect(store.getState().getTotal()).toBeCloseTo(9.5);
  });

  it('counts multiple lines of same item separately', () => {
    const store = makeStore();
    store.getState().addLine(burger);
    store.getState().addLine(burger);
    expect(store.getState().getTotal()).toBeCloseTo(burger.price * 2);
  });
});
