import { create } from 'zustand';
import { ProfileSlice, createProfileSlice } from '../profileSlice';
import { MenuItem } from '../../types';

function makeStore() {
  return create<ProfileSlice>()((...a) => createProfileSlice(...a));
}

const burger: MenuItem = {
  id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5,
  description: '', dietary: [], pairings: [], image: '🍔',
};
const fries: MenuItem = {
  id: 'truffle-fries', name: 'Truffle Fries', price: 8.5,
  description: '', dietary: [], pairings: [], image: '🍟',
};

describe('profileSlice — initial state', () => {
  it('starts with no restrictions', () => {
    expect(makeStore().getState().restrictions).toHaveLength(0);
  });

  it('starts with no liked items', () => {
    expect(makeStore().getState().likedItems).toHaveLength(0);
  });
});

describe('profileSlice — restrictions', () => {
  it('addRestriction adds a new restriction', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    expect(store.getState().restrictions).toContain('vegan');
  });

  it('addRestriction is idempotent — no duplicates', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    store.getState().addRestriction('vegan');
    expect(store.getState().restrictions).toHaveLength(1);
  });

  it('addRestriction can store multiple distinct restrictions', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    store.getState().addRestriction('gluten-free');
    expect(store.getState().restrictions).toHaveLength(2);
  });

  it('removeRestriction removes the correct restriction', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    store.getState().addRestriction('gluten-free');
    store.getState().removeRestriction('vegan');
    expect(store.getState().restrictions).not.toContain('vegan');
    expect(store.getState().restrictions).toContain('gluten-free');
  });

  it('removeRestriction on non-existent restriction is a no-op', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    store.getState().removeRestriction('kosher');
    expect(store.getState().restrictions).toHaveLength(1);
  });

  it('clearRestrictions removes all restrictions', () => {
    const store = makeStore();
    store.getState().addRestriction('vegan');
    store.getState().addRestriction('gluten-free');
    store.getState().clearRestrictions();
    expect(store.getState().restrictions).toHaveLength(0);
  });
});

describe('profileSlice — toggleLike / isLiked', () => {
  it('toggleLike adds an item when not yet liked', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    expect(store.getState().likedItems).toHaveLength(1);
    expect(store.getState().likedItems[0].id).toBe('classic-burger');
  });

  it('toggleLike removes an item when already liked', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    store.getState().toggleLike(burger);
    expect(store.getState().likedItems).toHaveLength(0);
  });

  it('toggling one item does not affect another liked item', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    store.getState().toggleLike(fries);
    store.getState().toggleLike(burger); // unlike burger
    expect(store.getState().likedItems).toHaveLength(1);
    expect(store.getState().likedItems[0].id).toBe('truffle-fries');
  });

  it('isLiked returns true after liking', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    expect(store.getState().isLiked('classic-burger')).toBe(true);
  });

  it('isLiked returns false for an unknown id', () => {
    expect(makeStore().getState().isLiked('nonexistent-id')).toBe(false);
  });

  it('isLiked returns false after unliking', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    store.getState().toggleLike(burger);
    expect(store.getState().isLiked('classic-burger')).toBe(false);
  });

  it('isLiked is independent per item', () => {
    const store = makeStore();
    store.getState().toggleLike(burger);
    expect(store.getState().isLiked('truffle-fries')).toBe(false);
    expect(store.getState().isLiked('classic-burger')).toBe(true);
  });
});
