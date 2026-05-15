import { create } from 'zustand';
import { ChatSlice, createChatSlice } from '../chatSlice';
import { ChatMessage, SuggestedItem } from '../../types';

function makeStore() {
  return create<ChatSlice>()((...a) => createChatSlice(...a));
}

const userMsg: ChatMessage = {
  id: '1', role: 'user', content: 'Hello', timestamp: new Date(),
};
const assistantMsg: ChatMessage = {
  id: '2', role: 'assistant', content: '', timestamp: new Date(), isStreaming: true,
};

describe('chatSlice — initial state', () => {
  it('starts with empty messages', () => {
    expect(makeStore().getState().messages).toHaveLength(0);
  });

  it('starts with isStreaming = false', () => {
    expect(makeStore().getState().isStreaming).toBe(false);
  });

  it('starts with empty quickReplies', () => {
    expect(makeStore().getState().quickReplies).toHaveLength(0);
  });

  it('starts with pendingClarification = false', () => {
    expect(makeStore().getState().pendingClarification).toBe(false);
  });
});

describe('chatSlice — addMessage', () => {
  it('appends a user message', () => {
    const store = makeStore();
    store.getState().addMessage(userMsg);
    expect(store.getState().messages).toHaveLength(1);
    expect(store.getState().messages[0].role).toBe('user');
    expect(store.getState().messages[0].content).toBe('Hello');
  });

  it('appends an assistant message', () => {
    const store = makeStore();
    store.getState().addMessage(assistantMsg);
    expect(store.getState().messages[0].role).toBe('assistant');
  });

  it('preserves insertion order', () => {
    const store = makeStore();
    store.getState().addMessage(userMsg);
    store.getState().addMessage(assistantMsg);
    expect(store.getState().messages[0].role).toBe('user');
    expect(store.getState().messages[1].role).toBe('assistant');
  });
});

describe('chatSlice — appendToLastAssistantMessage', () => {
  it('concatenates text onto an empty assistant message', () => {
    const store = makeStore();
    store.getState().addMessage(assistantMsg);
    store.getState().appendToLastAssistantMessage('Hello ');
    store.getState().appendToLastAssistantMessage('world');
    expect(store.getState().messages[0].content).toBe('Hello world');
  });

  it('does not modify a user message', () => {
    const store = makeStore();
    store.getState().addMessage(userMsg);
    store.getState().appendToLastAssistantMessage('ignored');
    expect(store.getState().messages[0].content).toBe('Hello');
  });

  it('only modifies the last assistant message', () => {
    const store = makeStore();
    store.getState().addMessage({ ...assistantMsg, id: 'a1', content: 'First' });
    store.getState().addMessage({ ...assistantMsg, id: 'a2', content: 'Second' });
    store.getState().appendToLastAssistantMessage(' appended');
    expect(store.getState().messages[0].content).toBe('First');
    expect(store.getState().messages[1].content).toBe('Second appended');
  });
});

describe('chatSlice — setSuggestedItemsOnLastMessage', () => {
  const items: SuggestedItem[] = [
    { id: 'classic-burger', name: 'Classic Bistro Burger', price: 14.5, image: '🍔' },
  ];

  it('attaches suggested items to the last assistant message', () => {
    const store = makeStore();
    store.getState().addMessage(assistantMsg);
    store.getState().setSuggestedItemsOnLastMessage(items);
    expect(store.getState().messages[0].suggestedItems).toEqual(items);
  });

  it('does not attach items to a user message', () => {
    const store = makeStore();
    store.getState().addMessage(userMsg);
    store.getState().setSuggestedItemsOnLastMessage(items);
    expect(store.getState().messages[0].suggestedItems).toBeUndefined();
  });

  it('only updates the last message', () => {
    const store = makeStore();
    store.getState().addMessage({ ...assistantMsg, id: 'a1' });
    store.getState().addMessage({ ...assistantMsg, id: 'a2' });
    store.getState().setSuggestedItemsOnLastMessage(items);
    expect(store.getState().messages[0].suggestedItems).toBeUndefined();
    expect(store.getState().messages[1].suggestedItems).toEqual(items);
  });
});

describe('chatSlice — setStreaming', () => {
  it('sets isStreaming = false and updates last assistant message', () => {
    const store = makeStore();
    store.getState().addMessage(assistantMsg);
    store.getState().setStreaming(false);
    expect(store.getState().isStreaming).toBe(false);
    expect(store.getState().messages[0].isStreaming).toBe(false);
  });
});

describe('chatSlice — quickReplies', () => {
  it('setQuickReplies stores options and sets pendingClarification', () => {
    const store = makeStore();
    store.getState().setQuickReplies(['Option A', 'Option B']);
    expect(store.getState().quickReplies).toEqual(['Option A', 'Option B']);
    expect(store.getState().pendingClarification).toBe(true);
  });

  it('clearQuickReplies empties options and clears pendingClarification', () => {
    const store = makeStore();
    store.getState().setQuickReplies(['A', 'B']);
    store.getState().clearQuickReplies();
    expect(store.getState().quickReplies).toHaveLength(0);
    expect(store.getState().pendingClarification).toBe(false);
  });
});
