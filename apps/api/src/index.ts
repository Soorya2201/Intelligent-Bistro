import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db } from './db/database';
import { seedMenu } from './db/seed';
import chatRouter from './routes/chat';
import menuRouter from './routes/menu';
import transcribeRouter from './routes/transcribe';
import ordersRouter from './routes/orders';
import recommendationsRouter from './routes/recommendations';
import { metrics, p95 } from './services/metrics';

// Seed menu data on startup (idempotent)
seedMenu();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Slow down a little.' } },
}));

app.use('/api/chat', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: { code: 'CHAT_RATE_LIMITED', message: 'Too many requests.' } },
}));

app.use('/api/transcribe', rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: { code: 'TRANSCRIBE_RATE_LIMITED', message: 'Too many transcription requests.' } },
}));

// Routes (legacy paths without /api prefix for backwards compat with mobile)
app.use('/chat', chatRouter);
app.use('/menu', menuRouter);
app.use('/transcribe', transcribeRouter);

// Routes with /api prefix
app.use('/api/chat', chatRouter);
app.use('/api/menu', menuRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/recommendations', recommendationsRouter);

// Enhanced health endpoint
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const dbHealthy = (() => {
    try { db.prepare('SELECT 1').get(); return true; }
    catch { return false; }
  })();

  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    version: '2.0.0',
    uptime: Math.floor(uptime),
    database: dbHealthy ? 'connected' : 'error',
    ai_provider: 'anthropic/claude-sonnet-4-6',
    voice_provider: 'groq/whisper-large-v3-turbo',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    chatRequests:        metrics.chatRequests,
    toolCallsApplied:    metrics.toolCallsApplied,
    toolCallsRejected:   metrics.toolCallsRejected,
    voiceTranscriptions: metrics.voiceTranscriptions,
    ordersPlaced:        metrics.ordersPlaced,
    claudeP95Ms:         p95(metrics.claudeLatencyMs),
    toolCallDistribution: metrics.toolCallDistribution,
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`Bistro API v2.0.0 running on port ${PORT}`);
  console.log(`Database: connected`);
});
