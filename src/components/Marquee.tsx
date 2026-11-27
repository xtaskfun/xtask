const ITEMS = [
  "Follow",
  "Like",
  "Repost",
  "Reply",
  "Quote",
  "USDC",
  "USDG",
  "ETH",
  "Base",
  "Claim instantly",
];

/** Endless strip of what you can do on xtask.fun. */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="glass inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-rainbow" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
