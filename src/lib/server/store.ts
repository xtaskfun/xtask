import { Redis } from "@upstash/redis";

/** Tiny key/value store: Upstash Redis in production, memory for local dev. */
export interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Sets only if the key does not exist. Returns true if it was set. */
  setNX(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
}

export function memoryStore(now = () => Date.now()): Store {
  const m = new Map<string, { v: string; exp?: number }>();
  const live = (k: string) => {
    const e = m.get(k);
    if (e && e.exp !== undefined && e.exp <= now()) m.delete(k);
    return m.get(k);
  };
  return {
    async get(k) {
      return live(k)?.v ?? null;
    },
    async set(k, v, ttl) {
      m.set(k, { v, exp: ttl ? now() + ttl * 1000 : undefined });
    },
    async setNX(k, v, ttl) {
      if (live(k)) return false;
      m.set(k, { v, exp: ttl ? now() + ttl * 1000 : undefined });
      return true;
    },
  };
}

function redisStore(redis: Redis): Store {
  return {
    async get(k) {
      const v = await redis.get<string>(k);
      return v == null ? null : String(v);
    },
    async set(k, v, ttl) {
      await (ttl ? redis.set(k, v, { ex: ttl }) : redis.set(k, v));
    },
    async setNX(k, v, ttl) {
      const r = await (ttl ? redis.set(k, v, { nx: true, ex: ttl }) : redis.set(k, v, { nx: true }));
      return r === "OK";
    },
  };
}

let cached: Store | null = null;

/** Returns null on a deployed server without Redis — claims must not run then. */
export function getStore(): Store | null {
  if (cached) return cached;
  // Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return (cached = redisStore(new Redis({ url, token })));
  if (process.env.VERCEL) return null; // memory would not be shared between serverless instances
  return (cached = memoryStore());
}
