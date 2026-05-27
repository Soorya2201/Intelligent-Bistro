import {
  getCustomizationGroups,
  getDefaultCustomizations,
  calculatePriceDelta,
  isCustomised,
  summariseCustomizations,
  CartLineCustomization,
} from '../customizations';

describe('getCustomizationGroups', () => {
  it('returns groups for a known item', () => {
    const groups = getCustomizationGroups('classic-bistro-burger');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.find(g => g.id === 'cook')).toBeDefined();
    expect(groups.find(g => g.id === 'cheese')).toBeDefined();
    expect(groups.find(g => g.id === 'toppings')).toBeDefined();
  });

  it('returns empty array for unknown item', () => {
    expect(getCustomizationGroups('nonexistent-item')).toEqual([]);
  });

  it('returns groups for all catalogue item IDs', () => {
    const knownIds = [
      'tuna-tartare', 'chicken-wings',
      'classic-bistro-burger', 'wagyu-smash-burger', 'truffle-mushroom-burger',
      'spicy-chicken-sandwich', 'veggie-grain-bowl', 'bbq-pulled-pork',
      'truffle-fries', 'sweet-potato-fries', 'caesar-side', 'onion-rings',
      'mac-cheese', 'coleslaw',
      'fresh-lemonade', 'iced-tea', 'root-beer-float',
      'warm-brownie', 'vanilla-cheesecake', 'gelato-2-scoops',
    ];
    for (const id of knownIds) {
      expect(getCustomizationGroups(id).length).toBeGreaterThan(0);
    }
  });

  it('every group has required fields', () => {
    const groups = getCustomizationGroups('classic-bistro-burger');
    for (const g of groups) {
      expect(typeof g.id).toBe('string');
      expect(typeof g.label).toBe('string');
      expect(['single', 'multi']).toContain(g.type);
      expect(Array.isArray(g.options)).toBe(true);
      expect(Array.isArray(g.defaultIds)).toBe(true);
    }
  });

  it('every option has id, label, and priceDelta', () => {
    const groups = getCustomizationGroups('wagyu-smash-burger');
    for (const g of groups) {
      for (const o of g.options) {
        expect(typeof o.id).toBe('string');
        expect(typeof o.label).toBe('string');
        expect(typeof o.priceDelta).toBe('number');
      }
    }
  });

  it('defaultIds reference valid option ids', () => {
    const groups = getCustomizationGroups('gelato-2-scoops');
    for (const g of groups) {
      const optionIds = new Set(g.options.map(o => o.id));
      for (const defId of g.defaultIds) {
        expect(optionIds.has(defId)).toBe(true);
      }
    }
  });
});

describe('getDefaultCustomizations', () => {
  it('returns one entry per group', () => {
    const groups  = getCustomizationGroups('classic-bistro-burger');
    const customs = getDefaultCustomizations('classic-bistro-burger');
    expect(customs.length).toBe(groups.length);
  });

  it('each entry groupId matches a group', () => {
    const groups  = getCustomizationGroups('truffle-fries');
    const customs = getDefaultCustomizations('truffle-fries');
    const groupIds = new Set(groups.map(g => g.id));
    for (const c of customs) {
      expect(groupIds.has(c.groupId)).toBe(true);
    }
  });

  it('selectedOptionIds match defaultIds', () => {
    const groups  = getCustomizationGroups('classic-bistro-burger');
    const customs = getDefaultCustomizations('classic-bistro-burger');
    for (const g of groups) {
      const custom = customs.find(c => c.groupId === g.id);
      expect(custom).toBeDefined();
      expect(custom!.selectedOptionIds.sort()).toEqual([...g.defaultIds].sort());
    }
  });

  it('returns empty array for unknown item', () => {
    expect(getDefaultCustomizations('ghost-item')).toEqual([]);
  });

  it('gelato defaults are vanilla and chocolate', () => {
    const customs = getDefaultCustomizations('gelato-2-scoops');
    const flavours = customs.find(c => c.groupId === 'flavours');
    expect(flavours?.selectedOptionIds.sort()).toEqual(['chocolate', 'vanilla']);
  });
});

describe('calculatePriceDelta', () => {
  it('returns 0 for default selections', () => {
    const customs = getDefaultCustomizations('classic-bistro-burger');
    expect(calculatePriceDelta('classic-bistro-burger', customs)).toBe(0);
  });

  it('adds price for premium options', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'cook',     selectedOptionIds: ['medium'] },
      { groupId: 'cheese',   selectedOptionIds: ['blue-cheese'] },  // +0.75
      { groupId: 'toppings', selectedOptionIds: ['bacon', 'lettuce'] }, // +1.50
      { groupId: 'sauce',    selectedOptionIds: ['bistro-sauce'] },
      { groupId: 'bun',      selectedOptionIds: ['brioche'] },
    ];
    expect(calculatePriceDelta('classic-bistro-burger', customs)).toBeCloseTo(2.25);
  });

  it('returns 0 for empty customs array', () => {
    expect(calculatePriceDelta('truffle-fries', [])).toBe(0);
  });

  it('returns 0 for unknown item', () => {
    const customs: CartLineCustomization[] = [{ groupId: 'cook', selectedOptionIds: ['medium'] }];
    expect(calculatePriceDelta('ghost-item', customs)).toBe(0);
  });

  it('ignores groups not in catalogue', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'nonexistent-group', selectedOptionIds: ['some-opt'] },
    ];
    expect(calculatePriceDelta('truffle-fries', customs)).toBe(0);
  });

  it('handles multiple add-ons in gelato', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'flavours', selectedOptionIds: ['pistachio', 'strawberry'] },
      { groupId: 'extras',   selectedOptionIds: ['waffle-cone', 'hot-fudge'] }, // +1.00 +0.75
    ];
    expect(calculatePriceDelta('gelato-2-scoops', customs)).toBeCloseTo(1.75);
  });
});

describe('isCustomised', () => {
  it('returns false for default selections', () => {
    const customs = getDefaultCustomizations('classic-bistro-burger');
    expect(isCustomised('classic-bistro-burger', customs)).toBe(false);
  });

  it('returns true when an option differs from default', () => {
    const customs = getDefaultCustomizations('classic-bistro-burger');
    const modified = customs.map(c =>
      c.groupId === 'cook' ? { ...c, selectedOptionIds: ['well-done'] } : c
    );
    expect(isCustomised('classic-bistro-burger', modified)).toBe(true);
  });

  it('returns true when groups count differs', () => {
    const customs: CartLineCustomization[] = [{ groupId: 'cook', selectedOptionIds: ['medium'] }];
    expect(isCustomised('classic-bistro-burger', customs)).toBe(true);
  });

  it('returns false for unknown item with empty customs', () => {
    expect(isCustomised('ghost-item', [])).toBe(false);
  });

  it('order of selectedOptionIds does not matter', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'toppings', selectedOptionIds: ['tomato', 'lettuce', 'pickles', 'onion'] },
      { groupId: 'cook',     selectedOptionIds: ['medium'] },
      { groupId: 'cheese',   selectedOptionIds: ['cheddar'] },
      { groupId: 'sauce',    selectedOptionIds: ['bistro-sauce'] },
      { groupId: 'bun',      selectedOptionIds: ['brioche'] },
    ];
    expect(isCustomised('classic-bistro-burger', customs)).toBe(false);
  });

  it('returns true when an extra topping is added', () => {
    const customs = getDefaultCustomizations('classic-bistro-burger').map(c =>
      c.groupId === 'toppings'
        ? { ...c, selectedOptionIds: [...c.selectedOptionIds, 'bacon'] }
        : c
    );
    expect(isCustomised('classic-bistro-burger', customs)).toBe(true);
  });
});

describe('summariseCustomizations', () => {
  it('returns empty string for default selections', () => {
    const customs = getDefaultCustomizations('classic-bistro-burger');
    expect(summariseCustomizations('classic-bistro-burger', customs)).toBe('');
  });

  it('returns changed options only', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'cook',     selectedOptionIds: ['well-done'] },
      { groupId: 'cheese',   selectedOptionIds: ['blue-cheese'] },
      { groupId: 'toppings', selectedOptionIds: ['lettuce', 'tomato', 'onion', 'pickles'] },
      { groupId: 'sauce',    selectedOptionIds: ['bistro-sauce'] },
      { groupId: 'bun',      selectedOptionIds: ['brioche'] },
    ];
    const summary = summariseCustomizations('classic-bistro-burger', customs);
    expect(summary).toContain('Well Done');
    expect(summary).toContain('Blue Cheese');
    expect(summary).not.toContain('Lettuce');
  });

  it('uses · as separator', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'cook',     selectedOptionIds: ['rare'] },
      { groupId: 'cheese',   selectedOptionIds: ['brie'] },
      { groupId: 'toppings', selectedOptionIds: ['lettuce', 'tomato', 'onion', 'pickles'] },
      { groupId: 'sauce',    selectedOptionIds: ['bistro-sauce'] },
      { groupId: 'bun',      selectedOptionIds: ['brioche'] },
    ];
    const summary = summariseCustomizations('classic-bistro-burger', customs);
    expect(summary).toContain('·');
  });

  it('returns empty string for unknown item', () => {
    const customs: CartLineCustomization[] = [{ groupId: 'cook', selectedOptionIds: ['medium'] }];
    expect(summariseCustomizations('ghost-item', customs)).toBe('');
  });

  it('handles gelato flavour change', () => {
    const customs: CartLineCustomization[] = [
      { groupId: 'flavours', selectedOptionIds: ['pistachio', 'lemon-sorbet'] },
      { groupId: 'extras',   selectedOptionIds: [] },
    ];
    const summary = summariseCustomizations('gelato-2-scoops', customs);
    expect(summary).toContain('Pistachio');
    expect(summary).toContain('Lemon Sorbet');
  });
});
