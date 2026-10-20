# Ask AI API Server

Backend API for the Ask AI widget on the Multipaz developer website. Provides chat (Gemini), text-to-speech (ElevenLabs), and feedback collection (Google Sheets) endpoints.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for the chat endpoint |
| `GEMINI_MODEL` | No | Gemini model for chat (default: `gemini-3.8-flash`) |
| `GEMINI_FALLBACK_MODEL` | No | Model to try on the last retry when the primary keeps failing (429/5xx or network error), and right away when the primary returns 404 (default: none) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for text-to-speech |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID (default: `JBFqnCBsd6RMkjVDRZzb` — George) |
| `ELEVENLABS_MODEL_ID` | No | ElevenLabs model (default: `eleven_turbo_v2_5`) |
| `FEEDBACK_WEBHOOK_URL` | No | Google Apps Script web app URL for feedback collection |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins (default: `http://localhost:3000,http://localhost:3001,http://localhost:3010`) |
| `RATE_LIMIT_PER_MIN` | No | Max requests per IP per minute (default: `10`) |
| `DAILY_REQUEST_LIMIT` | No | Global daily cap on Gemini calls; invalid requests don't count (default: `300`) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | No | Upstash Redis REST credentials (set automatically by Vercel's Upstash integration; `UPSTASH_REDIS_REST_URL`/`_TOKEN` also work). When set, the per-IP and daily limits are shared across all instances and the daily window is the UTC day; otherwise they're in-memory per instance. |
| `PORT` | No | Server port (default: `3010`) |

For production, these are set as **Vercel environment variables** (Settings > Environment Variables in the Vercel dashboard, or via `vercel env add`).

The Docusaurus frontend also requires `ASK_AI_API_URL` set as a **GitHub Actions variable** (repo Settings > Secrets and variables > Actions > Variables) since it's baked in at build time.

## Running Locally

```bash
# Install dependencies
cd api && npm install

# Start the server (minimum — chat only)
GEMINI_API_KEY=your_key node server.js

# Start with all features
GEMINI_API_KEY=your_key \
ELEVENLABS_API_KEY=your_key \
FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/.../exec \
node server.js
```

## Endpoints

### `POST /api/chat`
Streaming chat powered by Gemini. Accepts `{ messages: [{ role, content }] }` and returns Server-Sent Events.

Rather than sending all of `docs-context.txt` (~100k tokens) with every question, `docs-retrieval.js` splits it into sections at startup and sends Gemini only the ~8 sections that best match the last two user messages (BM25 keyword search, ~3–6k tokens), plus a pinned overview. This keeps requests within the Gemini free tier's per-minute token limit and cuts paid cost by ~20x.

### `POST /api/tts`
Text-to-speech via ElevenLabs. Accepts `{ text: string }` and returns `audio/mpeg` stream.

### `POST /api/feedback`
Feedback proxy — forwards thumbs-up/down ratings to a Google Sheets webhook. Accepts `{ rating: "up"|"down", question: string, answer: string }`.

## Setting Up Feedback (Google Sheets)

1. Create a Google Sheet with columns: `timestamp`, `rating`, `question`, `answer`
2. Open **Extensions > Apps Script**
3. Paste the following:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.rating,
    data.question,
    data.answer
  ]);
  return ContentService.createTextOutput('OK');
}
```

4. **Deploy > New deployment** > Type: Web app > Execute as: Me > Who has access: Anyone
5. Authorize when prompted
6. Copy the web app URL and set it as `FEEDBACK_WEBHOOK_URL`

### Privacy

Feedback collection is anonymous. The only data stored is:
- Timestamp
- Rating (up/down)
- The question and answer text

No personally identifiable information is collected — no IP addresses, user identities, cookies, or tracking IDs.
