/** Public site address (link previews, docs). NEXT_PUBLIC_SITE_URL overrides it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://xtask.fun").replace(/\/$/, "");

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
