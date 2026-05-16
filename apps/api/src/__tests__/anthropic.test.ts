import { buildSystemPrompt } from '../services/anthropic';
import { BISTRO_TOOLS } from '../ai/tools';
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

  it('includes cart item names when cart is populated (UI format)', () => {
    const cart = [
      { menuItem: { id: 'classic-bistro-burger', name: 'Classic Bistro Burger', price: 14 }, quantity: 2 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).toContain('Classic Bistro Burger');
  });

  it('does not show the empty-cart message when cart has items', () => {
    const cart = [
      { menuItem: { id: 'classic-bistro-burger', name: 'Classic Bistro Burger', price: 14 }, quantity: 1 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).not.toContain('cart is currently empty');
  });

  it('normalises UI cart format so the AI reads it correctly', () => {
    const cart = [
      { menuItem: { id: 'classic-bistro-burger', name: 'Classic Bistro Burger', price: 14 }, quantity: 2 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).toContain('"qty":2');
    expect(prompt).toContain('"id":"classic-bistro-burger"');
    expect(prompt).not.toContain('"menuItem"');
  });

  it('shows order total when cart has items', () => {
    const cart = [
      { menuItem: { id: 'classic-bistro-burger', name: 'Classic Bistro Burger', price: 14 }, quantity: 2 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).toContain('Order total: $28.00');
  });

  it('also handles flat cart format', () => {
    const cart = [
      { id: 'truffle-fries', name: 'Truffle Fries', qty: 1, price: 8.5 },
    ];
    const prompt = buildSystemPrompt(cart, emptyProfile, menuData);
    expect(prompt).toContain('Truffle Fries');
    expect(prompt).toContain('"qty":1');
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

  it('injects dietary restrictions into system prompt', () => {
    const profile = { restrictions: ['nut-free'], likedItems: [] };
    const prompt  = buildSystemPrompt(emptyCart, profile, menuData);
    expect(prompt).toContain('nut-free');
  });
});

describe('buildSystemPrompt — tool-calling instructions', () => {
  it('instructs the AI to use tools, not sentinel markers', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('tools');
    expect(prompt).not.toContain('✦ACTION✦');
    expect(prompt).not.toContain('✦END✦');
  });

  it('lists all available tool names', () => {
    const prompt = buildSystemPrompt(emptyCart, emptyProfile, menuData);
    expect(prompt).toContain('add_item');
    expect(prompt).toContain('remove_item');
    expect(prompt).toContain('clarify');
    expect(prompt).toContain('upsell');
  });
});

describe('BISTRO_TOOLS — tool definitions', () => {
  it('has correct input_schema shape for add_item', () => {
    const tool = BISTRO_TOOLS.find(t => t.name === 'add_item')!;
    const schema = tool.input_schema as any;
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect(schema.properties.item_id).toBeDefined();
    expect(schema.properties.quantity).toBeDefined();
  });

  it('has correct input_schema shape for clarify', () => {
    const tool = BISTRO_TOOLS.find(t => t.name === 'clarify')!;
    const schema = tool.input_schema as any;
    expect(schema.properties.question).toBeDefined();
    expect(schema.properties.options).toBeDefined();
  });

  it('enforces quantity bounds in add_item schema', () => {
    const tool = BISTRO_TOOLS.find(t => t.name === 'add_item')!;
    const schema = tool.input_schema as any;
    expect(schema.properties.quantity.minimum).toBe(1);
    expect(schema.properties.quantity.maximum).toBe(20);
  });
});
