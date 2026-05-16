// Updated for v2: structured SSE parser (replaced sentinel protocol)
import { parseSSEEvent, stripSentinels } from '../streamParser';
import { ITEM_IMAGES } from '../../constants/itemImages';
import menuData from '../../../../api/src/data/menu.json';

describe('parseSSEEvent — text passthrough (delta events)', () => {
  it('returns visible text from a delta event', () => {
    const line   = 'data: {"type":"delta","text":"Hello, welcome!"}';
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('Hello, welcome!');
    expect(result!.type).toBe('delta');
  });

  it('accumulates text across multiple delta events', () => {
    const r1 = parseSSEEvent('data: {"type":"delta","text":"Hello "}');
    const r2 = parseSSEEvent('data: {"type":"delta","text":"world"}');
    const combined = (r1?.text || '') + (r2?.text || '');
    expect(combined).toBe('Hello world');
  });

  it('returns null for empty data line', () => {
    expect(parseSSEEvent('data: ')).toBeNull();
  });
});

describe('parseSSEEvent — actions event', () => {
  it('parses an applied add_item tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'add_item', input: { item_id: 'truffle-fries', quantity: 2 }, status: 'applied' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('actions');
    expect(result!.actions).toHaveLength(1);
    expect(result!.actions![0].name).toBe('add_item');
    expect(result!.actions![0].status).toBe('applied');
  });

  it('parses a rejected tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'add_item', input: {}, status: 'rejected', rejectionReason: 'Missing item_id' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions![0].status).toBe('rejected');
    expect(result!.actions![0].rejectionReason).toBe('Missing item_id');
  });

  it('parses a remove_item tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'remove_item', input: { item_id: 'truffle-fries' }, status: 'applied' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions![0].name).toBe('remove_item');
  });

  it('parses an update_quantity tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'update_quantity', input: { item_id: 'truffle-fries', new_quantity: 3 }, status: 'applied' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions![0].input.new_quantity).toBe(3);
  });

  it('parses a clarify tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'clarify', input: { question: 'Which burger?', options: ['Classic', 'Wagyu'] }, status: 'applied' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions![0].name).toBe('clarify');
    expect((result!.actions![0].input.options as string[])).toEqual(['Classic', 'Wagyu']);
  });

  it('parses an upsell tool call', () => {
    const payload = {
      type: 'actions',
      actions: [{ name: 'upsell', input: { item_id: 'truffle-fries', pitch: 'Try the fries!' }, status: 'applied' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions![0].name).toBe('upsell');
  });

  it('parses two actions in one event', () => {
    const payload = {
      type: 'actions',
      actions: [
        { name: 'add_item', input: { item_id: 'truffle-fries', quantity: 1 }, status: 'applied' },
        { name: 'upsell',   input: { item_id: 'craft-cola', pitch: 'Goes well!' }, status: 'applied' },
      ],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.actions).toHaveLength(2);
    expect(result!.actions![0].name).toBe('add_item');
    expect(result!.actions![1].name).toBe('upsell');
  });
});

describe('parseSSEEvent — recommendations event', () => {
  it('parses a recommendations event', () => {
    const payload = {
      type: 'recommendations',
      items: [{ item_id: 'truffle-fries', name: 'Truffle Fries', price: 8.5, image: '🍟', reason: 'Pairs well', score: 0.82, source: 'pairing' }],
    };
    const result = parseSSEEvent(`data: ${JSON.stringify(payload)}`);
    expect(result!.type).toBe('recommendations');
    expect(result!.recommendations).toHaveLength(1);
    expect(result!.recommendations![0].item_id).toBe('truffle-fries');
    expect(result!.recommendations![0].score).toBe(0.82);
  });
});

describe('parseSSEEvent — done event', () => {
  it('parses a done event', () => {
    const result = parseSSEEvent('data: {"type":"done"}');
    expect(result!.type).toBe('done');
  });
});

describe('parseSSEEvent — error resilience', () => {
  it('does not throw on malformed JSON', () => {
    expect(() => parseSSEEvent('data: {not valid json')).not.toThrow();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSSEEvent('data: {broken')).toBeNull();
  });

  it('returns null for event without type field', () => {
    expect(parseSSEEvent('data: {"text":"no type"}')).toBeNull();
  });

  it('ignores keep-alive pings', () => {
    expect(parseSSEEvent(':keep-alive')).toBeNull();
  });

  it('passes through unknown event types without throwing', () => {
    expect(() => parseSSEEvent('data: {"type":"future_event","data":"x"}')).not.toThrow();
  });
});

describe('stripSentinels — legacy sentinel removal', () => {
  it('strips a single sentinel block', () => {
    const text = 'Added! ✦ACTION✦{"op":"add","items":[]}✦END✦ Enjoy!';
    expect(stripSentinels(text)).toBe('Added! Enjoy!');
  });

  it('removes only the action from text', () => {
    const text = 'Before ✦ACTION✦{"op":"clear"}✦END✦ After';
    const stripped = stripSentinels(text);
    expect(stripped).not.toContain('✦ACTION✦');
    expect(stripped).not.toContain('✦END✦');
    expect(stripped).toContain('Before');
    expect(stripped).toContain('After');
  });

  it('returns unchanged text if no sentinels present', () => {
    const text = 'Here is your order summary.';
    expect(stripSentinels(text)).toBe(text);
  });

  it('removes multiple sentinel blocks', () => {
    const text = 'A ✦ACTION✦{1}✦END✦ B ✦ACTION✦{2}✦END✦ C';
    const stripped = stripSentinels(text);
    expect(stripped).not.toContain('✦ACTION✦');
    expect(stripped).toContain('A');
    expect(stripped).toContain('C');
  });
});

describe('ITEM_IMAGES coverage', () => {
  it('has an image entry for every item id in the menu', () => {
    const allIds = menuData.categories.flatMap(cat => cat.items.map(i => i.id));
    const missing = allIds.filter(id => !(id in ITEM_IMAGES));
    expect(missing).toEqual([]);
  });
});
