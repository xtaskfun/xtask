import type { TaskAction } from "../tasks";
import type { XTarget } from "../x/target";

/** Calls the X API v2 with the user's token. `path` starts with "/". */
export type XApi = (path: string) => Promise<any>;

export class XApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function makeXApi(accessToken: string, base = process.env.X_API_BASE_URL || "https://api.x.com/2"): XApi {
  return async (path) => {
    const res = await fetch(base + path, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) throw new XApiError(res.status, `X API ${path.split("?")[0]} → ${res.status}`);
    return res.json();
  };
}

// How deep we look. Recent activity is near the top, so a few pages is plenty.
const FOLLOWING_PAGES = 5; // up to 5,000 accounts followed
const LIKES_PAGES = 2; // last ~200 likes
const TIMELINE_PAGES = 2; // last ~200 posts / reposts / replies

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

async function follows(api: XApi, me: string, handle: string) {
  const target = await api(`/users/by/username/${encodeURIComponent(handle)}`);
  const targetId: string | undefined = target.data?.id;
  if (!targetId) return false;
  if (targetId === me) return true;
  for await (const users of paginate(api, `/users/${me}/following?max_results=1000`, FOLLOWING_PAGES)) {
    if (users.some((u) => u.id === targetId)) return true;
  }
  return false;
}

async function liked(api: XApi, me: string, tweetId: string) {
  for await (const tweets of paginate(api, `/users/${me}/liked_tweets?max_results=100`, LIKES_PAGES)) {
    if (tweets.some((t) => t.id === tweetId)) return true;
  }
  return false;
}

/** One timeline scan answers repost, reply and quote at once. */
async function timelineRefs(api: XApi, me: string, tweetId: string) {
  const found = new Set<"retweeted" | "replied_to" | "quoted">();
  const path = `/users/${me}/tweets?max_results=100&tweet.fields=referenced_tweets`;
  for await (const tweets of paginate(api, path, TIMELINE_PAGES)) {
    for (const t of tweets) for (const r of t.referenced_tweets ?? []) if (r.id === tweetId) found.add(r.type);
    if (found.size === 3) break;
  }
  return found;
}

export type VerifyResult = { ok: boolean; actions: Partial<Record<TaskAction, boolean>> };

/** Checks every required action for X user `me`. */
export async function verifyActions(api: XApi, me: string, target: XTarget, actions: TaskAction[]): Promise<VerifyResult> {
  const out: VerifyResult["actions"] = {};
  const needsTimeline = actions.some((a) => a === "retweet" || a === "reply" || a === "quote");
  const refs = needsTimeline && target.tweetId ? await timelineRefs(api, me, target.tweetId) : new Set<string>();

  for (const a of actions) {
    if (a === "follow") out.follow = await follows(api, me, target.handle);
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
  const minAgeDays = Number(process.env.X_MIN_ACCOUNT_AGE_DAYS ?? 30);
  const minFollowers = Number(process.env.X_MIN_FOLLOWERS ?? 0);
  if (user.createdAt && (now - new Date(user.createdAt).getTime()) / 86_400_000 < minAgeDays)
    return { ok: false, reason: `Your X account must be at least ${minAgeDays} days old.` };
  if ((user.followers ?? 0) < minFollowers)
    return { ok: false, reason: `Your X account needs at least ${minFollowers} followers.` };
  return { ok: true as const };
}
