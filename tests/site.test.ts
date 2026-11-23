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

describe("isHiddenTask (reset point per contract)", () => {
  it("hides test tasks #1-#2 only on the old Robinhood escrow", async () => {
    vi.resetModules();
    const { isHiddenTask } = await import("@/lib/site");
    const OLD = "0x3ae9e77B5c880E12F545a20825d24bcFaF1b7fAD";
    const NEW = "0x1111111111111111111111111111111111111111";
    expect(isHiddenTask(4663, 1n, OLD)).toBe(true);
    expect(isHiddenTask(4663, 2n, OLD)).toBe(true);
    expect(isHiddenTask(4663, 3n, OLD)).toBe(false);
    expect(isHiddenTask(4663, 1n, NEW)).toBe(false); // a new contract starts clean
    expect(isHiddenTask(8453, 1n, NEW)).toBe(false);
  });
});

describe("X OAuth callback URL", () => {
  it("always uses the public domain, even if NEXT_PUBLIC_SITE_URL is a vercel.app address", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://xtask-zeta.vercel.app");
    const { redirectUri } = await import("@/lib/server/x-oauth");
    expect(redirectUri("https://xtask-zeta.vercel.app")).toBe("https://xtask.fun/api/auth/x/callback");
    expect(redirectUri("https://xtask.fun")).toBe("https://xtask.fun/api/auth/x/callback");
    expect(redirectUri("http://localhost:3000")).toBe("http://localhost:3000/api/auth/x/callback");
  });
});
