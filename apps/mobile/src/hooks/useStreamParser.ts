import { useStore } from '../store';
import { ITEM_IMAGES } from '../constants/itemImages';
import { ToolCallRecord, RecommendationItem } from '../types';
import * as Haptics from 'expo-haptics';
import { MENU_LOOKUP } from '../utils/menuLookup';

export function useStreamParser() {
  const addItem                        = useStore(s => s.addItem);
  const removeItem                     = useStore(s => s.removeItem);
  const updateQuantity                 = useStore(s => s.updateQuantity);
  const updateInstructions             = useStore(s => s.updateInstructions);
  const clearCart                      = useStore(s => s.clearCart);
  const setQuickReplies                = useStore(s => s.setQuickReplies);
  const setToolCallsOnLastMessage      = useStore(s => s.setToolCallsOnLastMessage);
  const setRecommendationsOnLastMessage = useStore(s => s.setRecommendationsOnLastMessage);
  const setPendingActions              = useStore(s => s.setPendingActions);
  const openCustomize                  = useStore(s => s.openCustomize);

  const dispatchToolCall = (toolCall: ToolCallRecord) => {
    if (toolCall.status !== 'applied') return;

    const input = toolCall.input;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (toolCall.name) {
      case 'add_item': {
        const itemId   = input.item_id as string;
        const quantity = input.quantity as number;
        const notes    = input.notes as string | undefined;
        if (itemId === 'combo-discount') {
          addItem({ id: 'combo-discount', name: 'Combo Discount', price: -2.00, description: 'Combo saving', pairings: [], image: '🎉' }, quantity);
          break;
        }
        const known    = MENU_LOOKUP[itemId];
        addItem(known ?? {
          id: itemId, name: itemId.replace(/-/g, ' '),
          price: 0, description: '', pairings: [],
          image: ITEM_IMAGES[itemId] ?? '🍽️',
        }, quantity, notes);
        break;
      }
      case 'update_notes': {
        updateInstructions(input.item_id as string, input.notes as string);
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
      case 'ask_customization': {
        const menuItemId   = input.item_id as string;
        const lineIdFromAI = input.line_id as string | undefined;

        // Read current cart state imperatively (hooks can't be called in event handlers)
        let state = useStore.getState();
        let linesForItem = state.items.filter(i => i.menuItem.id === menuItemId);

        // If item isn't in cart yet, add it so the sheet has something to show
        if (linesForItem.length === 0) {
          const menuItem = MENU_LOOKUP[menuItemId] ?? {
            id: menuItemId,
            name: menuItemId.replace(/-/g, ' '),
            price: 0, description: '', pairings: [],
            image: ITEM_IMAGES[menuItemId] ?? '🍽️',
          };
          state.addLine(menuItem);
          // Re-read after mutation (Zustand set() is synchronous)
          state = useStore.getState();
          linesForItem = state.items.filter(i => i.menuItem.id === menuItemId);
        }

        if (linesForItem.length === 0) break;

        // Prefer the AI-provided lineId if it's actually in the cart; otherwise use first match
        const validLine = lineIdFromAI && linesForItem.find(l => l.lineId === lineIdFromAI);
        let firstLineId = validLine ? lineIdFromAI! : linesForItem[0].lineId;

        // Split any qty>1 lines so CustomizeSheet shows one tab per unit
        for (const line of linesForItem) {
          const current = useStore.getState().items.find(i => i.lineId === line.lineId);
          if (current && current.quantity > 1) {
            const ids = useStore.getState().splitLine(line.lineId);
            if (line.lineId === linesForItem[0].lineId) firstLineId = ids[0];
          }
        }

        openCustomize(firstLineId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const processPreviewEvent = (actions: ToolCallRecord[]) => {
    setPendingActions(actions);
  };

  // Noop reset — no buffer needed for structured SSE
  const reset = () => {};

  return { processActionsEvent, processRecommendationsEvent, processPreviewEvent, reset };
}
