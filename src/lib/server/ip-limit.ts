import { createHash } from "crypto";
import type { Store } from "./store";

/** How many different wallets may claim the same task from one IP address. */
export function claimLimitPerIp() {
  const n = Number(process.env.CLAIM_LIMIT_PER_IP ?? 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** The visitor's IP. On Vercel, x-forwarded-for / x-real-ip are set by the platform. */
export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** IPs are never stored as-is — only a salted hash. */
export function hashIp(ip: string) {
  const salt = process.env.SESSION_SECRET || process.env.SIGNER_PRIVATE_KEY || "xtask";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Reserves one of the `limit` claim slots for this IP on this task.
 * The same wallet asking again keeps its slot. Returns false when every slot is taken by other wallets.
 */
export async function reserveIpSlot(
  store: Store,
  scope: string,
  ipHash: string,
  wallet: string,
  limit: number,
  ttlSeconds: number
): Promise<boolean> {
  const me = wallet.toLowerCase();
  for (let n = 1; n <= limit; n++) {
    const key = `xtask:ip:${scope}:${ipHash}:${n}`;
    const owner = await store.get(key);
    if (owner === me) return true;
    if (owner === null && (await store.setNX(key, me, ttlSeconds))) return true;
    if ((await store.get(key)) === me) return true; // lost a race to ourselves
  }
  return false;
}
