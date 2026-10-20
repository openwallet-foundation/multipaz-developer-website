// Starts a Gemini stream, retrying when the model is overloaded, rate limited,
// or the network drops.
// Lives outside api/ so Vercel doesn't deploy it as its own function.

// Older models (e.g. gemini-2.5-flash) are closed to new API keys, so keep this overridable.
// gemini-3.8-flash took 85s+ to start answering under load; 3.5 Flash at low
// thinking usually starts within ~5-15s.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
// Model to try on the final attempt when the primary stays overloaded, or right
// away when the primary isn't available (404). Set to "none" to disable.
const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL === 'none' ? '' : process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
// Doc Q&A doesn't need deep reasoning, and thinking delays the first word.
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || 'low';

const RETRY_DELAYS_MS = [1000, 3000];
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const NETWORK_ERROR = /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The SDK reports HTTP errors as "got status: 503 ..."; newer versions also set err.status.
function httpStatus(err) {
  if (err && Number.isInteger(err.status)) return err.status;
  const match = String(err && err.message).match(/got status: (\d{3})/);
  return match ? Number(match[1]) : 0;
}

async function generateStreamWithRetry(ai, params) {
  let primaryMissing = false;
  for (let attempt = 0; ; attempt++) {
    const isLast = attempt === RETRY_DELAYS_MS.length;
    const model = GEMINI_FALLBACK_MODEL && (isLast || primaryMissing) ? GEMINI_FALLBACK_MODEL : GEMINI_MODEL;
    try {
      return await ai.models.generateContentStream({
        ...params,
        model,
        config: { thinkingConfig: { thinkingLevel: GEMINI_THINKING_LEVEL }, ...params.config },
      });
    } catch (err) {
      const status = httpStatus(err);
      const message = String(err && err.message).slice(0, 80);
      if (status === 404 && GEMINI_FALLBACK_MODEL && model !== GEMINI_FALLBACK_MODEL) {
        primaryMissing = true;
        console.warn(`Gemini ${model} not found (${message}); switching to ${GEMINI_FALLBACK_MODEL}`);
        continue;
      }
      const retryable = status ? RETRYABLE_STATUS.has(status) : NETWORK_ERROR.test(`${err && err.message} ${err && err.cause && err.cause.code}`);
      if (isLast || !retryable) throw err;
      console.warn(`Gemini ${model} attempt ${attempt + 1} failed (${message}); retrying`);
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

module.exports = { generateStreamWithRetry };
