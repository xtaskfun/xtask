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
