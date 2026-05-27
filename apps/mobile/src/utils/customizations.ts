export interface CustomizationOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface CustomizationGroup {
  id: string;
  label: string;
  type: 'single' | 'multi';
  minPicks?: number;
  maxPicks?: number;
  options: CustomizationOption[];
  defaultIds: string[];
}

export interface CartLineCustomization {
  groupId: string;
  selectedOptionIds: string[];
}

type CustomizationCatalogue = Record<string, CustomizationGroup[]>;

// ─── Shared option pools ─────────────────────────────────────────────────────

const COOK_OPTIONS: CustomizationOption[] = [
  { id: 'rare',        label: 'Rare',        priceDelta: 0 },
  { id: 'medium-rare', label: 'Medium Rare', priceDelta: 0 },
  { id: 'medium',      label: 'Medium',      priceDelta: 0 },
  { id: 'well-done',   label: 'Well Done',   priceDelta: 0 },
];

const CHEESE_OPTIONS: CustomizationOption[] = [
  { id: 'no-cheese',   label: 'No Cheese',   priceDelta: 0    },
  { id: 'cheddar',     label: 'Cheddar',     priceDelta: 0    },
  { id: 'swiss',       label: 'Swiss',       priceDelta: 0    },
  { id: 'blue-cheese', label: 'Blue Cheese', priceDelta: 0.75 },
  { id: 'brie',        label: 'Brie',        priceDelta: 0.75 },
];

const SAUCE_HEAT_OPTIONS: CustomizationOption[] = [
  { id: 'mild',   label: 'Mild',       priceDelta: 0 },
  { id: 'medium', label: 'Medium',     priceDelta: 0 },
  { id: 'hot',    label: 'Hot',        priceDelta: 0 },
  { id: 'xhot',   label: 'Extra Hot',  priceDelta: 0 },
];

// ─── Catalogue ───────────────────────────────────────────────────────────────

const CATALOGUE: CustomizationCatalogue = {
  'tuna-tartare': [
    {
      id: 'spice', label: 'Spice Level', type: 'single',
      options: SAUCE_HEAT_OPTIONS,
      defaultIds: ['mild'],
    },
    {
      id: 'extras', label: 'Extras', type: 'multi', maxPicks: 3,
      options: [
        { id: 'extra-avocado', label: '+Avocado',  priceDelta: 1.50 },
        { id: 'extra-capers',  label: '+Capers',   priceDelta: 0    },
        { id: 'no-sesame',     label: 'No Sesame', priceDelta: 0    },
      ],
      defaultIds: [],
    },
  ],

  'chicken-wings': [
    {
      id: 'sauce', label: 'Sauce', type: 'single',
      options: [
        { id: 'buffalo',   label: 'Buffalo',   priceDelta: 0 },
        { id: 'bbq',       label: 'BBQ',       priceDelta: 0 },
        { id: 'honey-soy', label: 'Honey Soy', priceDelta: 0 },
        { id: 'dry-rub',   label: 'Dry Rub',   priceDelta: 0 },
      ],
      defaultIds: ['buffalo'],
    },
    {
      id: 'heat', label: 'Heat', type: 'single',
      options: SAUCE_HEAT_OPTIONS,
      defaultIds: ['medium'],
    },
  ],

  'classic-bistro-burger': [
    {
      id: 'cook', label: 'Cook', type: 'single',
      options: COOK_OPTIONS,
      defaultIds: ['medium'],
    },
    {
      id: 'cheese', label: 'Cheese', type: 'single',
      options: CHEESE_OPTIONS,
      defaultIds: ['cheddar'],
    },
    {
      id: 'toppings', label: 'Toppings', type: 'multi', maxPicks: 5,
      options: [
        { id: 'lettuce',     label: 'Lettuce',       priceDelta: 0    },
        { id: 'tomato',      label: 'Tomato',        priceDelta: 0    },
        { id: 'onion',       label: 'Onion',         priceDelta: 0    },
        { id: 'pickles',     label: 'Pickles',       priceDelta: 0    },
        { id: 'bacon',       label: '+Bacon',        priceDelta: 1.50 },
        { id: 'fried-egg',   label: '+Fried Egg',    priceDelta: 1.00 },
        { id: 'jalapenos',   label: '+Jalapeños',    priceDelta: 0    },
        { id: 'extra-patty', label: '+Extra Patty',  priceDelta: 3.50 },
      ],
      defaultIds: ['lettuce', 'tomato', 'onion', 'pickles'],
    },
    {
      id: 'sauce', label: 'Sauce', type: 'single',
      options: [
        { id: 'bistro-sauce', label: 'Bistro Sauce', priceDelta: 0 },
        { id: 'mayo',         label: 'Mayo',         priceDelta: 0 },
        { id: 'mustard',      label: 'Mustard',      priceDelta: 0 },
        { id: 'no-sauce',     label: 'No Sauce',     priceDelta: 0 },
      ],
      defaultIds: ['bistro-sauce'],
    },
    {
      id: 'bun', label: 'Bun', type: 'single',
      options: [
        { id: 'brioche',      label: 'Brioche',         priceDelta: 0    },
        { id: 'sesame',       label: 'Sesame',          priceDelta: 0    },
        { id: 'gf-bun',       label: 'Gluten-Free Bun', priceDelta: 1.50 },
        { id: 'lettuce-wrap', label: 'Lettuce Wrap',    priceDelta: 0    },
      ],
      defaultIds: ['brioche'],
    },
  ],

  'wagyu-smash-burger': [
    {
      id: 'cook', label: 'Cook', type: 'single',
      options: COOK_OPTIONS,
      defaultIds: ['medium-rare'],
    },
    {
      id: 'cheese', label: 'Cheese', type: 'single',
      options: CHEESE_OPTIONS,
      defaultIds: ['cheddar'],
    },
    {
      id: 'toppings', label: 'Toppings', type: 'multi', maxPicks: 5,
      options: [
        { id: 'caramelised-onions', label: 'Caramelised Onions', priceDelta: 0    },
        { id: 'pickles',            label: 'Pickles',             priceDelta: 0    },
        { id: 'bacon',              label: '+Bacon',              priceDelta: 1.50 },
        { id: 'truffle-aioli',      label: '+Truffle Aioli',      priceDelta: 1.00 },
        { id: 'extra-patty',        label: '+Extra Patty',        priceDelta: 4.50 },
      ],
      defaultIds: ['caramelised-onions', 'pickles'],
    },
    {
      id: 'bun', label: 'Bun', type: 'single',
      options: [
        { id: 'brioche',      label: 'Brioche',         priceDelta: 0    },
        { id: 'potato-bun',   label: 'Potato Bun',      priceDelta: 0    },
        { id: 'gf-bun',       label: 'Gluten-Free Bun', priceDelta: 1.50 },
        { id: 'lettuce-wrap', label: 'Lettuce Wrap',    priceDelta: 0    },
      ],
      defaultIds: ['brioche'],
    },
  ],

  'truffle-mushroom-burger': [
    {
      id: 'cook', label: 'Cook', type: 'single',
      options: COOK_OPTIONS,
      defaultIds: ['medium'],
    },
    {
      id: 'cheese', label: 'Cheese', type: 'single',
      options: CHEESE_OPTIONS,
      defaultIds: ['swiss'],
    },
    {
      id: 'toppings', label: 'Toppings', type: 'multi', maxPicks: 4,
      options: [
        { id: 'arugula',         label: 'Arugula',           priceDelta: 0    },
        { id: 'tomato',          label: 'Tomato',            priceDelta: 0    },
        { id: 'extra-truffle',   label: '+Extra Truffle',    priceDelta: 2.00 },
        { id: 'extra-mushrooms', label: '+Extra Mushrooms',  priceDelta: 1.00 },
      ],
      defaultIds: ['arugula', 'tomato'],
    },
    {
      id: 'bun', label: 'Bun', type: 'single',
      options: [
        { id: 'brioche',      label: 'Brioche',         priceDelta: 0    },
        { id: 'gf-bun',       label: 'Gluten-Free Bun', priceDelta: 1.50 },
        { id: 'lettuce-wrap', label: 'Lettuce Wrap',    priceDelta: 0    },
      ],
      defaultIds: ['brioche'],
    },
  ],

  'spicy-chicken-sandwich': [
    {
      id: 'heat', label: 'Heat Level', type: 'single',
      options: SAUCE_HEAT_OPTIONS,
      defaultIds: ['medium'],
    },
    {
      id: 'toppings', label: 'Toppings', type: 'multi', maxPicks: 4,
      options: [
        { id: 'coleslaw',  label: 'Coleslaw',   priceDelta: 0    },
        { id: 'pickles',   label: 'Pickles',    priceDelta: 0    },
        { id: 'lettuce',   label: 'Lettuce',    priceDelta: 0    },
        { id: 'bacon',     label: '+Bacon',     priceDelta: 1.50 },
        { id: 'extra-avo', label: '+Avocado',   priceDelta: 1.50 },
      ],
      defaultIds: ['coleslaw', 'pickles', 'lettuce'],
    },
    {
      id: 'bun', label: 'Bun', type: 'single',
      options: [
        { id: 'brioche',      label: 'Brioche',         priceDelta: 0    },
        { id: 'gf-bun',       label: 'Gluten-Free Bun', priceDelta: 1.50 },
        { id: 'lettuce-wrap', label: 'Lettuce Wrap',    priceDelta: 0    },
      ],
      defaultIds: ['brioche'],
    },
  ],

  'veggie-grain-bowl': [
    {
      id: 'base', label: 'Base', type: 'single',
      options: [
        { id: 'quinoa',       label: 'Quinoa',       priceDelta: 0 },
        { id: 'brown-rice',   label: 'Brown Rice',   priceDelta: 0 },
        { id: 'mixed-greens', label: 'Mixed Greens', priceDelta: 0 },
      ],
      defaultIds: ['quinoa'],
    },
    {
      id: 'protein', label: 'Protein', type: 'single',
      options: [
        { id: 'chickpeas', label: 'Chickpeas',  priceDelta: 0    },
        { id: 'tofu',      label: 'Tofu',       priceDelta: 0    },
        { id: 'chicken',   label: '+Chicken',   priceDelta: 3.00 },
        { id: 'halloumi',  label: '+Halloumi',  priceDelta: 2.00 },
      ],
      defaultIds: ['chickpeas'],
    },
    {
      id: 'dressing', label: 'Dressing', type: 'single',
      options: [
        { id: 'tahini',      label: 'Tahini',      priceDelta: 0 },
        { id: 'lemon',       label: 'Lemon',       priceDelta: 0 },
        { id: 'balsamic',    label: 'Balsamic',    priceDelta: 0 },
        { id: 'no-dressing', label: 'No Dressing', priceDelta: 0 },
      ],
      defaultIds: ['tahini'],
    },
    {
      id: 'extras', label: 'Extras', type: 'multi', maxPicks: 3,
      options: [
        { id: 'extra-avocado', label: '+Avocado',       priceDelta: 1.50 },
        { id: 'extra-feta',    label: '+Feta',          priceDelta: 1.00 },
        { id: 'extra-nuts',    label: '+Nuts & Seeds',  priceDelta: 0.75 },
      ],
      defaultIds: [],
    },
  ],

  'bbq-pulled-pork': [
    {
      id: 'heat', label: 'Heat Level', type: 'single',
      options: SAUCE_HEAT_OPTIONS,
      defaultIds: ['medium'],
    },
    {
      id: 'toppings', label: 'Toppings', type: 'multi', maxPicks: 4,
      options: [
        { id: 'coleslaw',    label: 'Coleslaw',     priceDelta: 0 },
        { id: 'pickles',     label: 'Pickles',      priceDelta: 0 },
        { id: 'jalapeños',   label: '+Jalapeños',   priceDelta: 0 },
        { id: 'extra-sauce', label: '+Extra Sauce', priceDelta: 0 },
      ],
      defaultIds: ['coleslaw', 'pickles'],
    },
    {
      id: 'bun', label: 'Bun', type: 'single',
      options: [
        { id: 'brioche',      label: 'Brioche',         priceDelta: 0    },
        { id: 'gf-bun',       label: 'Gluten-Free Bun', priceDelta: 1.50 },
        { id: 'lettuce-wrap', label: 'Lettuce Wrap',    priceDelta: 0    },
      ],
      defaultIds: ['brioche'],
    },
  ],

  'truffle-fries': [
    {
      id: 'seasoning', label: 'Seasoning', type: 'single',
      options: [
        { id: 'truffle-parmesan', label: 'Truffle & Parmesan', priceDelta: 0 },
        { id: 'plain-salt',       label: 'Plain Salt',         priceDelta: 0 },
        { id: 'cajun',            label: 'Cajun',              priceDelta: 0 },
      ],
      defaultIds: ['truffle-parmesan'],
    },
    {
      id: 'sauce', label: 'Dipping Sauce', type: 'multi', maxPicks: 2,
      options: [
        { id: 'aioli',        label: 'Aioli',        priceDelta: 0    },
        { id: 'ketchup',      label: 'Ketchup',      priceDelta: 0    },
        { id: 'sriracha',     label: 'Sriracha',     priceDelta: 0    },
        { id: 'gravy',        label: '+Gravy',       priceDelta: 1.00 },
        { id: 'cheese-sauce', label: '+Cheese Sauce', priceDelta: 1.50 },
      ],
      defaultIds: ['aioli'],
    },
  ],

  'sweet-potato-fries': [
    {
      id: 'seasoning', label: 'Seasoning', type: 'single',
      options: [
        { id: 'cinnamon-salt', label: 'Cinnamon Salt', priceDelta: 0 },
        { id: 'plain-salt',    label: 'Plain Salt',    priceDelta: 0 },
        { id: 'cajun',         label: 'Cajun',         priceDelta: 0 },
      ],
      defaultIds: ['cinnamon-salt'],
    },
    {
      id: 'sauce', label: 'Dipping Sauce', type: 'multi', maxPicks: 2,
      options: [
        { id: 'chipotle-mayo', label: 'Chipotle Mayo', priceDelta: 0    },
        { id: 'ketchup',       label: 'Ketchup',       priceDelta: 0    },
        { id: 'sriracha',      label: 'Sriracha',       priceDelta: 0   },
        { id: 'cheese-sauce',  label: '+Cheese Sauce', priceDelta: 1.50 },
      ],
      defaultIds: ['chipotle-mayo'],
    },
  ],

  'caesar-side': [
    {
      id: 'dressing', label: 'Dressing', type: 'single',
      options: [
        { id: 'caesar',      label: 'Caesar',       priceDelta: 0 },
        { id: 'light',       label: 'Light Caesar', priceDelta: 0 },
        { id: 'no-dressing', label: 'No Dressing',  priceDelta: 0 },
      ],
      defaultIds: ['caesar'],
    },
    {
      id: 'extras', label: 'Extras', type: 'multi', maxPicks: 2,
      options: [
        { id: 'extra-croutons', label: '+Croutons',   priceDelta: 0    },
        { id: 'no-parmesan',    label: 'No Parmesan', priceDelta: 0    },
        { id: 'anchovies',      label: '+Anchovies',  priceDelta: 0.75 },
        { id: 'chicken',        label: '+Chicken',    priceDelta: 3.00 },
      ],
      defaultIds: [],
    },
  ],

  'onion-rings': [
    {
      id: 'sauce', label: 'Dipping Sauce', type: 'single',
      options: [
        { id: 'ranch',    label: 'Ranch',    priceDelta: 0 },
        { id: 'ketchup',  label: 'Ketchup',  priceDelta: 0 },
        { id: 'sriracha', label: 'Sriracha', priceDelta: 0 },
        { id: 'aioli',    label: 'Aioli',    priceDelta: 0 },
      ],
      defaultIds: ['ranch'],
    },
  ],

  'mac-cheese': [
    {
      id: 'style', label: 'Style', type: 'single',
      options: [
        { id: 'classic', label: 'Classic',       priceDelta: 0    },
        { id: 'baked',   label: 'Baked Crispy',  priceDelta: 0    },
        { id: 'truffle', label: 'Truffle',        priceDelta: 1.50 },
      ],
      defaultIds: ['classic'],
    },
    {
      id: 'extras', label: 'Add-ons', type: 'multi', maxPicks: 2,
      options: [
        { id: 'breadcrumbs', label: '+Breadcrumbs', priceDelta: 0    },
        { id: 'bacon-bits',  label: '+Bacon Bits',  priceDelta: 1.50 },
        { id: 'jalapeños',   label: '+Jalapeños',   priceDelta: 0    },
      ],
      defaultIds: [],
    },
  ],

  'coleslaw': [
    {
      id: 'dressing', label: 'Dressing', type: 'single',
      options: [
        { id: 'creamy',  label: 'Creamy',  priceDelta: 0 },
        { id: 'vinegar', label: 'Vinegar', priceDelta: 0 },
        { id: 'light',   label: 'Light',   priceDelta: 0 },
      ],
      defaultIds: ['creamy'],
    },
  ],

  'fresh-lemonade': [
    {
      id: 'sweetness', label: 'Sweetness', type: 'single',
      options: [
        { id: 'regular', label: 'Regular',     priceDelta: 0 },
        { id: 'less',    label: 'Less Sweet',  priceDelta: 0 },
        { id: 'none',    label: 'Unsweetened', priceDelta: 0 },
      ],
      defaultIds: ['regular'],
    },
    {
      id: 'extras', label: 'Add-ons', type: 'multi', maxPicks: 2,
      options: [
        { id: 'mint',      label: '+Mint',      priceDelta: 0    },
        { id: 'ginger',    label: '+Ginger',    priceDelta: 0    },
        { id: 'sparkling', label: 'Sparkling',  priceDelta: 0.50 },
      ],
      defaultIds: [],
    },
  ],

  'iced-tea': [
    {
      id: 'type', label: 'Type', type: 'single',
      options: [
        { id: 'black', label: 'Black Tea', priceDelta: 0 },
        { id: 'green', label: 'Green Tea', priceDelta: 0 },
        { id: 'peach', label: 'Peach',     priceDelta: 0 },
        { id: 'lemon', label: 'Lemon',     priceDelta: 0 },
      ],
      defaultIds: ['black'],
    },
    {
      id: 'sweetness', label: 'Sweetness', type: 'single',
      options: [
        { id: 'regular', label: 'Regular',     priceDelta: 0 },
        { id: 'less',    label: 'Less Sweet',  priceDelta: 0 },
        { id: 'none',    label: 'Unsweetened', priceDelta: 0 },
      ],
      defaultIds: ['regular'],
    },
  ],

  'root-beer-float': [
    {
      id: 'ice-cream', label: 'Ice Cream', type: 'single',
      options: [
        { id: 'vanilla',        label: 'Vanilla',        priceDelta: 0    },
        { id: 'chocolate',      label: 'Chocolate',      priceDelta: 0    },
        { id: 'salted-caramel', label: 'Salted Caramel', priceDelta: 0.50 },
      ],
      defaultIds: ['vanilla'],
    },
  ],

  'warm-brownie': [
    {
      id: 'topping', label: 'Topping', type: 'multi', maxPicks: 3,
      options: [
        { id: 'ice-cream',     label: '+Ice Cream',     priceDelta: 1.50 },
        { id: 'whipped-cream', label: '+Whipped Cream', priceDelta: 0.75 },
        { id: 'caramel',       label: '+Caramel',       priceDelta: 0.75 },
        { id: 'nuts',          label: '+Nuts',          priceDelta: 0.75 },
        { id: 'no-topping',    label: 'Plain',          priceDelta: 0    },
      ],
      defaultIds: [],
    },
  ],

  'vanilla-cheesecake': [
    {
      id: 'topping', label: 'Topping', type: 'multi', maxPicks: 2,
      options: [
        { id: 'berry-coulis',  label: 'Berry Coulis',   priceDelta: 0    },
        { id: 'caramel',       label: 'Caramel Drizzle', priceDelta: 0   },
        { id: 'whipped-cream', label: '+Whipped Cream', priceDelta: 0.75 },
        { id: 'no-topping',    label: 'Plain',          priceDelta: 0    },
      ],
      defaultIds: ['berry-coulis'],
    },
  ],

  'gelato-2-scoops': [
    {
      id: 'flavours', label: 'Flavours', type: 'multi', minPicks: 1, maxPicks: 2,
      options: [
        { id: 'vanilla',        label: 'Vanilla',        priceDelta: 0 },
        { id: 'chocolate',      label: 'Chocolate',      priceDelta: 0 },
        { id: 'pistachio',      label: 'Pistachio',      priceDelta: 0 },
        { id: 'strawberry',     label: 'Strawberry',     priceDelta: 0 },
        { id: 'salted-caramel', label: 'Salted Caramel', priceDelta: 0 },
        { id: 'lemon-sorbet',   label: 'Lemon Sorbet',   priceDelta: 0 },
      ],
      defaultIds: ['vanilla', 'chocolate'],
    },
    {
      id: 'extras', label: 'Extras', type: 'multi', maxPicks: 2,
      options: [
        { id: 'waffle-cone', label: '+Waffle Cone', priceDelta: 1.00 },
        { id: 'sprinkles',   label: '+Sprinkles',   priceDelta: 0    },
        { id: 'hot-fudge',   label: '+Hot Fudge',   priceDelta: 0.75 },
        { id: 'extra-scoop', label: '+Extra Scoop', priceDelta: 2.00 },
      ],
      defaultIds: [],
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCustomizationGroups(itemId: string): CustomizationGroup[] {
  return CATALOGUE[itemId] ?? [];
}

export function getDefaultCustomizations(itemId: string): CartLineCustomization[] {
  return getCustomizationGroups(itemId).map(g => ({
    groupId: g.id,
    selectedOptionIds: [...g.defaultIds],
  }));
}

export function calculatePriceDelta(itemId: string, customs: CartLineCustomization[]): number {
  const groups = getCustomizationGroups(itemId);
  let delta = 0;
  for (const c of customs) {
    const group = groups.find(g => g.id === c.groupId);
    if (!group) continue;
    for (const optId of c.selectedOptionIds) {
      const opt = group.options.find(o => o.id === optId);
      if (opt) delta += opt.priceDelta;
    }
  }
  return Math.round(delta * 100) / 100;
}

export function isCustomised(itemId: string, customs: CartLineCustomization[]): boolean {
  const defaults = getDefaultCustomizations(itemId);
  if (customs.length !== defaults.length) return true;
  for (const def of defaults) {
    const actual = customs.find(c => c.groupId === def.groupId);
    if (!actual) return true;
    if ([...def.selectedOptionIds].sort().join(',') !== [...actual.selectedOptionIds].sort().join(',')) return true;
  }
  return false;
}

export function summariseCustomizations(itemId: string, customs: CartLineCustomization[]): string {
  const groups = getCustomizationGroups(itemId);
  const parts: string[] = [];

  for (const c of customs) {
    const group = groups.find(g => g.id === c.groupId);
    if (!group || c.selectedOptionIds.length === 0) continue;

    const sortedDefault = [...group.defaultIds].sort().join(',');
    const sortedActual  = [...c.selectedOptionIds].sort().join(',');
    if (sortedDefault === sortedActual) continue;

    for (const optId of c.selectedOptionIds) {
      const opt = group.options.find(o => o.id === optId);
      if (opt) parts.push(opt.label);
    }
  }

  return parts.join(' · ');
}
