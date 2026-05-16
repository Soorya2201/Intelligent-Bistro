import { Router } from 'express';
import { z } from 'zod';
import { anthropicClient, buildSystemPrompt } from '../services/anthropic';
import { BISTRO_TOOLS, validateToolInput, ValidatedToolCall } from '../ai/tools';
import { getMenuAsCategories } from '../db/menuRepository';
import { recordInteraction } from '../db/interactionRepository';
import { getRecommendations, shouldSkipRecommendations } from '../services/recommendations';
import { recordChatRequest, recordToolCall } from '../services/metrics';

const router = Router();

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).min(1),
  cart: z.array(z.object({
    item_id:  z.string().optional(),
    id:       z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    qty:      z.number().int().min(1).optional(),
    name:     z.string(),
    price:    z.number(),
    notes:    z.string().optional(),
    menuItem: z.any().optional(),
  })).default([]),
  profile: z.object({
    dietary: z.array(z.string()).optional(),
    restrictions: z.array(z.string()).optional(),
    liked: z.array(z.string()).optional(),
    likedItems: z.array(z.any()).optional(),
  }).optional(),
  sessionId: z.string().optional(),
});

const MAX_HISTORY_TURNS = parseInt(process.env.MAX_HISTORY_TURNS || '8', 10);
const RECOMMENDATION_COUNT = parseInt(process.env.RECOMMENDATION_COUNT || '3', 10);

async function summariseHistory(messages: Array<{ role: string; content: string }>) {
  try {
    const res = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        {
          role: 'user',
          content: 'Summarise this ordering conversation in 2 sentences. Focus on what was ordered and any dietary preferences mentioned.',
        },
      ],
    });
    const block = res.content[0];
    return block.type === 'text' ? block.text : '';
  } catch {
    return '';
  }
}

router.post('/', async (req, res) => {
  const parseResult = ChatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parseResult.error.issues.map(i => i.message).join('; ') } });
    return;
  }

  const { messages, cart, profile, sessionId } = parseResult.data;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const keepAlive = setInterval(() => res.write(':keep-alive\n\n'), 15000);
  req.on('close', () => clearInterval(keepAlive));

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const menu = getMenuAsCategories();
    const systemPrompt = buildSystemPrompt(cart, profile, menu);

    // Conversation summarisation for long sessions
    let trimmedMessages = messages;
    if (messages.length > MAX_HISTORY_TURNS) {
      const summary = await summariseHistory(messages.slice(0, -4));
      trimmedMessages = [
        { role: 'user', content: `[Context from earlier: ${summary}]` },
        { role: 'assistant', content: 'Got it, I remember our conversation.' },
        ...messages.slice(-4),
      ];
    }

    const startTime = Date.now();

    // ─── PHASE 1: Tool resolution (non-streaming) ─────────────────────────
    const toolResponse = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools: BISTRO_TOOLS as any,
      tool_choice: { type: 'auto' },
      messages: trimmedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });

    const toolCalls: ValidatedToolCall[] = [];
    let cartMutated = false;

    for (const block of toolResponse.content) {
      if (block.type !== 'tool_use') continue;

      const validation = validateToolInput(block.name, block.input);
      if (!validation.success) {
        const rejected: ValidatedToolCall = {
          name: block.name as any,
          input: block.input as Record<string, unknown>,
          status: 'rejected',
          rejectionReason: validation.error,
        };
        toolCalls.push(rejected);
        recordToolCall(block.name, false);
        continue;
      }

      const applied: ValidatedToolCall = {
        name: block.name as any,
        input: block.input as Record<string, unknown>,
        status: 'applied',
      };
      toolCalls.push(applied);
      recordToolCall(block.name, true);

      // Record interactions for recommendation engine
      if (sessionId) {
        if (block.name === 'add_item') {
          recordInteraction(sessionId, (block.input as any).item_id, 'added');
          cartMutated = true;
        } else if (block.name === 'remove_item') {
          recordInteraction(sessionId, (block.input as any).item_id, 'removed');
          cartMutated = true;
        } else if (block.name === 'clear_cart') {
          cartMutated = true;
        } else if (block.name === 'update_quantity') {
          cartMutated = true;
        }
      }
    }

    if (toolCalls.length > 0) {
      sendEvent({ type: 'actions', actions: toolCalls });
    }

    // ─── PHASE 2: Text streaming ───────────────────────────────────────────
    // Build conversation context including tool results for Phase 2
    const phase2Messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...trimmedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    if (toolCalls.length > 0) {
      const appliedSummary = toolCalls
        .filter(t => t.status === 'applied')
        .map(t => `${t.name}: ${JSON.stringify(t.input)}`)
        .join(', ');
      phase2Messages.push({
        role: 'user',
        content: `[System: Tools were applied — ${appliedSummary}. Now respond conversationally confirming what was done. Do NOT call any tools.]`,
      });
    }

    const textStream = await anthropicClient.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      tool_choice: { type: 'none' } as any,
      messages: phase2Messages,
    });

    let fullText = '';
    for await (const chunk of textStream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        sendEvent({ type: 'delta', text });
      }
    }

    const latencyMs = Date.now() - startTime;
    recordChatRequest(latencyMs);

    // ─── POST: Proactive recommendations ──────────────────────────────────
    if (cartMutated && sessionId) {
      const cartItemIds = cart.map((c: any) => c.item_id || c.id || c.menuItem?.id).filter(Boolean);
      const skip = shouldSkipRecommendations(sessionId, cartItemIds);

      if (!skip) {
        const dietary = profile?.dietary || profile?.restrictions || [];
        const recs = await getRecommendations(sessionId, cartItemIds, dietary, RECOMMENDATION_COUNT);
        if (recs.length > 0) {
          sendEvent({ type: 'recommendations', items: recs });
        }
      }
    }

    sendEvent({ type: 'done' });
    clearInterval(keepAlive);
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    clearInterval(keepAlive);
    sendEvent({ type: 'error', message: error?.message || 'Failed to process request' });
    res.end();
  }
});

export default router;
