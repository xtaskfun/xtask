"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectWallet from "./ConnectWallet";
import Logo from "./Logo";
import XConnect from "./XConnect";
import { VERIFICATION_MODE } from "@/lib/site";

export const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/create", label: "Create", icon: "➕" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export default function Navbar() {
  const path = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8 min-w-0">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive(path, n.href)
                      ? "bg-white/10 text-white shadow-[inset_0_-2px_0_0] shadow-white/40"
                      : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
          {VERIFICATION_MODE === "x" && <XConnect />}
          <ConnectWallet />
          </div>
        </div>
        <div className="h-px bg-rainbow opacity-30" />
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/70 backdrop-blur-xl md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
              isActive(path, n.href) ? "text-white [&>span]:scale-110" : "text-muted"
            }`}
          >
            <span className="text-lg transition">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
