import { StateCreator } from 'zustand';
import { ChatMessage, SuggestedItem } from '../types';

export interface ChatSlice {
  messages: ChatMessage[];
  isStreaming: boolean;
  quickReplies: string[];
  pendingClarification: boolean;
  isAiSpeaking: boolean;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistantMessage: (text: string) => void;
  setSuggestedItemsOnLastMessage: (items: SuggestedItem[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  setQuickReplies: (options: string[]) => void;
  clearQuickReplies: () => void;
  setAiSpeaking: (isSpeaking: boolean) => void;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (set) => ({
  messages: [],
  isStreaming: false,
  quickReplies: [],
  pendingClarification: false,
  isAiSpeaking: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setSuggestedItemsOnLastMessage: (items) => set((state) => {
    const messages = [...state.messages];
    if (messages.length === 0) return state;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      messages[messages.length - 1] = { ...last, suggestedItems: items };
    }
    return { messages };
  }),
  appendToLastAssistantMessage: (text) => set((state) => {
    const messages = [...state.messages];
    if (messages.length === 0) return state;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      messages[messages.length - 1] = { ...last, content: last.content + text };
    }
    return { messages };
  }),
  setStreaming: (isStreaming) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, isStreaming };
      }
    }
    return { isStreaming, messages };
  }),
  setQuickReplies: (options) => set({ quickReplies: options, pendingClarification: true }),
  clearQuickReplies: () => set({ quickReplies: [], pendingClarification: false }),
  setAiSpeaking: (isSpeaking) => set({ isAiSpeaking: isSpeaking }),
});
