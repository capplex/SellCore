import Link from "next/link";

export type LegalSection = {
  title: string;
  body: React.ReactNode;
};

export function LegalPage({
  title,
  intro,
  updated = "20 September 2026",
  sections,
}: {
  title: string;
  intro: string;
  updated?: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:py-20">
      <Link href="/" className="text-sm text-sc-secondary hover:text-white">← Back to SellCore</Link>
      <div className="mt-8 border-b border-sc-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-sc-secondary">{intro}</p>
        <p className="mt-4 text-xs text-sc-muted">Last updated: {updated}</p>
      </div>
      <div className="divide-y divide-sc-border">
        {sections.map((section) => (
          <section key={section.title} className="py-8">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-4 text-sm leading-7 text-sc-secondary">{section.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
