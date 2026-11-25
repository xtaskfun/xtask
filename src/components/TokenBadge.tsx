"use client";

import { useState } from "react";
import { XTASK_TOKEN } from "@/lib/site";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Official $XTASK contract address with copy + explorer link. */
export default function TokenBadge({ full = false }: { full?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass inline-flex max-w-full items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm">
      <span className="font-display text-rainbow font-bold">${XTASK_TOKEN.symbol}</span>
      <a
        href={XTASK_TOKEN.explorer}
        target="_blank"
        rel="noreferrer noopener"
        className="truncate font-mono text-xs text-white/70 hover:text-white"
        title={`${XTASK_TOKEN.address} on ${XTASK_TOKEN.chainName}`}
      >
        {full ? XTASK_TOKEN.address : short(XTASK_TOKEN.address)}
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(XTASK_TOKEN.address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-white/90"
      >
        {copied ? "Copied ✓" : "Copy CA"}
      </button>
    </div>
  );
}
