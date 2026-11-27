import { describe, expect, it, vi, beforeEach } from "vitest";

const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const k of ["NEXT_PUBLIC_ESCROW_ADDRESS", "NEXT_PUBLIC_ESCROW_CHAIN_ID", "NEXT_PUBLIC_ESCROW_ADDRESS_BASE", "NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD", "NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA", "NEXT_PUBLIC_ESCROW_ADDRESS_ELYSIUM"])
    vi.stubEnv(k, env[k] ?? "");
  return import("@/lib/escrow");
}

describe("escrow config", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("keeps the original single-chain env working", async () => {
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "8453" });
    expect(m.ESCROWS.map((e) => [e.chain.id, e.address])).toEqual([[8453, A]]);
    expect(m.parseTaskKey("8453-7")).toMatchObject({ id: 7n, escrow: { address: A } });
  });

  it("keeps Robinhood Chain off the site but still refunds there", async () => {
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "8453", NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD: B });
    expect(m.ESCROWS.map((e) => e.chain.id)).toEqual([8453]);
    expect(m.parseTaskKey("4663-3")).toBeNull(); // no claims or task pages on Robinhood Chain
    expect(m.ALL_ESCROWS.map((e) => [e.chain.id, e.address])).toEqual([[8453, A], [4663, B]]);
    expect(m.parseTaskKey("8453-3")).toMatchObject({ escrow: { address: A } });
    expect(m.parseTaskKey("10-3")).toBeNull(); // no escrow on that chain
    expect(m.parseTaskKey("abc")).toBeNull();
  });

  it("ignores the legacy pair when it points at Robinhood Chain", async () => {
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "4663" });
    expect(m.ESCROWS).toEqual([]);
  });

  it("switches from Base to Elysium once the Elysium escrow is set, keeping Base for refunds", async () => {
    const before = await load({ NEXT_PUBLIC_ESCROW_ADDRESS_BASE: A });
    expect(before.ESCROWS.map((e) => e.chain.id)).toEqual([8453]);
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS_BASE: A, NEXT_PUBLIC_ESCROW_ADDRESS_ELYSIUM: B, NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "8453" });
    expect(m.ON_ELYSIUM).toBe(true);
    expect(m.ESCROWS.map((e) => [e.chain.id, e.address])).toEqual([[99901, B]]);
    expect(m.parseTaskKey("99901-1")).toMatchObject({ escrow: { address: B } });
    expect(m.parseTaskKey("8453-1")).toBeNull(); // no new claims on Base
    expect(m.ALL_ESCROWS.map((e) => e.chain.id)).toEqual([99901, 8453]); // Base still refunded
  });

  it("prefers the per-network variable when a chain is set twice", async () => {
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "8453", NEXT_PUBLIC_ESCROW_ADDRESS_BASE: B });
    expect(m.ESCROWS.map((e) => e.address)).toEqual([B]);
  });

  it("is in demo mode without any escrow", async () => {
    const m = await load({});
    expect(m.HAS_ESCROW).toBe(false);
  });
});
