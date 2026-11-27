import "server-only";
import { parseAbi, type Address } from "viem";
import { ESCROWS, escrowAbi } from "../escrow";
import { base } from "../chains";
import { parseMeta } from "../tasks";
import { findToken } from "../tokens";
import { STABLECOINS, pointsFor, spentUsd } from "../points";
import { zeroAddress } from "viem";
import { publicClient } from "./claim-flow";
import { isHiddenTask } from "../site";

/** Chainlink ETH/USD on Base (8 decimals). */
const ETH_USD_FEED = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" as const;
const feedAbi = parseAbi(["function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)"]);
const PAGE = 200n;

export type LeaderboardRow = {
  creator: Address;
  handle: string;
  tasks: number;
  usd: number;
  points: number;
};

async function ethUsd(): Promise<number | null> {
  try {
    const [, answer, , updatedAt] = await publicClient(base).readContract({ address: ETH_USD_FEED, abi: feedAbi, functionName: "latestRoundData" });
    // Ignore a stale price (older than a day)
    if (Date.now() / 1000 - Number(updatedAt) > 86_400) return null;
    return Number(answer) / 1e8;
  } catch {
    return null;
  }
}

export async function buildLeaderboard(): Promise<{ rows: LeaderboardRow[]; ethUsd: number | null; updatedAt: string }> {
  const price = await ethUsd();
  const byCreator = new Map<string, LeaderboardRow & { latest: number }>();

  for (const escrow of ESCROWS) {
    const client = publicClient(escrow.chain);
    let feeBps = 0;
    try {
      feeBps = Number(await client.readContract({ address: escrow.address, abi: escrowAbi, functionName: "feeBps" }));
    } catch {
      continue; // not an escrow with fees / unreachable
    }
    for (let offset = 0n; ; offset += PAGE) {
      const [ids, list] = await client.readContract({ address: escrow.address, abi: escrowAbi, functionName: "getTasks", args: [offset, PAGE] });
      list.forEach((t, i) => {
        if (isHiddenTask(escrow.chain.id, ids[i], escrow.address)) return;
        const token = findToken(escrow.chain.id, t.token);
        const usd = spentUsd({ ...t, symbol: token.symbol, decimals: token.decimals }, feeBps, price);
        if (usd === null || usd <= 0) return;
        const key = t.creator.toLowerCase();
        const row = byCreator.get(key) ?? { creator: t.creator, handle: "", tasks: 0, usd: 0, points: 0, latest: -1 };
        row.tasks += 1;
        row.usd += usd;
        // Show the X handle from the creator's newest task
        const order = Number(ids[i]) + escrow.chain.id * 1e9;
        if (order > row.latest) {
          row.latest = order;
          row.handle = parseMeta(t.meta).handle || row.handle;
        }
        byCreator.set(key, row);
      });
      if (BigInt(list.length) < PAGE) break;
    }
  }

  const rows = [...byCreator.values()]
    .map(({ latest: _latest, ...r }) => ({ ...r, usd: Math.round(r.usd * 100) / 100, points: pointsFor(r.usd) }))
    .sort((a, b) => b.points - a.points || b.tasks - a.tasks)
    .slice(0, 100);

  return { rows, ethUsd: price, updatedAt: new Date().toISOString() };
}

export type SiteStats = { rewardsPaidUsd: number; activeTasks: number; claims: number; projects: number };

/** Real numbers for the home page, read from every escrow (hidden test tasks excluded). */
export async function buildStats(): Promise<SiteStats> {
  const price = await ethUsd();
  const stats: SiteStats = { rewardsPaidUsd: 0, activeTasks: 0, claims: 0, projects: 0 };
  const creators = new Set<string>();
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (const escrow of ESCROWS) {
    const client = publicClient(escrow.chain);
    for (let offset = 0n; ; offset += PAGE) {
      let page;
      try {
        page = await client.readContract({ address: escrow.address, abi: escrowAbi, functionName: "getTasks", args: [offset, PAGE] });
      } catch {
        break;
      }
      const [ids, list] = page;
      list.forEach((t, i) => {
        if (isHiddenTask(escrow.chain.id, ids[i], escrow.address)) return;
        creators.add(t.creator.toLowerCase());
        stats.claims += t.claimed;
        if (!t.refunded && t.endsAt > now && t.claimed < t.slots) stats.activeTasks += 1;
        const token = findToken(escrow.chain.id, t.token);
        const paid = Number(t.rewardPerUser * BigInt(t.claimed)) / 10 ** token.decimals;
        const usd = STABLECOINS.has(token.symbol) ? paid : t.token === zeroAddress && token.symbol === "ETH" && price ? paid * price : 0;
        stats.rewardsPaidUsd += usd;
      });
      if (BigInt(list.length) < PAGE) break;
    }
  }
  stats.projects = creators.size;
  stats.rewardsPaidUsd = Math.round(stats.rewardsPaidUsd * 100) / 100;
  return stats;
}
