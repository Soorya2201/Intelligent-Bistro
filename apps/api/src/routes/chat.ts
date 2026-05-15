import { Router } from 'express';
import { anthropicClient, buildSystemPrompt } from '../services/anthropic';
import menu from '../data/menu.json';

const router = Router();

router.post('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { messages, cart, profile } = req.body;
  const systemPrompt = buildSystemPrompt(cart, profile, menu);

  try {
    const stream = await anthropicClient.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
    });

    // Keep-alive ping every 15s to prevent dropped connections
    const keepAlive = setInterval(() => {
      res.write(':keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    clearInterval(keepAlive);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process request' })}\n\n`);
    res.end();
  }
});

export default router;
