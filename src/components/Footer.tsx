import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-24 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} xtask.fun — Engage on X, earn onchain.</p>
        <div className="flex gap-4">
          <a href="https://x.com/xtaskfun" target="_blank" rel="noreferrer" className="hover:text-white">X / Twitter</a>
          <a href="#" className="hover:text-white">Docs</a>
          <a href="#" className="hover:text-white">Terms</a>
        </div>
      </div>
    </footer>
  );
}
