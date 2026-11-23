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
 * Reset point per network: tasks with an id up to this number are hidden from the site,
 * the stats and the leaderboard (e.g. test tasks). On-chain data can't be deleted; this only
 * stops the site from showing or counting them. Raise the number to reset again.
 */
export const RESET_UP_TO: Record<number, number> = {
  4663: 2, // Robinhood Chain: test tasks #1–#2 (23 Nov 2026)
  8453: 0, // Base: nothing hidden
};

/** Single tasks to hide, as "<chainId>-<taskId>". */
export const HIDDEN_TASKS = new Set<string>([]);

export function isHiddenTask(chainId: number, taskId: bigint | number) {
  return BigInt(taskId) <= BigInt(RESET_UP_TO[chainId] ?? 0) || HIDDEN_TASKS.has(`${chainId}-${taskId}`);
}

/** Every task runs this long; after that the creator can refund unclaimed slots. */
export const TASK_DURATION_DAYS = 30;
