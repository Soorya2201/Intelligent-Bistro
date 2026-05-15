import { useRef } from 'react';
import { CartAction } from '../types';
import { useStore } from '../store';
import * as Haptics from 'expo-haptics';

const SENTINEL_OPEN  = '✦ACTION✦';
const SENTINEL_CLOSE = '✦END✦';

const EMOJI_MAP: Record<string, string> = {
  'classic-burger':      '🍔',
  'spicy-chicken':       '🌶️',
  'mushroom-burger':     '🍄',
  'vegan-burger':        '🌱',
  'truffle-fries':       '🍟',
  'sweet-potato-fries':  '🍠',
  'side-salad':          '🥗',
  'onion-rings':         '🧅',
  'classic-soda':        '🥤',
  'lemonade':            '🍋',
  'iced-tea':            '🍵',
  'sparkling-water':     '💧',
  'large-water':         '🫗',
  'bbq-burger':          '🥩',
  'cheese-fries':        '🧀',
};

export function useStreamParser() {
  const bufferRef       = useRef('');
  const insideActionRef = useRef(false);
  const actionBufferRef = useRef('');

  const addItem       = useStore(s => s.addItem);
  const removeItem    = useStore(s => s.removeItem);
  const updateQuantity= useStore(s => s.updateQuantity);
  const clearCart     = useStore(s => s.clearCart);
  const setQuickReplies = useStore(s => s.setQuickReplies);

  const dispatchAction = (action: CartAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action.op) {
      case 'add':
        if (action.items) {
          action.items.forEach(i => {
            addItem({
              id: i.id, name: i.name, price: i.price,
              description: '', dietary: [], pairings: [],
              image: EMOJI_MAP[i.id] || '🍽️',
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
    }
  };

  const processChunk = (rawChunk: string) => {
    let visibleText = '';
    const actions: CartAction[] = [];

    for (const c of rawChunk) {
      if (!insideActionRef.current) {
        bufferRef.current += c;
        if (bufferRef.current.endsWith(SENTINEL_OPEN)) {
          insideActionRef.current = true;
          actionBufferRef.current = '';
          visibleText = visibleText.slice(0, -(SENTINEL_OPEN.length - 1));
        } else {
          visibleText += c;
        }
      } else {
        actionBufferRef.current += c;
        if (actionBufferRef.current.endsWith(SENTINEL_CLOSE)) {
          const jsonStr = actionBufferRef.current.slice(0, -SENTINEL_CLOSE.length);
          try {
            const action = JSON.parse(jsonStr) as CartAction;
            actions.push(action);
            dispatchAction(action);
          } catch (e) {
            console.error('Malformed action JSON:', jsonStr);
          }
          insideActionRef.current = false;
          actionBufferRef.current = '';
          bufferRef.current = '';
        }
      }
    }

    return { visibleText, actions };
  };

  const reset = () => {
    bufferRef.current = '';
    insideActionRef.current = false;
    actionBufferRef.current = '';
  };

  return { processChunk, reset };
}
