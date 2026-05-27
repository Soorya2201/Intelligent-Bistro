import { create } from 'zustand';
import { CartSlice, createCartSlice } from './cartSlice';
import { ChatSlice, createChatSlice } from './chatSlice';
import { ProfileSlice, createProfileSlice } from './profileSlice';
import { OrderHistorySlice, createOrderHistorySlice } from './orderHistorySlice';
import { CustomizeSlice, createCustomizeSlice } from './customizeSlice';

export const useStore = create<CartSlice & ChatSlice & ProfileSlice & OrderHistorySlice & CustomizeSlice>()(
  (...args) => ({
    ...createCartSlice(...args),
    ...createChatSlice(...args),
    ...createProfileSlice(...args),
    ...createOrderHistorySlice(...args),
    ...createCustomizeSlice(...args),
  })
);
