import { describe, expect, it, vi, afterEach } from "vitest";
import { memoryStore } from "@/lib/server/store";
import { claimLimitPerIp, clientIp, hashIp, reserveIpSlot } from "@/lib/server/ip-limit";

describe("claim limit per IP", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("one wallet per IP per task by default; the same wallet keeps its slot", async () => {
    const s = memoryStore();
    const ip = hashIp("1.2.3.4");
    expect(await reserveIpSlot(s, "t1", ip, "0xAAA", 1, 60)).toBe(true);
    expect(await reserveIpSlot(s, "t1", ip, "0xaaa", 1, 60)).toBe(true); // same wallet again
    expect(await reserveIpSlot(s, "t1", ip, "0xBBB", 1, 60)).toBe(false); // second wallet, same IP
    expect(await reserveIpSlot(s, "t2", ip, "0xBBB", 1, 60)).toBe(true); // other task is fine
    expect(await reserveIpSlot(s, "t1", hashIp("5.6.7.8"), "0xBBB", 1, 60)).toBe(true); // other IP is fine
  });

  it("a higher limit allows that many wallets", async () => {
    const s = memoryStore();
    const ip = hashIp("1.2.3.4");
    for (const w of ["0x1", "0x2", "0x3"]) expect(await reserveIpSlot(s, "t", ip, w, 3, 60)).toBe(true);
    expect(await reserveIpSlot(s, "t", ip, "0x4", 3, 60)).toBe(false);
  });

  it("reads the limit from env and the IP from headers; never stores raw IPs", () => {
    expect(claimLimitPerIp()).toBe(1);
    vi.stubEnv("CLAIM_LIMIT_PER_IP", "3");
    expect(claimLimitPerIp()).toBe(3);
    const req = new Request("http://x", { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } });
    expect(clientIp(req)).toBe("9.9.9.9");
    expect(hashIp("9.9.9.9")).not.toContain("9.9.9.9");
  });
});
