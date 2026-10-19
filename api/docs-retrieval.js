// Keyword (BM25) retrieval over docs-context.txt, so each chat request sends
// only the most relevant doc sections to the LLM instead of the whole corpus.
// Lives outside api/ so Vercel doesn't deploy it as its own function.

const fs = require('fs');

const MAX_CHUNK_CHARS = 4000;
const MIN_CHUNK_CHARS = 400;
const DEFAULT_BUDGET_CHARS = 24000; // ~6k tokens
const DEFAULT_MAX_CHUNKS = 8;

const STOPWORDS = new Set(
  ('a an and are as at be by can do does for from how i if in into is it its me my ' +
    'of on or so that the their them then there these this to use using was what when ' +
    'where which who why will with you your we our should would could get set').split(' ')
);

// Overview sections sent with every question, so generic questions
// ("what is Multipaz?") still get grounding.
const PINNED_SOURCES = ['docs/getting-started/getting-started.md', 'multipaz-repo/README.md'];

// Crude suffix stripping so "issue", "issuer", "issuance" and "issuing" match.
const SUFFIXES = /(ications?|ations?|ances?|ings?|iers?|ied|ers?|ed|es|s|e|y)$/;

function stem(token) {
  const stemmed = token.replace(SUFFIXES, '');
  return stemmed.length >= 4 ? stemmed : token;
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) || [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

// docs-context.txt is a series of "--- <path> ---" headers followed by file content.
function splitFiles(context) {
  const files = [];
  const re = /^--- (\S.*?) ---$/gm;
  let match;
  let last = null;
  while ((match = re.exec(context)) !== null) {
    if (last) last.text = context.slice(last.start, match.index);
    last = { source: match[1], start: re.lastIndex };
    files.push(last);
  }
  if (last) last.text = context.slice(last.start);
  return files.map(({ source, text }) => ({ source, text: text.trim() }));
}

// Split one file into sections at markdown headings (ignoring "#" inside code fences),
// merging tiny sections and breaking oversized ones on paragraph boundaries.
function splitSections(text) {
  const sections = [];
  let current = { heading: '', lines: [] };
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && line.match(/^#{1,3}\s+(.*)/);
    if (heading && current.lines.join('\n').trim().length >= MIN_CHUNK_CHARS) {
      sections.push(current);
      current = { heading: heading[1].trim(), lines: [] };
    } else if (heading && !current.heading) {
      current.heading = heading[1].trim();
    }
    current.lines.push(line);
  }
  sections.push(current);

  const chunks = [];
  for (const { heading, lines } of sections) {
    let buf = '';
    for (const para of lines.join('\n').split(/\n\s*\n/)) {
      if (buf && buf.length + para.length > MAX_CHUNK_CHARS) {
        chunks.push({ heading, text: buf.trim() });
        buf = '';
      }
      buf += para + '\n\n';
    }
    if (buf.trim()) chunks.push({ heading, text: buf.trim() });
  }
  return chunks;
}

function buildIndex(context) {
  const chunks = [];
  for (const { source, text } of splitFiles(context)) {
    for (const section of splitSections(text)) {
      // Path and heading words count twice: they're strong topical signals.
      const meta = tokenize(`${source.replace(/[/.\-]/g, ' ')} ${section.heading}`);
      const terms = tokenize(section.text).concat(meta, meta);
      const tf = new Map();
      for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
      chunks.push({ source, heading: section.heading, text: section.text, tf, length: terms.length });
    }
  }
  const df = new Map();
  for (const chunk of chunks) for (const t of chunk.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avgLength = chunks.reduce((sum, c) => sum + c.length, 0) / (chunks.length || 1);
  return { chunks, df, avgLength };
}

function search(index, query, { budgetChars = DEFAULT_BUDGET_CHARS, maxChunks = DEFAULT_MAX_CHUNKS } = {}) {
  const { chunks, df, avgLength } = index;
  const terms = [...new Set(tokenize(query))];
  const k1 = 1.2;
  const b = 0.75;
  const scored = [];
  for (const chunk of chunks) {
    let score = 0;
    for (const t of terms) {
      const f = chunk.tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (chunks.length - df.get(t) + 0.5) / (df.get(t) + 0.5));
      score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * chunk.length) / avgLength));
    }
    if (score > 0) scored.push({ chunk, score });
  }
  scored.sort((x, y) => y.score - x.score);

  const pinned = PINNED_SOURCES.map((source) => chunks.find((c) => c.source === source)).filter(Boolean);
  const results = [...pinned];
  let used = pinned.reduce((sum, c) => sum + c.text.length, 0);
  for (const { chunk } of scored) {
    if (pinned.includes(chunk)) continue;
    if (results.length >= maxChunks + pinned.length) break;
    if (used + chunk.text.length > budgetChars) continue;
    results.push(chunk);
    used += chunk.text.length;
  }
  return results;
}

function formatExcerpts(results) {
  return results
    .map((c) => `--- ${c.source}${c.heading ? ` (${c.heading})` : ''} ---\n${c.text}`)
    .join('\n\n');
}

function loadIndex(contextPath) {
  try {
    return buildIndex(fs.readFileSync(contextPath, 'utf-8'));
  } catch {
    console.error(`Warning: ${contextPath} not found. Run "node build-docs-context.js" first.`);
    return buildIndex('');
  }
}

// The query is the latest user message plus the previous one, so short
// follow-ups ("how do I configure it?") still retrieve the right topic.
function retrievalQuery(messages) {
  return messages
    .filter((m) => m.role === 'user')
    .slice(-2)
    .map((m) => m.content)
    .join('\n');
}

module.exports = { buildIndex, search, formatExcerpts, loadIndex, retrievalQuery };
