import { useRef } from 'react';
import { CartAction } from '../types';
import { useStore } from '../store';
import { ITEM_IMAGES } from '../constants/itemImages';
import { createStreamParser } from '../utils/streamParser';
import * as Haptics from 'expo-haptics';

export function useStreamParser() {
  const parserRef = useRef(createStreamParser());

  const addItem                        = useStore(s => s.addItem);
  const removeItem                     = useStore(s => s.removeItem);
  const updateQuantity                 = useStore(s => s.updateQuantity);
  const clearCart                      = useStore(s => s.clearCart);
  const setQuickReplies                = useStore(s => s.setQuickReplies);
  const setSuggestedItemsOnLastMessage = useStore(s => s.setSuggestedItemsOnLastMessage);

  const dispatchAction = (action: CartAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action.op) {
      case 'add':
        if (action.items) {
          action.items.forEach(i => {
            addItem({
              id: i.id, name: i.name, price: i.price,
              description: '', dietary: [], pairings: [],
              image: ITEM_IMAGES[i.id] || '🍽️',
            }, i.qty);
          });
        }
        break;
      case 'remove':
        if (action.items) action.items.forEach(i => removeItem(i.id));
        break;
      case 'update':
        if (action.items) action.items.forEach(i => updateQuantity(i.id, i.qty));
        break;
      case 'clear':
        clearCart();
        break;
      case 'clarify':
        if (action.options) setQuickReplies(action.options);
        break;
      case 'upsell':
        if (action.upsellItem && action.upsellMessage) {
          const label = action.upsellMessage;
          setQuickReplies([label.length < 48 ? label : `Add ${action.upsellItem.replace(/-/g, ' ')}`]);
        }
        break;
      case 'suggest':
        if (action.items) {
          setSuggestedItemsOnLastMessage(
            action.items.map(i => ({
              id: i.id, name: i.name, price: i.price,
              image: ITEM_IMAGES[i.id] || '🍽️',
            }))
          );
        }
        break;
    }
  };

  const processChunk = (rawChunk: string) => {
    const { visibleText, actions } = parserRef.current.processChunk(rawChunk);
    actions.forEach(dispatchAction);
    return { visibleText, actions };
  };

  const reset = () => {
    parserRef.current.reset();
  };

  return { processChunk, reset };
}
