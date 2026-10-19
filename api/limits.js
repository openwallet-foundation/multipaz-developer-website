// Per-IP and global daily request limits.
// With Upstash Redis configured (Vercel's Upstash integration sets KV_REST_API_*),
// counters are shared by every instance and the daily window is the UTC day.
// Without it, or if Redis is slow or down, limits fall back to in-memory
// counters, which apply per instance and reset on cold start.
// Lives outside api/ so Vercel doesn't deploy it as its own function.

const { Redis } = require('@upstash/redis');

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_PER_MIN) || 10;
const DAILY_MAX = Number(process.env.DAILY_REQUEST_LIMIT) || 300;
const REDIS_TIMEOUT_MS = 1500;
// After a Redis failure, use in-memory limits for this long before retrying,
// so an outage doesn't add the timeout to every request.
const REDIS_COOLDOWN_MS = 60_000;

const RATE_LIMITED = { status: 429, error: 'Rate limit exceeded. Please wait a moment.' };
const DAILY_LIMITED = { status: 429, error: 'Daily limit reached. Please try again tomorrow.' };

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis =
  url && token
    ? new Redis({
        url,
        token,
        retry: { retries: 0 },
        signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
      })
    : null;
let redisDownUntil = 0;

// --- In-memory fallback ---
const rateLimitMap = new Map();
let dailyCount = 0;
let dailyResetTime = Date.now() + 86_400_000;

function checkMemory(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
  } else if (entry.count >= RATE_LIMIT_MAX) {
    return RATE_LIMITED;
  } else {
    entry.count++;
  }

  if (now > dailyResetTime) {
    dailyCount = 0;
    dailyResetTime = now + 86_400_000;
  }
  if (dailyCount >= DAILY_MAX) return DAILY_LIMITED;
  dailyCount++;
  return null;
}

// --- Shared (Redis) ---
async function increment(key, ttlSeconds) {
  const [count] = await redis.pipeline().incr(key).expire(key, ttlSeconds).exec();
  return count;
}

async function checkRedis(ip) {
  const iso = new Date().toISOString();
  // Per-IP first, so rejected requests don't use daily quota.
  const perMinute = await increment(`askai:ip:${ip}:${iso.slice(0, 16)}`, 60);
  if (perMinute > RATE_LIMIT_MAX) return RATE_LIMITED;
  const today = await increment(`askai:daily:${iso.slice(0, 10)}`, 2 * 86_400);
  if (today > DAILY_MAX) return DAILY_LIMITED;
  return null;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? String(forwarded).split(',')[0].trim() : req.socket && req.socket.remoteAddress) || 'unknown';
}

// Returns null if the request may proceed, else { status, error }.
async function checkLimits(req) {
  const ip = clientIp(req);
  if (redis && Date.now() >= redisDownUntil) {
    try {
      return await checkRedis(ip);
    } catch (err) {
      redisDownUntil = Date.now() + REDIS_COOLDOWN_MS;
      console.warn(`Shared rate limit unavailable (${err.message}); using in-memory limits for 60s`);
    }
  }
  return checkMemory(ip);
}

module.exports = { checkLimits };
