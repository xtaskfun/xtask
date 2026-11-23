import Image from "next/image";

/** Illustration for the hero: floating task cards and a "claimed" toast. */
export default function HeroVisual() {
  return (
    <div className="relative mx-auto h-[330px] w-full max-w-[400px] origin-top scale-[0.92] select-none sm:scale-100 md:h-[440px] md:max-w-[440px]" aria-hidden>
      {/* Glow behind */}
      <div className="absolute inset-10 rounded-full bg-rainbow opacity-30 blur-[90px]" />

      {/* Back card */}
      <div className="glass absolute right-0 top-6 w-[78%] rotate-6 p-5 opacity-70 animate-float-delayed">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-6 w-6 rounded-full bg-white/10" /> @yourproject
        </div>
        <div className="mt-3 h-3 w-3/4 rounded bg-white/15" />
        <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
        <div className="mt-4 h-1.5 rounded-full bg-white/10">
          <div className="h-full w-2/5 rounded-full bg-rainbow" />
        </div>
      </div>

      {/* Front card */}
      <div className="border-rainbow absolute left-0 top-20 w-[86%] -rotate-3 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-black ring-1 ring-white/15">
              <Image src="/logo.png" alt="" width={24} height={24} />
            </span>
            <span className="text-sm text-muted">@Xtaskfun</span>
          </div>
          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">Project</span>
        </div>
        <div className="font-display mt-4 text-xl font-bold">Follow + Like @Xtaskfun</div>
        <div className="mt-3 flex gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">👤 Follow</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">❤️ Like</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[72%] rounded-full bg-rainbow-loop bg-[length:200%_100%] animate-shimmer" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>72 / 100 slots</span>
          <span>28 left</span>
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
          <div>
            <div className="text-xs text-muted">Reward</div>
            <div className="font-display text-2xl font-bold text-accent">0.095 USDG</div>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Claim</span>
        </div>
      </div>

      {/* Toast */}
      <div className="glass absolute -bottom-2 right-2 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl animate-float-delayed md:bottom-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-rainbow text-base font-black text-black">✓</span>
        <div>
          <div className="text-sm font-semibold">Reward claimed</div>
          <div className="text-xs text-accent">+0.095 USDG</div>
        </div>
      </div>
    </div>
  );
}
