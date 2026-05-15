import { create } from 'zustand';
import { CartSlice, createCartSlice } from './cartSlice';
import { ChatSlice, createChatSlice } from './chatSlice';
import { ProfileSlice, createProfileSlice } from './profileSlice';
import { OrderHistorySlice, createOrderHistorySlice } from './orderHistorySlice';

export const useStore = create<CartSlice & ChatSlice & ProfileSlice & OrderHistorySlice>()(
  (...args) => ({
    ...createCartSlice(...args),
    ...createChatSlice(...args),
    ...createProfileSlice(...args),
    ...createOrderHistorySlice(...args),
  })
);
