import { CartAction } from '../types';

const SENTINEL_OPEN  = '✦ACTION✦';
const SENTINEL_CLOSE = '✦END✦';

export interface ParseResult {
  visibleText: string;
  actions: CartAction[];
}

export function createStreamParser() {
  let buffer       = '';
  let insideAction = false;
  let actionBuffer = '';

  function processChunk(rawChunk: string): ParseResult {
    let visibleText = '';
    const actions: CartAction[] = [];

    for (const c of rawChunk) {
      if (!insideAction) {
        buffer += c;
        if (buffer.endsWith(SENTINEL_OPEN)) {
          insideAction  = true;
          actionBuffer  = '';
          // Strip the partial sentinel chars already appended to visibleText
          visibleText = visibleText.slice(0, -(SENTINEL_OPEN.length - 1));
        } else {
          visibleText += c;
        }
      } else {
        actionBuffer += c;
        if (actionBuffer.endsWith(SENTINEL_CLOSE)) {
          const jsonStr = actionBuffer.slice(0, -SENTINEL_CLOSE.length);
          try {
            const action = JSON.parse(jsonStr) as CartAction;
            actions.push(action);
          } catch {
            // malformed JSON — swallow silently
          }
          insideAction  = false;
          actionBuffer  = '';
          buffer        = '';
        }
      }
    }

    return { visibleText, actions };
  }

  function reset() {
    buffer       = '';
    insideAction = false;
    actionBuffer = '';
  }

  return { processChunk, reset };
}
