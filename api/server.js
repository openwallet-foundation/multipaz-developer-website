const http = require('http');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { loadIndex } = require('./docs-retrieval');
const { buildChatRequest } = require('./chat-request');
const { generateStreamWithRetry } = require('./gemini');
const { checkRateLimit, takeDailyQuota } = require('./limits');

const docsIndex = loadIndex(path.join(__dirname, 'docs-context.txt'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// CORS: restrict to your domain in production, allow localhost in dev
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3010')
  .split(',')
  .map((o) => o.trim());

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  if (req.method !== 'POST' || (req.url !== '/api/chat' && req.url !== '/api/tts' && req.url !== '/api/feedback')) {
    res.writeHead(404, { 'Content-Type': 'application/json', ...cors });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  const rateLimited = await checkRateLimit(req);
  if (rateLimited) {
    res.writeHead(rateLimited.status, { 'Content-Type': 'application/json', ...cors });
    return res.end(JSON.stringify({ error: rateLimited.error }));
  }

  // --- Feedback endpoint ---
  if (req.url === '/api/feedback') {
    try {
      const { rating, question, answer } = await parseBody(req);

      const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
      if (!webhookUrl) {
        res.writeHead(503, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'Feedback service not configured' }));
      }
      if (!rating || (rating !== 'up' && rating !== 'down')) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'rating must be "up" or "down"' }));
      }
      if (!question || typeof question !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'question is required' }));
      }
      if (!answer || typeof answer !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'answer is required' }));
      }

      const payload = {
        timestamp: new Date().toISOString(),
        rating,
        question: question.slice(0, 2000),
        answer: answer.slice(0, 5000),
      };

      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        const errBody = await webhookRes.text().catch(() => '');
        console.error('Feedback webhook error:', webhookRes.status, errBody);
        res.writeHead(502, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'Feedback service error' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Feedback request error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  // --- TTS endpoint ---
  if (req.url === '/api/tts') {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: 'TTS service not configured' }));
    }

    try {
      const { text } = await parseBody(req);

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'text is required' }));
      }

      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
      const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';
      const trimmedText = text.slice(0, 5000);

      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: trimmedText,
            model_id: modelId,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!ttsRes.ok) {
        const errBody = await ttsRes.text().catch(() => '');
        console.error('ElevenLabs API error:', ttsRes.status, errBody);
        res.writeHead(502, { 'Content-Type': 'application/json', ...cors });
        return res.end(JSON.stringify({ error: 'TTS service error' }));
      }

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        ...cors,
      });

      const reader = ttsRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (err) {
      console.error('TTS request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      } else {
        res.end();
      }
    }
    return;
  }

  // --- Chat endpoint ---
  try {
    const { messages } = await parseBody(req);

    const request = buildChatRequest(docsIndex, messages);
    if (!request) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: 'messages must end with a non-empty user message' }));
    }

    const overQuota = await takeDailyQuota();
    if (overQuota) {
      res.writeHead(overQuota.status, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: overQuota.error }));
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...cors,
    });

    const stream = await generateStreamWithRetry(ai, request);

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Request error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...cors });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
});

const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`Ask AI API server running on http://localhost:${PORT}`);
});
