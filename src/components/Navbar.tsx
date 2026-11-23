"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectWallet from "./ConnectWallet";
import Logo from "./Logo";
import XConnect from "./XConnect";
import { VERIFICATION_MODE } from "@/lib/site";

/** Simple line icons (24px viewBox) for the mobile bottom navigation. */
const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  tasks: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  leaderboard: <path d="M8 21V11M12 21V5M16 21v-7M4 21h16" />,
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/create", label: "Create", icon: "create" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
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
            <span className="transition">
              <NavIcon name={n.icon} />
            </span>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
