import { createStreamParser } from '../streamParser';
import { ITEM_IMAGES } from '../../constants/itemImages';
import menuData from '../../../../api/src/data/menu.json';

const OPEN  = '✦ACTION✦';
const CLOSE = '✦END✦';

function action(json: object) {
  return `${OPEN}${JSON.stringify(json)}${CLOSE}`;
}

describe('createStreamParser — text passthrough', () => {
  it('returns plain text unchanged', () => {
    const parser = createStreamParser();
    const { visibleText, actions } = parser.processChunk('Hello, welcome!');
    expect(visibleText).toBe('Hello, welcome!');
    expect(actions).toHaveLength(0);
  });

  it('accumulates text across multiple chunks', () => {
    const parser = createStreamParser();
    const r1 = parser.processChunk('Hello ');
    const r2 = parser.processChunk('world');
    expect(r1.visibleText + r2.visibleText).toBe('Hello world');
  });

  it('returns empty string for empty chunk', () => {
    const parser = createStreamParser();
    const { visibleText } = parser.processChunk('');
    expect(visibleText).toBe('');
  });
});

describe('createStreamParser — sentinel stripping', () => {
  it('strips a complete action from visible text', () => {
    const parser = createStreamParser();
    const chunk  = `Added! ${action({ op: 'add', items: [{ id: 'classic-burger', name: 'Classic Bistro Burger', qty: 1, price: 14.5 }] })} Enjoy!`;
    const { visibleText } = parser.processChunk(chunk);
    expect(visibleText).toBe('Added!  Enjoy!');
  });

  it('returns empty visible text for chunk that is only an action', () => {
    const parser = createStreamParser();
    const { visibleText } = parser.processChunk(action({ op: 'clear' }));
    expect(visibleText).toBe('');
  });

  it('preserves text before and after action', () => {
    const parser = createStreamParser();
    const { visibleText } = parser.processChunk(`Before${action({ op: 'clear' })}After`);
    expect(visibleText).toBe('BeforeAfter');
  });
});

describe('createStreamParser — action parsing', () => {
  it('parses an add action', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'add', items: [{ id: 'classic-burger', name: 'Classic Bistro Burger', qty: 2, price: 14.5 }] })
    );
    expect(actions).toHaveLength(1);
    expect(actions[0].op).toBe('add');
    expect(actions[0].items![0]).toEqual({ id: 'classic-burger', name: 'Classic Bistro Burger', qty: 2, price: 14.5 });
  });

  it('parses a remove action', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'remove', items: [{ id: 'classic-burger', name: 'Classic Bistro Burger', qty: 0, price: 0 }] })
    );
    expect(actions[0].op).toBe('remove');
  });

  it('parses an update action', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'update', items: [{ id: 'classic-burger', name: 'Classic Bistro Burger', qty: 3, price: 14.5 }] })
    );
    expect(actions[0].op).toBe('update');
    expect(actions[0].items![0].qty).toBe(3);
  });

  it('parses a clear action', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(action({ op: 'clear' }));
    expect(actions[0].op).toBe('clear');
  });

  it('parses a clarify action with options', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'clarify', question: 'Which burger?', options: ['Classic', 'Spicy'] })
    );
    expect(actions[0].op).toBe('clarify');
    expect(actions[0].options).toEqual(['Classic', 'Spicy']);
  });

  it('parses an upsell action', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'upsell', upsellItem: 'truffle-fries', upsellMessage: 'Try the truffle fries?' })
    );
    expect(actions[0].op).toBe('upsell');
    expect(actions[0].upsellItem).toBe('truffle-fries');
    expect(actions[0].upsellMessage).toBe('Try the truffle fries?');
  });

  it('parses a suggest action with multiple items', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(
      action({ op: 'suggest', items: [
        { id: 'classic-burger', name: 'Classic Bistro Burger', qty: 0, price: 14.5 },
        { id: 'bbq-burger',     name: 'Smokehouse BBQ Burger', qty: 0, price: 16.5 },
      ]})
    );
    expect(actions[0].op).toBe('suggest');
    expect(actions[0].items).toHaveLength(2);
    expect(actions[0].items![0].id).toBe('classic-burger');
  });

  it('parses two actions in one chunk', () => {
    const parser = createStreamParser();
    const chunk = [
      action({ op: 'add', items: [{ id: 'classic-burger', name: 'Classic', qty: 1, price: 14.5 }] }),
      action({ op: 'upsell', upsellItem: 'truffle-fries', upsellMessage: 'Try fries?' }),
    ].join(' ');
    const { actions } = parser.processChunk(chunk);
    expect(actions).toHaveLength(2);
    expect(actions[0].op).toBe('add');
    expect(actions[1].op).toBe('upsell');
  });
});

describe('createStreamParser — multi-chunk buffering', () => {
  it('assembles an action split across two chunks', () => {
    const parser   = createStreamParser();
    const full     = action({ op: 'clear' });
    const mid      = Math.floor(full.length / 2);
    const { actions: a1 } = parser.processChunk(full.slice(0, mid));
    const { actions: a2 } = parser.processChunk(full.slice(mid));
    expect(a1).toHaveLength(0);
    expect(a2).toHaveLength(1);
    expect(a2[0].op).toBe('clear');
  });

  it('assembles an action split at every byte boundary', () => {
    const parser = createStreamParser();
    const full   = action({ op: 'clear' });
    let allActions: any[] = [];
    for (const c of full) {
      const { actions } = parser.processChunk(c);
      allActions = allActions.concat(actions);
    }
    expect(allActions).toHaveLength(1);
    expect(allActions[0].op).toBe('clear');
  });

  it('produces no visible text while inside action buffer', () => {
    const parser = createStreamParser();
    const full   = action({ op: 'clear' });
    const mid    = Math.floor(full.length / 2);
    const { visibleText: v1 } = parser.processChunk(full.slice(0, mid));
    const { visibleText: v2 } = parser.processChunk(full.slice(mid));
    expect(v1 + v2).toBe('');
  });
});

describe('createStreamParser — error resilience', () => {
  it('does not throw on malformed JSON inside sentinel', () => {
    const parser = createStreamParser();
    expect(() => parser.processChunk(`${OPEN}not-valid-json${CLOSE}`)).not.toThrow();
  });

  it('returns no actions for malformed JSON', () => {
    const parser = createStreamParser();
    const { actions } = parser.processChunk(`${OPEN}{broken${CLOSE}`);
    expect(actions).toHaveLength(0);
  });

  it('continues parsing text after malformed action', () => {
    const parser = createStreamParser();
    const { visibleText } = parser.processChunk(`${OPEN}{bad}${CLOSE}after`);
    expect(visibleText).toBe('after');
  });
});

describe('createStreamParser — reset', () => {
  it('clears mid-stream action state on reset', () => {
    const parser = createStreamParser();
    const full   = action({ op: 'clear' });
    // Start an action but don't finish it
    parser.processChunk(full.slice(0, Math.floor(full.length / 2)));
    parser.reset();
    // After reset plain text must work again
    const { visibleText, actions } = parser.processChunk('Fresh start');
    expect(visibleText).toBe('Fresh start');
    expect(actions).toHaveLength(0);
  });

  it('allows a complete action after reset', () => {
    const parser = createStreamParser();
    parser.processChunk('partial ✦ACTION✦{"op":"ad');
    parser.reset();
    const { actions } = parser.processChunk(action({ op: 'clear' }));
    expect(actions).toHaveLength(1);
    expect(actions[0].op).toBe('clear');
  });
});

describe('ITEM_IMAGES coverage', () => {
  it('has an image entry for every item id in the menu', () => {
    const allIds = menuData.categories.flatMap(cat => cat.items.map(i => i.id));
    const missing = allIds.filter(id => !(id in ITEM_IMAGES));
    expect(missing).toEqual([]);
  });
});
