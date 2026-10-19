// Starts a Gemini stream, retrying when the model is overloaded or rate limited.
// Lives outside api/ so Vercel doesn't deploy it as its own function.

// Older models (e.g. gemini-2.5-flash) are closed to new API keys, so keep this overridable.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// Optional model to try on the final attempt when the primary stays overloaded.
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || '';

const RETRY_DELAYS_MS = [1000, 3000];
const RETRYABLE = /\b(429|500|503)\b/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateStreamWithRetry(ai, params) {
  for (let attempt = 0; ; attempt++) {
    const isLast = attempt === RETRY_DELAYS_MS.length;
    const model = isLast && GEMINI_FALLBACK_MODEL ? GEMINI_FALLBACK_MODEL : GEMINI_MODEL;
    try {
      return await ai.models.generateContentStream({ ...params, model });
    } catch (err) {
      if (isLast || !RETRYABLE.test(String(err && err.message))) throw err;
      console.warn(`Gemini ${model} attempt ${attempt + 1} failed (${String(err.message).slice(0, 80)}); retrying`);
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

module.exports = { generateStreamWithRetry };
