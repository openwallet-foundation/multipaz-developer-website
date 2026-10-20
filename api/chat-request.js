// Builds the Gemini request for a chat: system prompt with retrieved doc
// excerpts, plus the conversation as `contents`. Shared by api/chat.js (Vercel)
// and server.js (Docker/local).
// Lives outside api/ so Vercel doesn't deploy it as its own function.

const { search, formatExcerpts, retrievalQuery } = require('./docs-retrieval');

// History is capped by turn count and by size, so long chats don't grow the prompt.
const MAX_TURNS = 10;
const MAX_HISTORY_CHARS = 12000;
const MAX_TURN_CHARS = 4000;
// Thinking models count their reasoning toward this limit, so leave headroom.
const MAX_OUTPUT_TOKENS = 4096;

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

// Keeps the newest non-empty turns that fit the caps. Empty turns (e.g. an
// assistant reply that failed mid-stream) are dropped because Gemini rejects them.
function recentTurns(messages) {
  const turns = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, MAX_TURN_CHARS),
    }));

  const kept = [];
  let chars = 0;
  for (let i = turns.length - 1; i >= 0 && kept.length < MAX_TURNS; i--) {
    if (kept.length && chars + turns[i].content.length > MAX_HISTORY_CHARS) break;
    kept.unshift(turns[i]);
    chars += turns[i].content.length;
  }
  // Gemini expects the conversation to open with a user turn.
  while (kept.length && kept[0].role === 'assistant') kept.shift();
  return kept;
}

// Gemini wants alternating roles; dropping empty turns can leave two user
// turns in a row, so merge neighbours with the same role.
function toContents(turns) {
  const contents = [];
  for (const { role, content } of turns) {
    const geminiRole = role === 'assistant' ? 'model' : 'user';
    const prev = contents[contents.length - 1];
    if (prev && prev.role === geminiRole) prev.parts[0].text += `\n\n${content}`;
    else contents.push({ role: geminiRole, parts: [{ text: content }] });
  }
  return contents;
}

// Returns the generateContentStream params, or null if `messages` has no
// question to answer (not an array, or the last non-empty turn isn't the user's).
function buildChatRequest(docsIndex, messages) {
  if (!Array.isArray(messages)) return null;
  const turns = recentTurns(messages);
  if (!turns.length || turns[turns.length - 1].role !== 'user') return null;

  const excerpts = formatExcerpts(search(docsIndex, retrievalQuery(turns)));
  return {
    config: {
      systemInstruction: SYSTEM_PROMPT + (excerpts || '(No matching documentation found.)'),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
    contents: toContents(turns),
  };
}

module.exports = { buildChatRequest };
