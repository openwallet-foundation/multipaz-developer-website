const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const DOCS_CONTEXT_PATH = path.join(__dirname, 'docs-context.txt');
let docsContext = '';
try {
  docsContext = fs.readFileSync(DOCS_CONTEXT_PATH, 'utf-8');
} catch {
  console.error('Warning: docs-context.txt not found. Run "node build-docs-context.js" first.');
}

const SYSTEM_PROMPT = `You are an AI assistant for the Multipaz documentation website. Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification.

Your role is to help developers understand and use the Multipaz SDK by answering questions based on the official documentation.

Rules:
- Only answer questions based on the documentation provided below.
- If the answer is not in the documentation, say so honestly and suggest where the user might find help (e.g., GitHub issues, Discord).
- When referencing docs pages, provide the relative URL path (e.g., /docs/getting-started).
- Keep answers concise and include code examples from the docs when relevant.
- Be friendly and helpful.

Here is the full documentation:

${docsContext}`;

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

  if (req.method !== 'POST' || req.url !== '/api/chat') {
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
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
      },
      history,
      contents: [{ role: 'user', parts: [{ text: lastMessage }] }],
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
