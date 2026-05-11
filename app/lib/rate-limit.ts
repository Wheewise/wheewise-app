type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function inMemoryCheck(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

interface KvStore {
  get(key: string, type: "json"): Promise<Bucket | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

async function kvCheck(
  kv: KvStore,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const stored = await kv.get(key, "json");

  if (!stored || stored.resetAt < now) {
    const ttl = Math.ceil(windowMs / 1000);
    await kv.put(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), {
      expirationTtl: ttl,
    });
    return { ok: true, retryAfter: 0 };
  }

  if (stored.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((stored.resetAt - now) / 1000),
    };
  }

  stored.count += 1;
  const ttl = Math.ceil((stored.resetAt - now) / 1000);
  await kv.put(key, JSON.stringify(stored), { expirationTtl: ttl });
  return { ok: true, retryAfter: 0 };
}

let kvBinding: KvStore | undefined;

export function setRateLimitKv(kv: KvStore) {
  kvBinding = kv;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  if (kvBinding) {
    return kvCheck(kvBinding, key, limit, windowMs);
  }
  return inMemoryCheck(key, limit, windowMs);
}
