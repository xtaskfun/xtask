"use client";

import { useState } from "react";
import { XTASK_TOKEN } from "@/lib/site";

/** Official $XTASK contract address with copy + explorer link. */
export default function TokenBadge() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass inline-flex max-w-full items-center gap-3 rounded-3xl py-1.5 pl-4 pr-1.5 text-sm">
      <span className="font-display text-rainbow font-bold">${XTASK_TOKEN.symbol}</span>
      <a
        href={XTASK_TOKEN.explorer}
        target="_blank"
        rel="noreferrer noopener"
        className="min-w-0 break-all font-mono text-xs text-white/70 hover:text-white"
        title={`${XTASK_TOKEN.address} on ${XTASK_TOKEN.chainName}`}
      >
        {XTASK_TOKEN.address}
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
        {copied ? "Copied" : "Copy CA"}
      </button>
    </div>
  );
}
