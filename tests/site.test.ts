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

describe("isHiddenTask", () => {
  it("shows every task when nothing is hidden", async () => {
    vi.resetModules();
    const { isHiddenTask } = await import("@/lib/site");
    expect(isHiddenTask(4663, 1n, "0x3ae9e77B5c880E12F545a20825d24bcFaF1b7fAD")).toBe(false);
    expect(isHiddenTask(4663, 4n, "0x775fd4e56E083C1A3Cf1048AC2E26382b916A02A")).toBe(false);
    expect(isHiddenTask(8453, 1n, "0x7589703E07AcaE0a5d2D3DB346dB725a4AeEaa7D")).toBe(false);
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
