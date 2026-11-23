import Link from "next/link";
import Logo from "./Logo";
import { GITHUB_URL, X_HANDLE, X_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-24 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} xtask.fun — Engage on X, earn onchain.</p>
        <div className="flex items-center gap-4">
          <a href={X_URL} target="_blank" rel="noreferrer noopener" aria-label={`@${X_HANDLE} on X`} title={`@${X_HANDLE}`} className="hover:text-white">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="hover:text-white">GitHub</a>
          <Link href="/docs" className="hover:text-white">Docs</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
