import { describe, expect, it } from "vitest";
import { parseTarget, targetSupports } from "@/lib/x/target";

describe("parseTarget", () => {
  it("parses profiles and posts on x.com and twitter.com", () => {
    expect(parseTarget("https://x.com/xtaskfun")).toEqual({ handle: "xtaskfun" });
    expect(parseTarget("https://twitter.com/xtaskfun/status/123456?s=20")).toEqual({ handle: "xtaskfun", tweetId: "123456" });
    expect(parseTarget("https://mobile.twitter.com/a_b/status/9")).toEqual({ handle: "a_b", tweetId: "9" });
  });

  it("rejects other sites and non-profile paths", () => {
    expect(parseTarget("https://evil.com/xtaskfun")).toBeNull();
    expect(parseTarget("https://x.com.evil.com/a")).toBeNull();
    expect(parseTarget("javascript:alert(1)")).toBeNull();
    expect(parseTarget("https://x.com/home")).toBeNull();
    expect(parseTarget("https://x.com/i/status/1")).toBeNull();
    expect(parseTarget("https://x.com/a/likes")).toBeNull();
  });

  it("requires a post for anything but follow", () => {
    expect(targetSupports({ handle: "a" }, ["follow"])).toBe(true);
    expect(targetSupports({ handle: "a" }, ["follow", "like"])).toBe(false);
    expect(targetSupports({ handle: "a", tweetId: "1" }, ["like", "retweet"])).toBe(true);
  });
});

import { autoTitle, parseMeta } from "@/lib/tasks";

describe("autoTitle", () => {
  it("builds a title from actions and the X account", () => {
    expect(autoTitle(["follow", "like"], "https://x.com/Xtaskfun/status/1")).toBe("Follow + Like @Xtaskfun");
    expect(autoTitle(["retweet"], "https://twitter.com/abc")).toBe("Repost @abc");
    expect(autoTitle([], "")).toBe("Task");
  });

  it("is used when a task has no stored title", () => {
    expect(parseMeta(JSON.stringify({ actions: ["follow"], targetUrl: "https://x.com/proj" })).title).toBe("Follow @proj");
    expect(parseMeta(JSON.stringify({ title: "Custom", actions: ["follow"] })).title).toBe("Custom");
  });
});
