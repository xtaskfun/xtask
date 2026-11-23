/**
 * Public site address used in share links and link previews. NEXT_PUBLIC_SITE_URL overrides it,
 * except a *.vercel.app address, which is ignored so shared links always use the real domain.
 */
const envSite = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
export const SITE_URL = envSite && !/\.vercel\.app$/i.test(envSite) ? envSite : "https://xtask.fun";

/** Official xtask.fun accounts. */
export const X_HANDLE = "Xtaskfun";
export const X_URL = `https://x.com/${X_HANDLE}`;

/**
 * How task completion is checked before a claim:
 * - "none": no check — anyone with a wallet can claim once per task (default)
 * - "x":    X login + verification through the X API (needs an X developer app)
 */
export const VERIFICATION_MODE: "none" | "x" =
  process.env.NEXT_PUBLIC_VERIFICATION_MODE === "x" ? "x" : "none";

/**
 * Reset point per escrow contract: tasks with an id up to this number are hidden from the site,
 * the stats and the leaderboard (e.g. test tasks). Keyed by contract address, so a newly deployed
 * contract starts clean. On-chain data can't be deleted; this only stops the site showing it.
 */
export const RESET_UP_TO: Record<string, number> = {
  // Robinhood Chain escrow v2: test tasks #1–#2 (23 Nov 2026)
  "0x3ae9e77b5c880e12f545a20825d24bcfaf1b7fad": 2,
};

/** Single tasks to hide, as "<chainId>-<taskId>". */
export const HIDDEN_TASKS = new Set<string>([]);

export function isHiddenTask(chainId: number, taskId: bigint | number, escrow: string) {
  const upTo = RESET_UP_TO[escrow.toLowerCase()] ?? 0;
  return BigInt(taskId) <= BigInt(upTo) || HIDDEN_TASKS.has(`${chainId}-${taskId}`);
}

/** Every task runs this long; after that the creator can refund unclaimed slots. */
export const TASK_DURATION_DAYS = 3;

/** Public source code. */
export const GITHUB_URL = "https://github.com/xtaskfun/xtask";
