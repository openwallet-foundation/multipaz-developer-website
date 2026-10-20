const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { loadIndex } = require('../docs-retrieval');
const { buildChatRequest } = require('../chat-request');
const { generateStreamWithRetry } = require('../gemini');
const { checkRateLimit, takeDailyQuota } = require('../limits');

const docsIndex = loadIndex(path.join(process.cwd(), 'docs-context.txt'));

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOrigin = allowed.includes(origin) ? origin : (allowed[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rateLimited = await checkRateLimit(req);
  if (rateLimited) {
    res.status(rateLimited.status).json({ error: rateLimited.error });
    return;
  }

  try {
    const request = buildChatRequest(docsIndex, (req.body || {}).messages);
    if (!request) {
      res.status(400).json({ error: 'messages must end with a non-empty user message' });
      return;
    }

    const overQuota = await takeDailyQuota();
    if (overQuota) {
      res.status(overQuota.status).json({ error: overQuota.error });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
};
