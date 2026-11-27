"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSwitchChain } from "wagmi";
import { ESCROWS } from "@/lib/escrow";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Wallet button powered by Privy: "Connect Wallet", or the connected address with a menu. */
export default function ConnectWallet({ full = false }: { full?: boolean }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address, chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!ready) return <div className={`h-10 animate-pulse rounded-full bg-white/10 ${full ? "w-full" : "w-36"}`} />;

  if (!authenticated || !address) {
    return (
      <button onClick={login} className={`btn-primary h-10 ${full ? "w-full" : ""}`}>
        Connect Wallet
      </button>
    );
  }

  const live = ESCROWS.map((e) => e.chain);
  const known = live.find((c) => c.id === chain?.id);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost h-10 gap-2 px-3">
        <span className={`h-2 w-2 rounded-full ${known ? "bg-accent" : "bg-yellow-400"}`} />
        <span className="hidden text-muted sm:inline">{known?.name.replace(" Chain", "") ?? chain?.name ?? "Unknown"}</span>
        <span className="font-mono">{short(address)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl p-1 text-sm shadow-xl">
          <div className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-muted">Network</div>
          {live.map((c) => (
            <button
              key={c.id}
              disabled={isPending}
              onClick={() => switchChain({ chainId: c.id })}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/5"
            >
              {c.name}
              {chain?.id === c.id && <span className="text-accent">✓</span>}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/5"
          >
            {copied ? "Copied ✓" : "Copy address"}
          </button>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-red-400 hover:bg-white/5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
