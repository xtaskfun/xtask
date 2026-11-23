"use client";

import { useQuery } from "@tanstack/react-query";
import type { SiteStats } from "@/lib/server/leaderboard";

const fmtUsd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** Live platform numbers read from the escrow contracts. */
export default function Stats() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<SiteStats | null> => {
      const r = await fetch("/api/stats");
      return r.ok ? r.json() : null;
    },
    refetchInterval: 60_000,
  });

  const items = [
    { label: "Rewards paid", value: data ? fmtUsd(data.rewardsPaidUsd) : "…" },
    { label: "Active tasks", value: data ? data.activeTasks.toLocaleString() : "…" },
    { label: "Rewards claimed", value: data ? data.claims.toLocaleString() : "…" },
    { label: "Projects", value: data ? data.projects.toLocaleString() : "…" },
  ];

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="bg-surface p-6 text-center">
          <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
          <div className="mt-1 text-sm text-muted">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
