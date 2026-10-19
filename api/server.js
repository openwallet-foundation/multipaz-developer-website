const http = require('http');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { loadIndex, search, formatExcerpts, retrievalQuery } = require('./docs-retrieval');

const docsIndex = loadIndex(path.join(__dirname, 'docs-context.txt'));

const SYSTEM_PROMPT = `You are an AI assistant for the Multipaz documentation website. Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification.

Your role is to help developers understand and use the Multipaz SDK by answering questions based on the official documentation.

Rules:
- Only answer questions based on the documentation excerpts provided below.
- If the answer is not in the excerpts, say so honestly and suggest where the user might find help (e.g., GitHub issues, Discord).
- When referencing docs pages, provide the relative URL path (e.g., /docs/getting-started).
- Keep answers concise and include code examples from the docs when relevant.
- Be friendly and helpful.

Here are the documentation excerpts most relevant to the user's question:

`;

function buildSystemPrompt(messages) {
  const excerpts = formatExcerpts(search(docsIndex, retrievalQuery(messages)));
  return SYSTEM_PROMPT + (excerpts || '(No matching documentation found.)');
}

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

// Per-IP rate limit: max requests per minute
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_PER_MIN) || 10;

// Global daily cap: stop serving after this many requests per day
const DAILY_MAX = Number(process.env.DAILY_REQUEST_LIMIT) || 300;
let dailyCount = 0;
let dailyResetTime = Date.now() + 86_400_000;

function checkDailyLimit() {
  const now = Date.now();
  if (now > dailyResetTime) {
    dailyCount = 0;
    dailyResetTime = now + 86_400_000;
  }
  if (dailyCount >= DAILY_MAX) return false;
  dailyCount++;
  return true;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
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

// Convert from {role, content} format to Gemini's {role, parts} format
function toGeminiHistory(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
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

  // Check per-IP rate limit first (don't consume daily quota for rejected requests)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!checkRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json', ...cors });
    return res.end(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }));
  }

  // Check daily cap
  if (!checkDailyLimit()) {
    res.writeHead(429, { 'Content-Type': 'application/json', ...cors });
    return res.end(JSON.stringify({ error: 'Daily limit reached. Please try again tomorrow.' }));
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

    if (!Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: 'messages array is required' }));
    }

    // Limit conversation history to last 10 messages to control token usage
    const recentMessages = messages.slice(-10);

    // Separate the last user message from history
    const history = toGeminiHistory(recentMessages.slice(0, -1));
    // Gemini expects the conversation to open with a user turn.
    while (history.length && history[0].role === 'model') history.shift();
    const lastMessage = recentMessages[recentMessages.length - 1].content;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...cors,
    });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: buildSystemPrompt(recentMessages),
        maxOutputTokens: 1024,
      },
      contents: [...history, { role: 'user', parts: [{ text: lastMessage }] }],
    });

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
