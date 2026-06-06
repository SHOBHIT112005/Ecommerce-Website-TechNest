const STORE_KEY = "__TECHNEST_RATE_LIMIT_STORE__";
const CLEANUP_KEY = "__TECHNEST_RATE_LIMIT_LAST_CLEANUP__";

const rateStore = globalThis[STORE_KEY] || new Map();
globalThis[STORE_KEY] = rateStore;
globalThis[CLEANUP_KEY] = globalThis[CLEANUP_KEY] || 0;

function headerValue(req, name) {
  if (!req?.headers) return "";

  if (typeof req.headers.get === "function") {
    return req.headers.get(name) || "";
  }

  const direct = req.headers[name] || req.headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] || "";
  return direct || "";
}

function getClientIp(req) {
  const forwarded = headerValue(req, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerValue(req, "x-real-ip");
  if (realIp) return realIp.trim();

  return req?.socket?.remoteAddress || req?.ip || "unknown";
}

function maybeCleanup(now) {
  const lastCleanup = globalThis[CLEANUP_KEY] || 0;
  if (now - lastCleanup < 60_000) return;
  globalThis[CLEANUP_KEY] = now;

  for (const [key, value] of rateStore.entries()) {
    if (now > value.resetAt) rateStore.delete(key);
  }
}

export function checkRateLimit(req, { keyPrefix, windowMs, maxRequests }) {
  const now = Date.now();
  maybeCleanup(now);

  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  let bucket = rateStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  rateStore.set(key, bucket);

  const remaining = Math.max(0, maxRequests - bucket.count);
  const limited = bucket.count > maxRequests;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    limited,
    limit: maxRequests,
    remaining,
    retryAfterSeconds,
    resetAtUnix: Math.ceil(bucket.resetAt / 1000),
  };
}

export function applyRateLimit(req, res, options) {
  const result = checkRateLimit(req, options);

  if (typeof res?.setHeader === "function") {
    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(result.resetAtUnix));
  }

  if (result.limited) {
    if (typeof res?.setHeader === "function") {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
    }
    if (typeof res?.status === "function") {
      res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    return false;
  }

  return true;
}
