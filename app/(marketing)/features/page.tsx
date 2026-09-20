import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Code2, CreditCard, Globe2, LayoutTemplate, PackageCheck, ShieldCheck } from "lucide-react";
import { marketingFeatures } from "@/lib/marketing-features";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore SellCore storefronts, checkout, digital fulfillment, analytics, domains, developer tools and customer experience.",
};

const icons = [LayoutTemplate, PackageCheck, CreditCard, BarChart3, Globe2, Code2, ShieldCheck];

export default function FeaturesPage() {
  return <main>
    <section className="border-b border-sc-border">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">SellCore platform</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Everything between your first product and a fulfilled order.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-sc-secondary">Build the storefront, validate checkout, deliver digital inventory and run the operation from one tenant-safe workspace.</p>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketingFeatures.map((feature, index) => {
          const Icon = icons[index];
          return <Link key={feature.slug} href={`/features/${feature.slug}`} className="group rounded-2xl border border-sc-border bg-sc-card p-6 transition hover:border-[#4a2427] hover:bg-[#130b0c]">
            <Icon size={22} className="text-sc-red"/>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-sc-muted">{feature.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-sc-secondary">{feature.summary}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#ff8085]">Explore feature <ArrowRight size={15} className="transition group-hover:translate-x-1"/></span>
          </Link>;
        })}
      </div>
    </section>

    <section className="border-y border-sc-border bg-[#080808]">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">One operating model</p>
        <h2 className="mt-3 text-3xl font-semibold">A connected path from catalog to customer.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["01", "Build", "Create products, variants, pages and a branded storefront."],
            ["02", "Sell", "Validate server-owned pricing and open verified Stripe checkout."],
            ["03", "Deliver", "Reserve inventory and run automatic or merchant-managed fulfillment."],
            ["04", "Improve", "Use orders, reviews and analytics to strengthen the store."],
          ].map(([number, title, copy]) => <div key={number} className="rounded-xl border border-sc-border bg-sc-card p-5">
            <span className="text-xs font-semibold text-sc-red">{number}</span>
            <h3 className="mt-6 text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-sc-secondary">{copy}</p>
          </div>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="rounded-2xl border border-[#3a1518] bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,.18),transparent_38%),#0a0a0a] p-8 md:p-12">
        <h2 className="max-w-2xl text-3xl font-semibold">Start with a real store, then add capability as you grow.</h2>
        <p className="mt-3 max-w-2xl text-sc-secondary">The Free plan operates a published store within its limits. Paid plans expand capacity and selected platform capabilities.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/register" className="rounded-lg bg-sc-red px-5 py-3 font-medium">Start selling</Link><Link href="/pricing" className="rounded-lg border border-sc-border px-5 py-3 font-medium">Compare plans</Link></div>
      </div>
    </section>
  </main>;
}
