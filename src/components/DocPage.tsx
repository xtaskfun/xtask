import type { ReactNode } from "react";

export type DocSection = { id: string; title: string; body: ReactNode };

/** Long-form page with a sticky table of contents (docs, terms). */
export default function DocPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  updated?: string;
  sections: DocSection[];
}) {
  return (
    <div className="py-12">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="mt-4 text-4xl font-bold md:text-5xl">{title}</h1>
      <div className="doc-body mt-4 max-w-2xl text-lg text-white/60">{intro}</div>
      {updated && <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>}

      <div className="mt-12 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-white">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="glass scroll-mt-24 p-6 md:p-8">
              <h2 className="text-2xl font-bold">{s.title}</h2>
              <div className="doc-body mt-4 space-y-4 text-white/70">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
