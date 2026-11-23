/** Slow-moving rainbow light behind every page, plus a fine grain so flat blacks feel less flat. */
export default function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[10%] -top-[20%] h-[55vh] w-[55vw] animate-aurora rounded-full bg-[#b300ff] opacity-[0.16] blur-[120px]" />
      <div className="absolute -right-[10%] top-[10%] h-[50vh] w-[45vw] animate-aurora-slow rounded-full bg-[#00f0ff] opacity-[0.12] blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[25%] h-[45vh] w-[50vw] animate-aurora rounded-full bg-[#ff8a00] opacity-[0.10] blur-[130px] [animation-delay:-8s]" />
      <div className="absolute inset-0 bg-grid opacity-60 [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="grain absolute inset-0 opacity-[0.06] mix-blend-overlay" />
    </div>
  );
}
