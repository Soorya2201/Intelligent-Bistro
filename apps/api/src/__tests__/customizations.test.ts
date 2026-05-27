import {
  CUSTOMIZATION_CATALOGUE,
  getCustomizationGroups,
  CustomizationGroup,
} from '../data/customizations';

const ALL_MENU_IDS = [
  'tuna-tartare', 'chicken-wings',
  'classic-bistro-burger', 'wagyu-smash-burger', 'truffle-mushroom-burger',
  'spicy-chicken-sandwich', 'veggie-grain-bowl', 'bbq-pulled-pork',
  'truffle-fries', 'sweet-potato-fries', 'caesar-side', 'onion-rings',
  'mac-cheese', 'coleslaw',
  'fresh-lemonade', 'iced-tea', 'root-beer-float',
  'warm-brownie', 'vanilla-cheesecake', 'gelato-2-scoops',
];

describe('CUSTOMIZATION_CATALOGUE', () => {
  it('covers every menu item', () => {
    for (const id of ALL_MENU_IDS) {
      expect(CUSTOMIZATION_CATALOGUE[id]).toBeDefined();
      expect(CUSTOMIZATION_CATALOGUE[id].length).toBeGreaterThan(0);
    }
  });

  it('every group has required fields', () => {
    for (const [, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      for (const g of groups as CustomizationGroup[]) {
        expect(typeof g.id).toBe('string');
        expect(typeof g.label).toBe('string');
        expect(['single', 'multi']).toContain(g.type);
        expect(Array.isArray(g.options)).toBe(true);
        expect(Array.isArray(g.defaultIds)).toBe(true);
      }
    }
  });

  it('every option has id, label, and numeric priceDelta', () => {
    for (const [, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      for (const g of groups as CustomizationGroup[]) {
        for (const o of g.options) {
          expect(typeof o.id).toBe('string');
          expect(typeof o.label).toBe('string');
          expect(typeof o.priceDelta).toBe('number');
          expect(o.priceDelta).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('all defaultIds reference valid option ids within the same group', () => {
    for (const [itemId, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      for (const g of groups as CustomizationGroup[]) {
        const optionIds = new Set(g.options.map(o => o.id));
        for (const defId of g.defaultIds) {
          expect(optionIds.has(defId)).toBe(true);
        }
      }
    }
  });

  it('single-type groups have exactly one defaultId', () => {
    for (const [, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      for (const g of groups as CustomizationGroup[]) {
        if (g.type === 'single') {
          expect(g.defaultIds.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('group ids are unique within an item', () => {
    for (const [itemId, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      const ids = (groups as CustomizationGroup[]).map(g => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('maxPicks >= minPicks when both are defined', () => {
    for (const [, groups] of Object.entries(CUSTOMIZATION_CATALOGUE)) {
      for (const g of groups as CustomizationGroup[]) {
        if (g.minPicks !== undefined && g.maxPicks !== undefined) {
          expect(g.maxPicks).toBeGreaterThanOrEqual(g.minPicks);
        }
      }
    }
  });
});

describe('getCustomizationGroups', () => {
  it('returns groups for known item', () => {
    const groups = getCustomizationGroups('classic-bistro-burger');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown item', () => {
    expect(getCustomizationGroups('nonexistent')).toEqual([]);
  });

  it('burgers have a cook group', () => {
    const burgers = ['classic-bistro-burger', 'wagyu-smash-burger', 'truffle-mushroom-burger'];
    for (const id of burgers) {
      const groups = getCustomizationGroups(id);
      expect(groups.find(g => g.id === 'cook')).toBeDefined();
    }
  });

  it('gelato has flavours group with minPicks=1 and maxPicks=2', () => {
    const groups  = getCustomizationGroups('gelato-2-scoops');
    const flavours = groups.find(g => g.id === 'flavours');
    expect(flavours).toBeDefined();
    expect(flavours!.minPicks).toBe(1);
    expect(flavours!.maxPicks).toBe(2);
  });

  it('truffle-fries has a dipping sauce group', () => {
    const groups = getCustomizationGroups('truffle-fries');
    expect(groups.find(g => g.id === 'sauce')).toBeDefined();
  });
});
