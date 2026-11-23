import type { TaskAction } from "../tasks";
import type { XTarget } from "../x/target";

/** Calls the X API v2 with the user's token. `path` starts with "/". */
export type XApi = (path: string) => Promise<any>;

export class XApiError extends Error {
  constructor(public status: number, message: string, public detail = "") {
    super(message);
  }
}

/** Pulls X's own explanation out of an error response (v2 problem+json or v1-style errors). */
async function xErrorDetail(res: Response) {
  try {
    const body = await res.json();
    const parts = [body.title, body.detail, body.reason, body.errors?.[0]?.message, body.error_description, body.error]
      .filter((p) => typeof p === "string" && p.trim());
    return [...new Set(parts)].join(" — ").slice(0, 240);
  } catch {
    return "";
  }
}

export function makeXApi(accessToken: string, base = process.env.X_API_BASE_URL || "https://api.x.com/2"): XApi {
  return async (path) => {
    const res = await fetch(base + path, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) {
      const detail = await xErrorDetail(res);
      // Shows up in Vercel → Logs; the path never contains secrets
      console.error(`X API ${path.split("?")[0]} → ${res.status} ${detail}`);
      throw new XApiError(res.status, `X API ${path.split("?")[0]} → ${res.status}`, detail);
    }
    return res.json();
  };
}

// How deep we look. X bills reads per item returned, so we only read the newest few: lists come
// newest-first, and people verify right after doing the action. One page each, sizes tunable via env.
const envInt = (name: string, def: number, min: number, max: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, Math.floor(n))) : def;
};
const FOLLOWING_SIZE = () => envInt("X_CHECK_FOLLOWING", 20, 1, 1000); // newest accounts followed
const LIKES_SIZE = () => envInt("X_CHECK_LIKES", 10, 10, 100); // newest likes (X minimum is 10)
const TIMELINE_SIZE = () => envInt("X_CHECK_POSTS", 10, 5, 100); // newest posts/reposts/replies (X minimum is 5)
const PAGES = 1;

async function* paginate(api: XApi, path: string, maxPages: number) {
  let token: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const sep = path.includes("?") ? "&" : "?";
    const page = await api(path + (token ? `${sep}pagination_token=${token}` : ""));
    yield (page.data ?? []) as any[];
    token = page.meta?.next_token;
    if (!token) return;
  }
}

/** Looks up an account id by handle, optionally through a cache (ids never change). */
export type UserIdLookup = (handle: string, fetchId: () => Promise<string | undefined>) => Promise<string | undefined>;

async function follows(api: XApi, me: string, handle: string, lookup?: UserIdLookup) {
  const fetchId = async () => (await api(`/users/by/username/${encodeURIComponent(handle)}`)).data?.id as string | undefined;
  const targetId = lookup ? await lookup(handle, fetchId) : await fetchId();
  if (!targetId) return false;
  if (targetId === me) return true;
  for await (const users of paginate(api, `/users/${me}/following?max_results=${FOLLOWING_SIZE()}`, PAGES)) {
    if (users.some((u) => u.id === targetId)) return true;
  }
  return false;
}

async function liked(api: XApi, me: string, tweetId: string) {
  for await (const tweets of paginate(api, `/users/${me}/liked_tweets?max_results=${LIKES_SIZE()}`, PAGES)) {
    if (tweets.some((t) => t.id === tweetId)) return true;
  }
  return false;
}

/** One timeline scan answers repost, reply and quote at once. */
async function timelineRefs(api: XApi, me: string, tweetId: string) {
  const found = new Set<"retweeted" | "replied_to" | "quoted">();
  const path = `/users/${me}/tweets?max_results=${TIMELINE_SIZE()}&tweet.fields=referenced_tweets`;
  for await (const tweets of paginate(api, path, PAGES)) {
    for (const t of tweets) for (const r of t.referenced_tweets ?? []) if (r.id === tweetId) found.add(r.type);
    if (found.size === 3) break;
  }
  return found;
}

export type VerifyResult = { ok: boolean; actions: Partial<Record<TaskAction, boolean>> };

/** Checks every required action for X user `me`. */
export async function verifyActions(
  api: XApi,
  me: string,
  target: XTarget,
  actions: TaskAction[],
  lookup?: UserIdLookup
): Promise<VerifyResult> {
  const out: VerifyResult["actions"] = {};
  const needsTimeline = actions.some((a) => a === "retweet" || a === "reply" || a === "quote");
  const refs = needsTimeline && target.tweetId ? await timelineRefs(api, me, target.tweetId) : new Set<string>();

  for (const a of actions) {
    if (a === "follow") out.follow = await follows(api, me, target.handle, lookup);
    else if (!target.tweetId) out[a] = false;
    else if (a === "like") out.like = await liked(api, me, target.tweetId);
    else if (a === "retweet") out.retweet = refs.has("retweeted");
    else if (a === "reply") out.reply = refs.has("replied_to");
    else if (a === "quote") out.quote = refs.has("quoted");
  }
  return { ok: actions.length > 0 && actions.every((a) => out[a]), actions: out };
}

/** Basic anti-bot rules for the X account, configurable through env. */
export function accountEligibility(user: { createdAt?: string; followers?: number }, now = Date.now()) {
  const minAgeDays = Number(process.env.X_MIN_ACCOUNT_AGE_DAYS ?? 0);
  const minFollowers = Number(process.env.X_MIN_FOLLOWERS ?? 0);
  if (user.createdAt && (now - new Date(user.createdAt).getTime()) / 86_400_000 < minAgeDays)
    return { ok: false, reason: `Your X account must be at least ${minAgeDays} days old.` };
  if ((user.followers ?? 0) < minFollowers)
    return { ok: false, reason: `Your X account needs at least ${minFollowers} followers.` };
  return { ok: true as const };
}
