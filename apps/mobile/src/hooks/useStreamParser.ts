import { useStore } from '../store';
import { ITEM_IMAGES } from '../constants/itemImages';
import { ToolCallRecord, RecommendationItem } from '../types';
import * as Haptics from 'expo-haptics';

export function useStreamParser() {
  const addItem                        = useStore(s => s.addItem);
  const removeItem                     = useStore(s => s.removeItem);
  const updateQuantity                 = useStore(s => s.updateQuantity);
  const clearCart                      = useStore(s => s.clearCart);
  const setQuickReplies                = useStore(s => s.setQuickReplies);
  const setToolCallsOnLastMessage      = useStore(s => s.setToolCallsOnLastMessage);
  const setRecommendationsOnLastMessage = useStore(s => s.setRecommendationsOnLastMessage);

  const dispatchToolCall = (toolCall: ToolCallRecord) => {
    if (toolCall.status !== 'applied') return;

    const input = toolCall.input;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (toolCall.name) {
      case 'add_item': {
        const itemId   = input.item_id as string;
        const quantity = input.quantity as number;
        addItem({
          id: itemId, name: itemId.replace(/-/g, ' '),
          price: 0, description: '', pairings: [],
          image: ITEM_IMAGES[itemId] || '🍽️',
        }, quantity);
        break;
      }
      case 'remove_item': {
        removeItem(input.item_id as string);
        break;
      }
      case 'update_quantity': {
        const qty = input.new_quantity as number;
        if (qty === 0) removeItem(input.item_id as string);
        else updateQuantity(input.item_id as string, qty);
        break;
      }
      case 'clear_cart': {
        if (input.confirm) clearCart();
        break;
      }
      case 'clarify': {
        if (input.options && Array.isArray(input.options)) {
          setQuickReplies(input.options as string[]);
        }
        break;
      }
      case 'suggest_pairing': {
        if (input.item_ids && Array.isArray(input.item_ids)) {
          const ids = input.item_ids as string[];
          const label = ids.length === 1
            ? `Add ${ids[0].replace(/-/g, ' ')}`
            : `Add ${ids[0].replace(/-/g, ' ')} + more`;
          setQuickReplies([label]);
        }
        break;
      }
      case 'upsell': {
        const pitch = input.pitch as string;
        const label = pitch.length < 60 ? pitch : `Try ${(input.item_id as string).replace(/-/g, ' ')}`;
        setQuickReplies([label]);
        break;
      }
    }
  };

  const processActionsEvent = (actions: ToolCallRecord[]) => {
    actions.forEach(dispatchToolCall);
    setToolCallsOnLastMessage(actions);
  };

  const processRecommendationsEvent = (items: RecommendationItem[]) => {
    setRecommendationsOnLastMessage(items);
  };

  // Noop reset — no buffer needed for structured SSE
  const reset = () => {};

  return { processActionsEvent, processRecommendationsEvent, reset };
}
