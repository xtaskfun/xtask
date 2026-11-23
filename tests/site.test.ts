import { describe, expect, it, vi, afterEach } from "vitest";

async function siteUrl(env: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", env ?? "");
  return (await import("@/lib/site")).SITE_URL;
}

describe("SITE_URL (used in share links)", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("defaults to xtask.fun", async () => expect(await siteUrl(undefined)).toBe("https://xtask.fun"));
  it("ignores a vercel.app address", async () => expect(await siteUrl("https://xtask-zeta.vercel.app/")).toBe("https://xtask.fun"));
  it("uses another custom domain", async () => expect(await siteUrl("https://app.xtask.fun/")).toBe("https://app.xtask.fun"));
});

describe("isHiddenTask (reset point)", () => {
  it("hides Robinhood test tasks #1-#2 only", async () => {
    vi.resetModules();
    const { isHiddenTask } = await import("@/lib/site");
    expect(isHiddenTask(4663, 1n)).toBe(true);
    expect(isHiddenTask(4663, 2n)).toBe(true);
    expect(isHiddenTask(4663, 3n)).toBe(false);
    expect(isHiddenTask(8453, 1n)).toBe(false);
  });
});
