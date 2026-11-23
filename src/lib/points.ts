import { formatUnits, zeroAddress } from "viem";
import { quote } from "./fees";

/** Leaderboard rule: task creators earn 10 points for every $1 they spend on tasks. */
export const POINTS_PER_USD = 10;

/** Tokens counted at $1. */
export const STABLECOINS = new Set(["USDC", "USDT", "USDG"]);

export type TaskForPoints = {
  token: `0x${string}`;
  symbol: string;
  decimals: number;
  rewardPerUser: bigint;
  slots: number;
  claimed: number;
  refunded: boolean;
};

/**
 * USD a creator actually spent on a task: the budget (pool + platform fee), minus whatever
 * was refunded. Returns null for tokens we can't price.
 */
export function spentUsd(t: TaskForPoints, feeBps: number, ethUsd: number | null): number | null {
  const { total } = quote(t.rewardPerUser, t.slots, feeBps);
  const refundedAmount = t.refunded ? t.rewardPerUser * BigInt(t.slots - t.claimed) : 0n;
  const spent = Number(formatUnits(total - refundedAmount, t.decimals));
  if (STABLECOINS.has(t.symbol)) return spent;
  if (t.token === zeroAddress) return ethUsd === null ? null : spent * ethUsd;
  return null;
}

export const pointsFor = (usd: number) => Math.floor(usd * POINTS_PER_USD);
