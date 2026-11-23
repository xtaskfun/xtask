import { describe, expect, it, beforeAll } from "vitest";
import { memoryStore } from "@/lib/server/store";
import { seal, unseal } from "@/lib/server/seal";

describe("memoryStore", () => {
  it("setNX only sets once and honours TTL", async () => {
    let t = 0;
    const s = memoryStore(() => t);
    expect(await s.setNX("k", "a", 10)).toBe(true);
    expect(await s.setNX("k", "b", 10)).toBe(false);
    expect(await s.get("k")).toBe("a");
    t = 11_000;
    expect(await s.get("k")).toBeNull();
    expect(await s.setNX("k", "b")).toBe(true);
  });
});

describe("seal / unseal", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "test-secret-that-is-at-least-32-characters";
  });

  it("round-trips data", () => {
    expect(unseal(seal({ a: 1, t: "x" }))).toEqual({ a: 1, t: "x" });
  });

  it("rejects tampered or foreign cookies", () => {
    const token = seal({ id: "1" });
    const raw = Buffer.from(token, "base64url");
    raw[raw.length - 1] ^= 1;
    expect(unseal(raw.toString("base64url"))).toBeNull();
    expect(unseal("garbage")).toBeNull();
    expect(unseal(undefined)).toBeNull();
  });
});
