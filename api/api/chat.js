const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { loadIndex, search, formatExcerpts, retrievalQuery } = require('../docs-retrieval');
const { generateStreamWithRetry } = require('../gemini');
const { checkLimits } = require('../limits');

const docsIndex = loadIndex(path.join(process.cwd(), 'docs-context.txt'));

const SYSTEM_PROMPT = `You are an AI assistant for the Multipaz documentation website. Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification.

Your role is to help developers understand and use the Multipaz SDK by answering questions based on the official documentation.

Rules:
- Only answer questions based on the documentation excerpts provided below.
- If the answer is not in the excerpts, say so honestly and suggest where the user might find help (e.g., GitHub issues, Discord).
- When referencing docs pages, ALWAYS use relative paths starting with / (e.g., /docs/getting-started). NEVER use absolute URLs with a domain name like https://dzuluaga.github.io or https://developer.multipaz.org.
- Keep answers concise and include code examples from the docs when relevant.
- Be friendly and helpful.

Here are the documentation excerpts most relevant to the user's question:

`;

function buildSystemPrompt(messages) {
  const excerpts = formatExcerpts(search(docsIndex, retrievalQuery(messages)));
  return SYSTEM_PROMPT + (excerpts || '(No matching documentation found.)');
}

function toGeminiHistory(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
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

  // Per-IP and global daily limits
  const limited = await checkLimits(req);
  if (limited) {
    res.status(limited.status).json({ error: limited.error });
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
    // Gemini expects the conversation to open with a user turn.
    while (history.length && history[0].role === 'model') history.shift();
    const lastMessage = recentMessages[recentMessages.length - 1].content;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateStreamWithRetry(ai, {
      config: {
        systemInstruction: buildSystemPrompt(recentMessages),
        maxOutputTokens: 4096,
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
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
};
