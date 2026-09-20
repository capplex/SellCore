import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import type { StoreSection } from "@/components/dashboard/section-builder";
import type { StorefrontReview } from "@/lib/storefront";

function sectionHref(basePath: string, href: string) {
  return href.startsWith("/") && basePath ? `${basePath}${href}` : href;
}

export function SectionRenderer({
  sections,
  store,
  products,
  reviews,
  basePath,
}: {
  sections: StoreSection[];
  store: Record<string, unknown>;
  products: Record<string, unknown>[];
  reviews: StorefrontReview[];
  basePath: string;
}) {
  const description = typeof store.description === "string" ? store.description : "";
  return <>{sections.map((section) => {
    if (section.type === "hero") return <section key={section.id} className="store-hero mx-auto max-w-7xl px-5 py-16 md:py-24">
      {section.eyebrow && <p className="text-sm font-medium text-[var(--accent)]">{section.eyebrow}</p>}
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{section.heading || String(store.name)}</h1>
      {(section.text || description) && <p className="mt-5 max-w-2xl text-lg leading-8 opacity-65">{section.text || description}</p>}
      {section.buttonLabel && section.buttonHref && <Link href={sectionHref(basePath, section.buttonHref)} className="mt-7 inline-flex rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white">{section.buttonLabel}</Link>}
    </section>;

    if (section.type === "rich_text") return <section key={section.id} className="mx-auto max-w-4xl px-5 py-10">
      {section.heading && <h2 className="text-3xl font-semibold tracking-tight">{section.heading}</h2>}
      {section.text && <div className="mt-4 whitespace-pre-wrap leading-7 opacity-70">{section.text}</div>}
    </section>;

    if (section.type === "products") return <section key={section.id} className="mx-auto max-w-7xl px-5 py-12">
      <h2 className="mb-6 text-2xl font-semibold">{section.heading || "Products"}</h2>
      <div className="store-product-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={String(p.id)} product={p} basePath={basePath}/>)}</div>
      {products.length === 0 && <div className="rounded-[var(--radius)] border border-dashed border-white/10 p-12 text-center opacity-60">No published products found.</div>}
    </section>;

    if (section.type === "reviews") return <section key={section.id} className="mx-auto max-w-5xl px-5 py-12">
      <h2 className="mb-6 text-2xl font-semibold">{section.heading || "Reviews"}</h2>
      <div className="grid gap-3 md:grid-cols-2">{reviews.length ? reviews.map((review) => <article key={review.id} className="rounded-[var(--radius)] border border-white/10 p-5">
        <div className="text-sm font-medium">{review.rating}/5</div>
        <p className="mt-3 opacity-70">{review.review_text}</p>
        {review.merchant_response && <div className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm opacity-70"><b>Merchant:</b> {review.merchant_response}</div>}
      </article>) : <div className="rounded-[var(--radius)] border border-white/10 p-6 opacity-60">No approved reviews yet.</div>}</div>
    </section>;

    if (section.type === "faq") return <section key={section.id} className="mx-auto max-w-4xl px-5 py-12">
      <h2 className="text-2xl font-semibold">{section.heading || "FAQ"}</h2>
      <div className="mt-6 divide-y divide-white/10 border-y border-white/10">{(section.items ?? []).map((item, index) => <div key={index} className="py-5"><h3 className="font-medium">{item.question}</h3><p className="mt-2 text-sm leading-6 opacity-65">{item.answer}</p></div>)}</div>
    </section>;

    if (section.type === "spacer") {
      const size = section.size === "lg" ? "h-24" : section.size === "sm" ? "h-6" : "h-12";
      return <div key={section.id} className={size}/>;
    }
    return null;
  })}</>;
}
