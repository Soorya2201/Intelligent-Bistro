import { buildSystemPrompt } from '../services/anthropic';
import menuData from '../data/menu.json';

const emptyCart    = [] as any[];
const emptyProfile = { restrictions: [], likedItems: [] };

describe('buildSystemPrompt — menu content', () => {
  it('includes all category names from the menu', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    for (const cat of menuData.categories) {
      expect(prompt).toContain(cat.name);
    }
  });

  it('includes every item name from the menu', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    for (const cat of menuData.categories) {
      for (const item of cat.items) {
        expect(prompt).toContain(item.name);
      }
    }
  });

  it('includes every item id so the AI can reference them', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    for (const cat of menuData.categories) {
      for (const item of cat.items) {
        expect(prompt).toContain(item.id);
      }
    }
  });
});

describe('buildSystemPrompt — cart section', () => {
  it('shows empty-cart message when cart is empty', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('cart is currently empty');
  });

  it('includes cart item names when cart is populated', () => {
    const cart = [
      { menuItem: { id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5 }, quantity: 2 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).toContain('Classic Bistro Burger');
  });

  it('does not show the empty-cart message when cart has items', () => {
    const cart = [
      { menuItem: { id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5 }, quantity: 1 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).not.toContain('cart is currently empty');
  });
});

describe('buildSystemPrompt — dietary profile section', () => {
  it('shows "None stated" when restrictions are empty', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('None stated');
  });

  it('lists restrictions when provided', () => {
    const profile = { restrictions: ['vegan', 'gluten-free'], likedItems: [] };
    const prompt  = buildSystemPrompt(emptyCart, profile, menuData);
    expect(prompt).toContain('vegan');
    expect(prompt).toContain('gluten-free');
  });

  it('shows "None saved yet" when liked items list is empty', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('None saved yet');
  });

  it('lists liked item names when provided', () => {
    const profile = {
      restrictions: [],
      likedItems: [{ id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5 }],
    };
    const prompt = buildSystemPrompt(emptyCart, profile, menuData);
    expect(prompt).toContain('Classic Bistro Burger');
  });
});

describe('buildSystemPrompt — sentinel instructions', () => {
  it('contains the ✦ACTION✦ sentinel', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('✦ACTION✦');
  });

  it('contains the ✦END✦ sentinel', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('✦END✦');
  });

  it('contains the suggest op schema', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('"op":"suggest"');
  });

  it('contains the add op schema', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('"op":"add"');
  });

  it('contains the clarify op schema', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('"op":"clarify"');
  });
});
