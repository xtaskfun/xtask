import { describe, expect, it, vi, afterEach } from "vitest";
import { XApiError, accountEligibility, verifyActions, type XApi } from "@/lib/server/x-verify";

const ME = "100";
const TARGET_ID = "200";

/** Fake X API: routes by path prefix, supports pagination via next_token. */
function fakeApi(opts: {
  following?: string[][];
  likes?: string[][];
  timeline?: { id: string; referenced_tweets?: { type: string; id: string }[] }[][];
}): XApi & { calls: string[] } {
  const calls: string[] = [];
  const pageOf = (pages: any[][] | undefined, path: string, map: (x: any) => any) => {
    const n = Number(new URL("http://x" + path).searchParams.get("pagination_token") ?? 0);
    const list = pages ?? [[]];
    return { data: (list[n] ?? []).map(map), meta: n + 1 < list.length ? { next_token: String(n + 1) } : {} };
  };
  const api = (async (path: string) => {
    calls.push(path);
    if (path.startsWith("/users/by/username/")) return { data: { id: TARGET_ID } };
    if (path.startsWith(`/users/${ME}/following`)) return pageOf(opts.following, path, (id) => ({ id }));
    if (path.startsWith(`/users/${ME}/liked_tweets`)) return pageOf(opts.likes, path, (id) => ({ id }));
    if (path.startsWith(`/users/${ME}/tweets`)) return pageOf(opts.timeline, path, (t) => t);
    throw new Error("unexpected " + path);
  }) as XApi & { calls: string[] };
  api.calls = calls;
  return api;
}

const post = { handle: "proj", tweetId: "555" };

describe("verifyActions", () => {
  it("passes when every action is found, across pages", async () => {
    const api = fakeApi({
      following: [["1", "2"], ["3", TARGET_ID]],
      likes: [["9"], ["555"]],
      timeline: [[{ id: "a", referenced_tweets: [{ type: "retweeted", id: "555" }] }, { id: "b", referenced_tweets: [{ type: "replied_to", id: "555" }] }]],
    });
    const r = await verifyActions(api, ME, post, ["follow", "like", "retweet", "reply"]);
    expect(r).toEqual({ ok: true, actions: { follow: true, like: true, retweet: true, reply: true } });
  });

  it("reports exactly which actions are missing", async () => {
    const api = fakeApi({ following: [["1"]], likes: [["555"]], timeline: [[{ id: "a", referenced_tweets: [{ type: "quoted", id: "999" }] }]] });
    const r = await verifyActions(api, ME, post, ["follow", "like", "quote"]);
    expect(r.ok).toBe(false);
    expect(r.actions).toEqual({ follow: false, like: true, quote: false });
  });

  it("does not count a reply to a different post", async () => {
    const api = fakeApi({ timeline: [[{ id: "a", referenced_tweets: [{ type: "replied_to", id: "554" }] }]] });
    expect((await verifyActions(api, ME, post, ["reply"])).ok).toBe(false);
  });

  it("scans the timeline once for repost + reply + quote", async () => {
    const api = fakeApi({ timeline: [[]] });
    await verifyActions(api, ME, post, ["retweet", "reply", "quote"]);
    expect(api.calls.filter((c) => c.includes("/tweets")).length).toBe(1);
  });

  it("stops paging following after the limit", async () => {
    const pages = Array.from({ length: 20 }, (_, i) => [String(1000 + i)]);
    const api = fakeApi({ following: pages });
    expect((await verifyActions(api, ME, { handle: "proj" }, ["follow"])).ok).toBe(false);
    expect(api.calls.filter((c) => c.includes("/following")).length).toBe(5);
  });

  it("fails post actions when the task only links a profile", async () => {
    const r = await verifyActions(fakeApi({}), ME, { handle: "proj" }, ["like"]);
    expect(r).toEqual({ ok: false, actions: { like: false } });
  });

  it("propagates X API errors (e.g. rate limits)", async () => {
    const api: XApi = async () => {
      throw new XApiError(429, "rate");
    };
    await expect(verifyActions(api, ME, post, ["like"])).rejects.toMatchObject({ status: 429 });
  });
});

describe("accountEligibility", () => {
  afterEach(() => vi.unstubAllEnvs());
  const now = new Date("2026-11-23").getTime();

  it("applies default minimum age (30d) and followers (5)", () => {
    expect(accountEligibility({ createdAt: "2026-11-10", followers: 50 }, now).ok).toBe(false);
    expect(accountEligibility({ createdAt: "2025-01-01", followers: 2 }, now).ok).toBe(false);
    expect(accountEligibility({ createdAt: "2025-01-01", followers: 5 }, now).ok).toBe(true);
  });

  it("is configurable via env", () => {
    vi.stubEnv("X_MIN_ACCOUNT_AGE_DAYS", "0");
    vi.stubEnv("X_MIN_FOLLOWERS", "0");
    expect(accountEligibility({ createdAt: "2026-11-22", followers: 0 }, now).ok).toBe(true);
  });
});
