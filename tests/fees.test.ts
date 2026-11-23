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

import { rewardForBudget } from "@/lib/fees";

describe("rewardForBudget (fee taken out of the budget)", () => {
  it("10 USDC for 100 people at 5% → 0.095 each, total exactly 10", () => {
    const r = rewardForBudget(10_000_000n, 100, 500);
    expect(r).toBe(95_000n);
    expect(quote(r, 100, 500)).toEqual({ pool: 9_500_000n, fee: 500_000n, total: 10_000_000n });
  });

  it("never exceeds the budget and leaves at most dust", () => {
    for (const [budget, slots] of [[7_777_777n, 13], [1_000_000n, 3], [123n, 7], [10n ** 18n, 9_999]] as const) {
      const r = rewardForBudget(budget, slots, 500);
      const { total } = quote(r, slots, 500);
      expect(total <= budget).toBe(true);
      expect(quote(r + 1n, slots, 500).total > budget).toBe(true);
    }
  });

  it("returns 0 when the budget is too small", () => {
    expect(rewardForBudget(1n, 5, 500)).toBe(0n);
  });
});
