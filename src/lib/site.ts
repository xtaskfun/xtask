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
 * Tasks hidden from the site and the leaderboard (e.g. test tasks), as "<chainId>-<taskId>".
 * On-chain data can't be deleted; this only stops the site from showing or counting them.
 */
export const HIDDEN_TASKS = new Set<string>([
  "4663-1", // test task on Robinhood Chain (23 Nov 2026)
]);
