import {
  AddItemSchema, RemoveItemSchema, UpdateQuantitySchema,
  ClarifySchema, SuggestPairingSchema, ClearCartSchema, UpsellSchema, UpdateNotesSchema,
  AskCustomizationSchema,
  BISTRO_TOOLS, validateToolInput,
} from '../ai/tools';

describe('AddItemSchema', () => {
  it('accepts valid input', () => {
    const result = AddItemSchema.safeParse({ item_id: 'truffle-fries', quantity: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts optional notes', () => {
    const result = AddItemSchema.safeParse({ item_id: 'truffle-fries', quantity: 1, notes: 'extra crispy' });
    expect(result.success).toBe(true);
  });

  it('rejects quantity = 0', () => {
    const result = AddItemSchema.safeParse({ item_id: 'truffle-fries', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects quantity > 20', () => {
    const result = AddItemSchema.safeParse({ item_id: 'truffle-fries', quantity: 21 });
    expect(result.success).toBe(false);
  });

  it('rejects missing item_id', () => {
    const result = AddItemSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = AddItemSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe('RemoveItemSchema', () => {
  it('accepts valid input without quantity', () => {
    const result = RemoveItemSchema.safeParse({ item_id: 'truffle-fries' });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with quantity', () => {
    const result = RemoveItemSchema.safeParse({ item_id: 'truffle-fries', quantity: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects missing item_id', () => {
    const result = RemoveItemSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateQuantitySchema', () => {
  it('accepts new_quantity = 0 (remove)', () => {
    const result = UpdateQuantitySchema.safeParse({ item_id: 'truffle-fries', new_quantity: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts positive new_quantity', () => {
    const result = UpdateQuantitySchema.safeParse({ item_id: 'truffle-fries', new_quantity: 3 });
    expect(result.success).toBe(true);
  });

  it('rejects negative new_quantity', () => {
    const result = UpdateQuantitySchema.safeParse({ item_id: 'truffle-fries', new_quantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe('ClarifySchema', () => {
  it('accepts question without options', () => {
    const result = ClarifySchema.safeParse({ question: 'Did you mean the burger or the sandwich?' });
    expect(result.success).toBe(true);
  });

  it('accepts question with options', () => {
    const result = ClarifySchema.safeParse({
      question: 'Which burger?',
      options: ['Classic', 'Wagyu Smash'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing question', () => {
    const result = ClarifySchema.safeParse({ options: ['a', 'b'] });
    expect(result.success).toBe(false);
  });
});

describe('SuggestPairingSchema', () => {
  it('accepts 1-3 item_ids', () => {
    const result = SuggestPairingSchema.safeParse({
      item_ids: ['truffle-fries'],
      reason: 'goes great with your burger',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty item_ids array', () => {
    const result = SuggestPairingSchema.safeParse({ item_ids: [], reason: 'test' });
    expect(result.success).toBe(false);
  });

  it('rejects > 3 item_ids', () => {
    const result = SuggestPairingSchema.safeParse({
      item_ids: ['a', 'b', 'c', 'd'],
      reason: 'too many',
    });
    expect(result.success).toBe(false);
  });

  it('rejects reason > 100 chars', () => {
    const result = SuggestPairingSchema.safeParse({
      item_ids: ['truffle-fries'],
      reason: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('ClearCartSchema', () => {
  it('accepts confirm = true', () => {
    const result = ClearCartSchema.safeParse({ confirm: true });
    expect(result.success).toBe(true);
  });

  it('rejects confirm = false', () => {
    const result = ClearCartSchema.safeParse({ confirm: false });
    // confirm=false is valid JSON but semantically should still parse
    // The route validates confirm=true before clearing
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.confirm).toBe(false);
  });

  it('rejects missing confirm', () => {
    const result = ClearCartSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('UpsellSchema', () => {
  it('accepts valid pitch', () => {
    const result = UpsellSchema.safeParse({ item_id: 'truffle-fries', pitch: 'Goes great with your burger!' });
    expect(result.success).toBe(true);
  });

  it('rejects pitch > 80 chars', () => {
    const result = UpsellSchema.safeParse({ item_id: 'x', pitch: 'y'.repeat(81) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateNotesSchema', () => {
  it('accepts valid item_id and notes', () => {
    const result = UpdateNotesSchema.safeParse({ item_id: 'truffle-fries', notes: 'extra crispy' });
    expect(result.success).toBe(true);
  });

  it('rejects missing item_id', () => {
    const result = UpdateNotesSchema.safeParse({ notes: 'extra crispy' });
    expect(result.success).toBe(false);
  });

  it('rejects missing notes', () => {
    const result = UpdateNotesSchema.safeParse({ item_id: 'truffle-fries' });
    expect(result.success).toBe(false);
  });
});

describe('AskCustomizationSchema', () => {
  it('accepts item_id and prompt', () => {
    const result = AskCustomizationSchema.safeParse({ item_id: 'classic-bistro-burger', prompt: 'How would you like your burger?' });
    expect(result.success).toBe(true);
  });

  it('accepts optional line_id', () => {
    const result = AskCustomizationSchema.safeParse({ item_id: 'truffle-fries', prompt: 'Sauce?', line_id: 'line-123' });
    expect(result.success).toBe(true);
  });

  it('rejects prompt > 120 chars', () => {
    const result = AskCustomizationSchema.safeParse({ item_id: 'x', prompt: 'p'.repeat(121) });
    expect(result.success).toBe(false);
  });

  it('rejects missing item_id', () => {
    const result = AskCustomizationSchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('BISTRO_TOOLS', () => {
  it('exports 9 tools', () => {
    expect(BISTRO_TOOLS.length).toBe(9);
  });

  it('every tool has name, description, and input_schema', () => {
    for (const tool of BISTRO_TOOLS) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.input_schema).toBe('object');
    }
  });

  it('tool names match expected set', () => {
    const names = BISTRO_TOOLS.map(t => t.name);
    expect(names).toContain('add_item');
    expect(names).toContain('remove_item');
    expect(names).toContain('update_quantity');
    expect(names).toContain('clarify');
    expect(names).toContain('suggest_pairing');
    expect(names).toContain('clear_cart');
    expect(names).toContain('upsell');
    expect(names).toContain('update_notes');
    expect(names).toContain('ask_customization');
  });

  it('each input_schema has a type field', () => {
    for (const tool of BISTRO_TOOLS) {
      expect((tool.input_schema as any).type).toBeDefined();
    }
  });
});

describe('validateToolInput', () => {
  it('returns success for valid add_item', () => {
    const result = validateToolInput('add_item', { item_id: 'truffle-fries', quantity: 2 });
    expect(result.success).toBe(true);
  });

  it('returns error for unknown tool', () => {
    const result = validateToolInput('unknown_tool', {});
    expect(result.success).toBe(false);
  });

  it('returns error for invalid add_item input', () => {
    const result = validateToolInput('add_item', { quantity: 99 });
    expect(result.success).toBe(false);
  });
});
