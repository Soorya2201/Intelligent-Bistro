import menuData from '../data/menu.json';

type RawItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: string[];
  allergens: string[];
  pairings: string[];
  image: string;
  category: string;
  calories: number;
};

const allItems: RawItem[] = menuData.categories.flatMap(cat => cat.items as unknown as RawItem[]);
const allIds   = new Set(allItems.map(i => i.id));

describe('menu.json — structure', () => {
  it('has at least one category', () => {
    expect(menuData.categories.length).toBeGreaterThan(0);
  });

  it('every category has an id, name, and items array', () => {
    for (const cat of menuData.categories) {
      expect(typeof cat.id).toBe('string');
      expect(cat.id.length).toBeGreaterThan(0);
      expect(typeof cat.name).toBe('string');
      expect(Array.isArray(cat.items)).toBe(true);
    }
  });

  it('every category has at least one item', () => {
    for (const cat of menuData.categories) {
      expect(cat.items.length).toBeGreaterThan(0);
    }
  });

  it('has 20 or more menu items across all categories', () => {
    expect(allItems.length).toBeGreaterThanOrEqual(20);
  });
});

describe('menu.json — item fields', () => {
  it('every item has a non-empty string id', () => {
    for (const item of allItems) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    }
  });

  it('every item has a non-empty string name', () => {
    for (const item of allItems) {
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('every item has a positive numeric price', () => {
    for (const item of allItems) {
      expect(typeof item.price).toBe('number');
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it('every item has a description string', () => {
    for (const item of allItems) {
      expect(typeof item.description).toBe('string');
    }
  });

  it('every item has a tags array', () => {
    for (const item of allItems) {
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  it('every item has an allergens array', () => {
    for (const item of allItems) {
      expect(Array.isArray(item.allergens)).toBe(true);
    }
  });

  it('every item has a pairings array', () => {
    for (const item of allItems) {
      expect(Array.isArray(item.pairings)).toBe(true);
    }
  });

  it('every item has an image string', () => {
    for (const item of allItems) {
      expect(typeof item.image).toBe('string');
      expect(item.image.length).toBeGreaterThan(0);
    }
  });

  it('every item has a category field', () => {
    for (const item of allItems) {
      expect(typeof item.category).toBe('string');
      expect(item.category.length).toBeGreaterThan(0);
    }
  });
});

describe('menu.json — data integrity', () => {
  it('all item IDs are unique across the entire menu', () => {
    const ids    = allItems.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all pairings reference valid item IDs that exist in the menu', () => {
    const invalid: string[] = [];
    for (const item of allItems) {
      for (const pairingId of item.pairings) {
        if (!allIds.has(pairingId)) {
          invalid.push(`${item.id} → ${pairingId}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('all prices are reasonable (under $100)', () => {
    for (const item of allItems) {
      expect(item.price).toBeLessThan(100);
    }
  });

  it('all IDs use only lowercase letters, digits, and hyphens', () => {
    for (const item of allItems) {
      expect(item.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
