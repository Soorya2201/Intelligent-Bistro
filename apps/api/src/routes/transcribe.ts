import { Router } from 'express';

const router = Router();

router.post('/', async (req: any, res: any) => {
  const { audioBase64, mimeType = 'audio/m4a' } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'No audio data provided' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  try {
    const buffer = Buffer.from(audioBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), 'recording.m4a');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Whisper API error:', err);
      return res.status(502).json({ error: 'Transcription service error' });
    }

    const data: any = await response.json();
    res.json({ transcript: data.text ?? '' });
  } catch (e: any) {
    console.error('Transcribe route error:', e);
    res.status(500).json({ error: e.message ?? 'Internal error' });
  }
});

export default router;
