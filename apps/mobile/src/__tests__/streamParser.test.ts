import { parseSSEEvent, stripSentinels } from '../utils/streamParser';

describe('parseSSEEvent — basic parsing', () => {
  it('returns null for non-data lines', () => {
    expect(parseSSEEvent(':keep-alive')).toBeNull();
    expect(parseSSEEvent('')).toBeNull();
    expect(parseSSEEvent('comment')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSSEEvent('data: {not valid json')).toBeNull();
  });

  it('returns null for events without a type field', () => {
    expect(parseSSEEvent('data: {"text":"hello"}')).toBeNull();
  });
});

describe('parseSSEEvent — "delta" event type', () => {
  it('parses a delta event correctly', () => {
    const line   = 'data: {"type":"delta","text":"Hello there!"}';
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('delta');
    expect(result!.text).toBe('Hello there!');
  });

  it('handles empty text in delta', () => {
    const line   = 'data: {"type":"delta","text":""}';
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('');
  });
});

describe('parseSSEEvent — "actions" event type', () => {
  it('parses an actions event with applied tool calls', () => {
    const actions = [
      { name: 'add_item', input: { item_id: 'truffle-fries', quantity: 2 }, status: 'applied' },
    ];
    const line   = `data: ${JSON.stringify({ type: 'actions', actions })}`;
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('actions');
    expect(result!.actions).toHaveLength(1);
    expect(result!.actions![0].name).toBe('add_item');
    expect(result!.actions![0].status).toBe('applied');
  });

  it('parses a rejected tool call', () => {
    const actions = [
      { name: 'add_item', input: {}, status: 'rejected', rejectionReason: 'Missing item_id' },
    ];
    const line   = `data: ${JSON.stringify({ type: 'actions', actions })}`;
    const result = parseSSEEvent(line);
    expect(result!.actions![0].status).toBe('rejected');
    expect(result!.actions![0].rejectionReason).toBe('Missing item_id');
  });
});

describe('parseSSEEvent — "done" event type', () => {
  it('parses a done event', () => {
    const line   = 'data: {"type":"done"}';
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('done');
  });
});

describe('parseSSEEvent — "recommendations" event type', () => {
  it('parses a recommendations event', () => {
    const items = [
      { item_id: 'truffle-fries', name: 'Truffle Fries', price: 8.5, image: '🍟', reason: 'Pairs well', score: 0.82, source: 'pairing' },
    ];
    const line   = `data: ${JSON.stringify({ type: 'recommendations', items })}`;
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('recommendations');
    expect(result!.recommendations).toHaveLength(1);
    expect(result!.recommendations![0].item_id).toBe('truffle-fries');
  });
});

describe('parseSSEEvent — unknown event types', () => {
  it('does not throw on unknown event type — passes it through', () => {
    const line   = 'data: {"type":"future_type","data":"value"}';
    expect(() => parseSSEEvent(line)).not.toThrow();
    const result = parseSSEEvent(line);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('future_type' as any);
  });
});

describe('stripSentinels — legacy sentinel removal', () => {
  it('strips sentinel blocks from text', () => {
    const text = 'Added to cart! ✦ACTION✦{"op":"add","items":[]}✦END✦ Enjoy!';
    expect(stripSentinels(text)).toBe('Added to cart! Enjoy!');
  });

  it('returns unchanged text if no sentinels present', () => {
    const text = 'Here is your order summary.';
    expect(stripSentinels(text)).toBe(text);
  });

  it('removes multiple sentinel blocks', () => {
    const text = 'A ✦ACTION✦{1}✦END✦ B ✦ACTION✦{2}✦END✦ C';
    const stripped = stripSentinels(text);
    expect(stripped).not.toContain('✦ACTION✦');
    expect(stripped).not.toContain('✦END✦');
    expect(stripped).toContain('A');
    expect(stripped).toContain('C');
  });
});
