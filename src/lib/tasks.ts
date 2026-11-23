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
  category: "Project" | "Meme" | "NFT" | "DeFi" | "Community";
};

export const ACTION_META: Record<TaskAction, { label: string; icon: string }> = {
  follow: { label: "Follow", icon: "👤" },
  like: { label: "Like", icon: "❤️" },
  retweet: { label: "Repost", icon: "🔁" },
  reply: { label: "Reply", icon: "💬" },
  quote: { label: "Quote", icon: "✍️" },
};

// Mock data — replace with an API / smart-contract read later.
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
    slots: 500,
    filled: 312,
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
    slots: 1000,
    filled: 870,
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
    slots: 200,
    filled: 41,
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
    slots: 300,
    filled: 150,
    endsAt: "2026-12-20T00:00:00Z",
    category: "DeFi",
  },
  {
    id: "5",
    title: "Join the community raid",
    description: "Like and repost the community AMA announcement.",
    creator: "@xtaskfun",
    actions: ["like", "retweet"],
    targetUrl: "https://x.com",
    rewardPerUser: 1,
    token: "USDC",
    slots: 2000,
    filled: 640,
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
    slots: 800,
    filled: 799,
    endsAt: "2026-11-28T00:00:00Z",
    category: "Project",
  },
];

export const getTask = (id: string) => TASKS.find((t) => t.id === id);

export function daysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
