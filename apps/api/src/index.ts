import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import menuRouter from './routes/menu';
import transcribeRouter from './routes/transcribe';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.use('/chat', chatRouter);
app.use('/menu', menuRouter);
app.use('/transcribe', transcribeRouter);

app.listen(3001, () => {
  console.log('Bistro API running on port 3001');
});
