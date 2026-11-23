"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteStats } from "@/lib/server/leaderboard";

/** Counts up from 0 to `value` once it's known. */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1200);
      setShown(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

const fmtUsd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K` : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

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
    { label: "Rewards paid", icon: "💸", value: data?.rewardsPaidUsd, format: fmtUsd },
    { label: "Active tasks", icon: "⚡", value: data?.activeTasks, format: fmtInt },
    { label: "Rewards claimed", icon: "🎁", value: data?.claims, format: fmtInt },
    { label: "Projects", icon: "🚀", value: data?.projects, format: fmtInt },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="glow-card p-5 md:p-6">
          <div className="text-xl">{s.icon}</div>
          <div className="font-display mt-3 text-3xl font-bold md:text-4xl">
            {s.value === undefined ? <span className="text-white/30">—</span> : <CountUp value={s.value} format={s.format} />}
          </div>
          <div className="mt-1 text-sm text-white/50">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
