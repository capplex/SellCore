import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { StoreSection } from "@/components/dashboard/section-builder";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { CartClient } from "@/components/storefront/cart-client";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionRenderer } from "@/components/storefront/section-renderer";
import { StoreShell } from "@/components/storefront/store-shell";
import { TrackView } from "@/components/storefront/track-view";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getPublicProduct,
  getPublicStoreByHostname,
  getStoreProducts,
  getStoreReviews,
  publicImageUrl,
  storefrontSections,
} from "@/lib/storefront";
import type { StorefrontReview } from "@/lib/storefront";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomDomain({
  params,
  searchParams,
}: {
  params: Promise<{ hostname: string; path?: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { hostname, path = [] } = await params;
  const query = await searchParams;
  const store = await getPublicStoreByHostname(decodeURIComponent(hostname));
  const basePath = "";

  if (path.length === 0) {
    const [products, reviews] = await Promise.all([
      getStoreProducts(store.id, query.q),
      getStoreReviews(store.id),
    ]);
    const sections = storefrontSections(store);

    return <StoreShell store={store} basePath={basePath}>
      <TrackView storeSlug={store.slug}/>
      {sections
        ? <SectionRenderer sections={sections} store={store} products={products} reviews={reviews} basePath={basePath}/>
        : <>
            <section className="store-hero mx-auto max-w-7xl px-5 py-20">
              <p className="text-sm font-medium text-[var(--accent)]">DIGITAL STOREFRONT</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight">{store.name}</h1>
              {store.description && <p className="mt-4 max-w-2xl opacity-60">{store.description}</p>}
              <form className="mt-8 max-w-xl"><input name="q" defaultValue={query.q} placeholder="Search products" className="border-white/10 bg-white/[.035]"/></form>
            </section>
            <section className="store-product-grid mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} basePath={basePath}/>)}
            </section>
          </>}
    </StoreShell>;
  }

  if (path[0] === "cart") {
    return <StoreShell store={store} basePath={basePath}>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="mb-6 text-3xl font-semibold">Cart</h1>
        <CartClient storeSlug={store.slug}/>
      </section>
    </StoreShell>;
  }

  if (path[0] === "product" && path[1]) {
    const product = await getPublicProduct(store.id, path[1]);
    const firstImage = product.product_images?.sort(
      (left: { sort_order: number }, right: { sort_order: number }) => left.sort_order - right.sort_order,
    )[0];

    return <StoreShell store={store} basePath={basePath}>
      <TrackView storeSlug={store.slug} productId={product.id}/>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[var(--radius)] border border-white/10 bg-white/[.025]">
          {firstImage
            ? <Image src={publicImageUrl(firstImage.storage_path)} alt={firstImage.alt_text || product.name} width={1200} height={900} className="h-full w-full object-cover"/>
            : <div className="aspect-[4/3]"/>}
        </div>
        <div className="lg:py-6">
          <div className="text-xs uppercase opacity-50">{product.type.replaceAll("_", " ")}</div>
          <h1 className="mt-3 text-4xl font-semibold">{product.name}</h1>
          <div className="mt-4 text-xl font-semibold">{formatMoney(product.price_minor, product.currency)}</div>
          <p className="mt-6 whitespace-pre-wrap leading-7 opacity-65">{product.description}</p>
          <div className="mt-8 max-w-md">
            <AddToCart
              basePath={basePath}
              storeSlug={store.slug}
              productId={product.id}
              variants={(product.product_variants ?? []).filter((variant: { active: boolean }) => variant.active).map((variant: { id: string; name: string; price_minor: number | null }) => ({ id: variant.id, name: variant.name, priceMinor: variant.price_minor, currency: product.currency }))}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <div className="mt-5 space-y-3">
          {product.reviews.length === 0
            ? <div className="rounded-[var(--radius)] border border-white/10 p-6 opacity-60">No approved reviews yet.</div>
            : product.reviews.map((review: StorefrontReview & { verified_purchase: boolean }) => <article key={review.id} className="rounded-[var(--radius)] border border-white/10 p-5">
                <div className="text-sm font-medium">{review.rating}/5 {review.verified_purchase && <span className="ml-2 text-[var(--accent)]">Verified purchase</span>}</div>
                <p className="mt-3 opacity-70">{review.review_text}</p>
                {review.merchant_response && <div className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm opacity-70"><b>Merchant:</b> {review.merchant_response}</div>}
              </article>)}
        </div>
      </section>
    </StoreShell>;
  }

  if (path[0] === "page" && path[1]) {
    const db = createSupabaseAdminClient();
    const { data: page } = await db
      .from("pages")
      .select("*")
      .eq("store_id", store.id)
      .eq("slug", path[1])
      .eq("status", "active")
      .maybeSingle();
    if (!page) notFound();

    const [products, reviews] = await Promise.all([
      getStoreProducts(store.id),
      getStoreReviews(store.id),
    ]);
    return <StoreShell store={store} basePath={basePath}>
      <SectionRenderer
        sections={(page.content ?? []) as StoreSection[]}
        store={store}
        products={products}
        reviews={reviews}
        basePath={basePath}
      />
    </StoreShell>;
  }

  if (path[0] === "account") {
    const appUrl = new URL("/account", process.env.NEXT_PUBLIC_APP_URL || "https://sellcore.shop");
    redirect(appUrl.toString());
  }

  notFound();
}
