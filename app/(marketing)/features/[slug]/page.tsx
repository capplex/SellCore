import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getMarketingFeature, marketingFeatures } from "@/lib/marketing-features";

export function generateStaticParams() {
  return marketingFeatures.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const feature = getMarketingFeature((await params).slug);
  if (!feature) return {};
  return { title: feature.eyebrow, description: feature.summary };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const feature = getMarketingFeature((await params).slug);
  if (!feature) notFound();

  const related = marketingFeatures.filter((item) => item.slug !== feature.slug).slice(0, 3);
  return <main>
    <section className="relative overflow-hidden border-b border-sc-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(229,9,20,.15),transparent_34%)]"/>
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:py-28">
        <Link href="/features" className="text-sm text-sc-secondary hover:text-white">Features / {feature.eyebrow}</Link>
        <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{feature.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-sc-secondary">{feature.summary}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-sc-red px-5 py-3 font-medium">Start selling <ArrowRight size={16}/></Link><Link href="/docs" className="rounded-lg border border-sc-border bg-black/30 px-5 py-3 font-medium">Read the docs</Link></div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.75fr_1.25fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">What it does</p>
        <h2 className="mt-3 text-3xl font-semibold">Built into the same commerce core.</h2>
        <p className="mt-4 leading-7 text-sc-secondary">{feature.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {feature.highlights.map((item) => <article key={item.title} className="rounded-xl border border-sc-border bg-sc-card p-5">
          <Check size={18} className="text-sc-red"/>
          <h3 className="mt-5 font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-sc-secondary">{item.description}</p>
        </article>)}
      </div>
    </section>

    <section className="border-y border-sc-border bg-[#080808]">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">How it works</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {feature.steps.map((step, index) => <article key={step.title} className="rounded-xl border border-sc-border bg-sc-card p-6">
            <span className="text-sm font-semibold text-sc-red">0{index + 1}</span>
            <h2 className="mt-10 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-sc-secondary">{step.description}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">Keep exploring</p><h2 className="mt-3 text-3xl font-semibold">More of the SellCore platform.</h2></div><Link href="/features" className="text-sm text-[#ff8085]">View every feature →</Link></div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{related.map((item) => <Link key={item.slug} href={`/features/${item.slug}`} className="rounded-xl border border-sc-border bg-sc-card p-5 transition hover:border-[#4a2427]"><p className="text-xs font-semibold uppercase tracking-wider text-sc-muted">{item.eyebrow}</p><h3 className="mt-3 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-sc-secondary">{item.summary}</p></Link>)}</div>
    </section>
  </main>;
}
