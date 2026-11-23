const BPS = 10_000n;

/** Platform fee assumed in demo mode; live pages read feeBps from the escrow. */
export const DEFAULT_FEE_BPS = 500; // 5%

/**
 * Same math as XTaskEscrow.quote(): the fee is `feeBps` of the total the creator pays,
 * rounded up. Example at 5%: a 9.5 pool costs 10 (fee 0.5).
 */
export function quote(rewardPerUser: bigint, slots: number, feeBps: number) {
  const pool = rewardPerUser * BigInt(slots);
  const bps = BigInt(feeBps);
  const fee = bps === 0n ? 0n : (pool * bps + (BPS - bps) - 1n) / (BPS - bps);
  return { pool, fee, total: pool + fee };
}

/**
 * Largest reward per person whose total (pool + fee) fits in `budget`, so the fee is taken
 * out of the budget instead of added on top. E.g. 10 USDC, 100 people, 5% → 0.095 each.
 */
export function rewardForBudget(budget: bigint, slots: number, feeBps: number) {
  if (budget <= 0n || slots <= 0) return 0n;
  const s = BigInt(slots);
  let r = (budget * (BPS - BigInt(feeBps))) / BPS / s;
  while (r > 0n && quote(r, slots, feeBps).total > budget) r--;
  while (quote(r + 1n, slots, feeBps).total <= budget) r++;
  return r;
}
