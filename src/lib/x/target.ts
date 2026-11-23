/** What a task points at on X. */
export type XTarget = { handle: string; tweetId?: string };

const RESERVED = new Set(["i", "home", "explore", "search", "settings", "messages", "notifications", "intent", "share"]);

/**
 * Parses https://x.com/<handle> or https://x.com/<handle>/status/<id>
 * (twitter.com, www. and mobile. are accepted too). Returns null if it isn't one.
 */
export function parseTarget(url: string): XTarget | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|mobile\.)/, "");
  if (host !== "x.com" && host !== "twitter.com") return null;

  const [handle, kind, id] = u.pathname.split("/").filter(Boolean);
  if (!handle || !/^[A-Za-z0-9_]{1,15}$/.test(handle) || RESERVED.has(handle.toLowerCase())) return null;
  if (!kind) return { handle };
  if (kind === "status" && id && /^\d{1,25}$/.test(id)) return { handle, tweetId: id };
  return null;
}

/** Follow only needs a profile; every other action needs a specific post. */
export function targetSupports(target: XTarget | null, actions: string[]) {
  if (!target) return false;
  return actions.every((a) => a === "follow" || !!target.tweetId);
}
