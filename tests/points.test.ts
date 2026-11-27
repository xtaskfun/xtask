import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import { pointsFor, spentUsd } from "@/lib/points";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const base = { token: USDC, symbol: "USDC", decimals: 6, rewardPerUser: 95_000n, slots: 100, claimed: 0, refunded: false };

describe("leaderboard points", () => {
  it("a 10 USDC task (fee included) = $10 = 100 points", () => {
    const usd = spentUsd(base, 500, null)!;
    expect(usd).toBeCloseTo(10);
    expect(pointsFor(usd)).toBe(100);
  });

  it("refunded slots don't count", () => {
    // 40 of 100 claimed, the rest refunded: 10 - 60 * 0.095 = 4.3
    const usd = spentUsd({ ...base, claimed: 40, refunded: true }, 500, null)!;
    expect(usd).toBeCloseTo(4.3);
    expect(pointsFor(usd)).toBe(43);
  });

  it("prices ETH with the oracle and skips unknown tokens", () => {
    const eth = { ...base, token: zeroAddress, symbol: "ETH", decimals: 18, rewardPerUser: 10n ** 16n, slots: 95 }; // 0.95 pool
    expect(spentUsd(eth, 500, 2000)).toBeCloseTo(2000);
    expect(spentUsd(eth, 500, null)).toBeNull();
    expect(spentUsd({ ...base, symbol: "PEPE" }, 500, 2000)).toBeNull();
    // HYPE is a native coin too, but must never be priced as ETH
    expect(spentUsd({ ...eth, symbol: "HYPE" }, 500, 2000)).toBeNull();
  });
});
