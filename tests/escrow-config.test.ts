import { describe, expect, it, vi, beforeEach } from "vitest";

const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const k of ["NEXT_PUBLIC_ESCROW_ADDRESS", "NEXT_PUBLIC_ESCROW_CHAIN_ID", "NEXT_PUBLIC_ESCROW_ADDRESS_BASE", "NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD", "NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA"])
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

  it("adds Robinhood Chain next to Base", async () => {
    const m = await load({ NEXT_PUBLIC_ESCROW_ADDRESS: A, NEXT_PUBLIC_ESCROW_CHAIN_ID: "8453", NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD: B });
    expect(m.ESCROWS.map((e) => e.chain.id).sort()).toEqual([4663, 8453]);
    expect(m.parseTaskKey("4663-3")).toMatchObject({ id: 3n, escrow: { address: B } });
    expect(m.parseTaskKey("8453-3")).toMatchObject({ escrow: { address: A } });
    expect(m.parseTaskKey("10-3")).toBeNull(); // no escrow on that chain
    expect(m.parseTaskKey("abc")).toBeNull();
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
