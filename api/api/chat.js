const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const DOCS_CONTEXT_PATH = path.join(process.cwd(), 'docs-context.txt');
let docsContext = '';
try {
  docsContext = fs.readFileSync(DOCS_CONTEXT_PATH, 'utf-8');
} catch {
  console.error('Warning: docs-context.txt not found.');
}

const SYSTEM_PROMPT = `You are an AI assistant for the Multipaz documentation website. Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification.

Your role is to help developers understand and use the Multipaz SDK by answering questions based on the official documentation.

Rules:
- Only answer questions based on the documentation provided below.
- If the answer is not in the documentation, say so honestly and suggest where the user might find help (e.g., GitHub issues, Discord).
- When referencing docs pages, ALWAYS use relative paths starting with / (e.g., /docs/getting-started). NEVER use absolute URLs with a domain name like https://dzuluaga.github.io or https://developer.multipaz.org.
- Keep answers concise and include code examples from the docs when relevant.
- Be friendly and helpful.

Here is the full documentation:

${docsContext}`;

function toGeminiHistory(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

// Per-IP rate limiting (in-memory, resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_PER_MIN) || 10;

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

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    return;
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const recentMessages = messages.slice(-10);
    const history = toGeminiHistory(recentMessages.slice(0, -1));
    const lastMessage = recentMessages[recentMessages.length - 1].content;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 4096,
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
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
};
