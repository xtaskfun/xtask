export type TaskAction = "follow" | "like" | "retweet" | "reply" | "quote";

export type Task = {
  id: string;
  title: string;
  description: string;
  creator: string; // X handle
  actions: TaskAction[];
  targetUrl: string; // tweet / profile url
  rewardPerUser: number;
  token: string;
  slots: number;
  filled: number;
  endsAt: string; // ISO date
  category: Category;
  /** Present only for tasks that live in the escrow contract. */
  onchain?: {
    chainId: number;
    escrow: `0x${string}`;
    taskId: bigint;
    creator: `0x${string}`;
    token: `0x${string}`;
    decimals: number;
    rewardRaw: bigint;
    refunded: boolean;
    ended: boolean;
  };
};

export const CATEGORIES = ["Project", "Meme", "NFT", "DeFi", "Community"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Off-chain details stored as JSON in the contract's `meta` field. */
export type TaskMeta = {
  title: string;
  description: string;
  targetUrl: string;
  actions: TaskAction[];
  category: Category;
  handle: string;
};

const isAction = (a: unknown): a is TaskAction =>
  typeof a === "string" && ["follow", "like", "retweet", "reply", "quote"].includes(a);

/** Only allow http(s) links — meta is user supplied, so never trust it as-is. */
export function safeUrl(u: unknown) {
  try {
    const url = new URL(String(u));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "https://x.com";
  } catch {
    return "https://x.com";
  }
}

/** Title built from the actions and the X account, e.g. "Follow + Like @Xtaskfun". */
export function autoTitle(actions: TaskAction[], targetUrl: string) {
  const who = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i.exec(targetUrl)?.[1];
  const what = actions.map((a) => ACTION_META[a].label).join(" + ") || "Task";
  return who ? `${what} @${who}` : what;
}

export function parseMeta(raw: string): TaskMeta {
  let m: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") m = parsed;
  } catch {}
  const str = (v: unknown, max: number, d = "") => (typeof v === "string" ? v.slice(0, max) : d);
  const handle = str(m.handle, 30).replace(/[^A-Za-z0-9_]/g, "");
  const actions = Array.isArray(m.actions) ? m.actions.filter(isAction) : [];
  const targetUrl = safeUrl(m.targetUrl);
  return {
    title: str(m.title, 100) || autoTitle(actions, targetUrl),
    description: str(m.description, 500),
    targetUrl,
    actions,
    category: CATEGORIES.includes(m.category as Category) ? (m.category as Category) : "Project",
    handle: handle ? `@${handle}` : "",
  };
}

export const ACTION_META: Record<TaskAction, { label: string }> = {
  follow: { label: "Follow" },
  like: { label: "Like" },
  retweet: { label: "Repost" },
  reply: { label: "Reply" },
  quote: { label: "Quote" },
};

// Demo data — shown while NEXT_PUBLIC_ESCROW_ADDRESS is not set.
export const TASKS: Task[] = [
  {
    id: "1",
    title: "Follow & repost launch thread",
    description: "Follow our account and repost the pinned launch thread to help spread the word.",
    creator: "@basebuilders",
    actions: ["follow", "retweet"],
    targetUrl: "https://x.com/base",
    rewardPerUser: 2,
    token: "USDC",
    slots: 100,
    filled: 62,
    endsAt: "2026-12-05T00:00:00Z",
    category: "Project",
  },
  {
    id: "2",
    title: "Like + reply with your wallet",
    description: "Like the giveaway post and reply with why you are bullish. Best replies get a bonus.",
    creator: "@pepe_onchain",
    actions: ["like", "reply"],
    targetUrl: "https://x.com",
    rewardPerUser: 500,
    token: "PEPE",
    slots: 100,
    filled: 87,
    endsAt: "2026-11-30T00:00:00Z",
    category: "Meme",
  },
  {
    id: "3",
    title: "Quote our mint announcement",
    description: "Quote-tweet the mint announcement with #xtask and tag 2 friends.",
    creator: "@pixelapes",
    actions: ["quote"],
    targetUrl: "https://x.com",
    rewardPerUser: 0.002,
    token: "ETH",
    slots: 100,
    filled: 21,
    endsAt: "2026-12-12T00:00:00Z",
    category: "NFT",
  },
  {
    id: "4",
    title: "Full engagement bundle",
    description: "Follow, like, repost and reply on our V2 release tweet.",
    creator: "@swapdex",
    actions: ["follow", "like", "retweet", "reply"],
    targetUrl: "https://x.com",
    rewardPerUser: 5,
    token: "USDT",
    slots: 100,
    filled: 50,
    endsAt: "2026-12-20T00:00:00Z",
    category: "DeFi",
  },
  {
    id: "5",
    title: "Join the community raid",
    description: "Like and repost the community AMA announcement.",
    creator: "@Xtaskfun",
    actions: ["like", "retweet"],
    targetUrl: "https://x.com/Xtaskfun",
    rewardPerUser: 1,
    token: "USDC",
    slots: 100,
    filled: 32,
    endsAt: "2026-12-01T00:00:00Z",
    category: "Community",
  },
  {
    id: "6",
    title: "Follow 3 partner accounts",
    description: "Follow the three partner accounts listed in the thread.",
    creator: "@arbiverse",
    actions: ["follow"],
    targetUrl: "https://x.com",
    rewardPerUser: 1.5,
    token: "ARB",
    slots: 100,
    filled: 99,
    endsAt: "2026-11-28T00:00:00Z",
    category: "Project",
  },
];

export const getTask = (id: string) => TASKS.find((t) => t.id === id);

export function daysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
