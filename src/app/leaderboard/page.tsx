"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Link from "next/link";
import XAvatar from "@/components/XAvatar";
import { POINTS_PER_USD } from "@/lib/points";
import type { LeaderboardRow } from "@/lib/server/leaderboard";

type Data = { rows: LeaderboardRow[]; ethUsd: number | null; updatedAt: string; error?: string };

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
// Top 3 get a gold / silver / bronze badge instead of a plain number
const MEDAL = ["bg-[#ffd54a] text-black", "bg-[#d9dde3] text-black", "bg-[#d08a4a] text-black"];
const medal = (i: number) => (
  <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${MEDAL[i] ?? "text-muted"}`}>{i + 1}</span>
);
const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<Data> => (await fetch("/api/leaderboard")).json(),
    refetchInterval: 60_000,
  });
  const rows = data?.rows ?? [];
  const mine = address ? rows.findIndex((r) => r.creator.toLowerCase() === address.toLowerCase()) : -1;

  return (
    <div className="py-10">
      <h1 className="text-4xl font-bold md:text-5xl"><span className="text-rainbow-flow">Leaderboard</span></h1>
      <p className="mt-1 text-muted">
        Top task creators. Earn <span className="text-rainbow font-semibold">{POINTS_PER_USD} points for every $1</span> you spend on tasks.
      </p>

      {mine >= 0 && (
        <div className="border-rainbow mt-6 flex items-center justify-between rounded-2xl p-5">
          <div>
            <div className="text-sm text-muted">Your rank</div>
            <div className="text-2xl font-black">#{mine + 1}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Your points</div>
            <div className="text-rainbow text-2xl font-black">{rows[mine].points.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden glass">
        <div className="grid grid-cols-[48px_1fr_auto] gap-3 border-b border-line px-4 py-3 text-xs uppercase tracking-wide text-muted sm:grid-cols-[56px_1fr_90px_110px_110px]">
          <span>#</span>
          <span>Creator</span>
          <span className="hidden text-right sm:block">Tasks</span>
          <span className="hidden text-right sm:block">Spent</span>
          <span className="text-right">Points</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse border-b border-line bg-white/[0.02]" />)
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted">
            {data?.error ?? "No creators yet."}{" "}
            <Link href="/create" className="text-brand hover:underline">
              Create the first task →
            </Link>
          </div>
        ) : (
          rows.map((r, i) => {
            const isMe = i === mine;
            return (
              <div
                key={r.creator}
                className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[56px_1fr_90px_110px_110px] ${
                  isMe ? "bg-white/[0.04]" : ""
                }`}
              >
                <span className={`text-lg font-bold ${i < 3 ? "" : "text-muted"}`}>{medal(i)}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <XAvatar handle={r.handle || r.creator.slice(2, 4)} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.handle ? (
                        <a href={`https://x.com/${r.handle.replace(/^@/, "")}`} target="_blank" rel="noreferrer noopener" className="hover:underline">
                          {r.handle}
                        </a>
                      ) : (
                        short(r.creator)
                      )}
                      {isMe && <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">YOU</span>}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {short(r.creator)}
                      <span className="sm:hidden">
                        {" "}
                        · {r.tasks} {r.tasks === 1 ? "task" : "tasks"} · {usd(r.usd)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="hidden text-right sm:block">{r.tasks}</span>
                <span className="hidden text-right sm:block">{usd(r.usd)}</span>
                <span className="text-rainbow text-right font-bold">{r.points.toLocaleString()}</span>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        Points = {POINTS_PER_USD} × USD spent on tasks (budget incl. platform fee, minus refunds). USDC, USDT and USDG count as $1; ETH uses
        the Chainlink ETH/USD price{data?.ethUsd ? ` (${usd(Math.round(data.ethUsd))})` : ""}. Updates every minute.
      </p>
    </div>
  );
}
