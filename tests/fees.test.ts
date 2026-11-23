import { describe, expect, it } from "vitest";
import { quote } from "@/lib/fees";

describe("quote (must match XTaskEscrow.quote)", () => {
  it("5%: a 9.5 pool costs 10", () => {
    // 0.095 USDC (6 decimals) x 100 people
    expect(quote(95_000n, 100, 500)).toEqual({ pool: 9_500_000n, fee: 500_000n, total: 10_000_000n });
  });

  it("rounds the fee up", () => {
    // 3 x 5 = 15 → 15 * 500 / 9500 = 0.789 → 1
    expect(quote(3n, 5, 500)).toEqual({ pool: 15n, fee: 1n, total: 16n });
  });

  it("0% fee", () => {
    expect(quote(10n, 3, 0)).toEqual({ pool: 30n, fee: 0n, total: 30n });
  });
});
