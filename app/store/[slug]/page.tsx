import { getPublicStoreBySlug,getStoreProducts,getStoreReviews,storefrontSections } from "@/lib/storefront";
import { StoreShell } from "@/components/storefront/store-shell";
import { ProductCard } from "@/components/storefront/product-card";
import { TrackView } from "@/components/storefront/track-view";
import { SectionRenderer } from "@/components/storefront/section-renderer";
import { storefrontBasePath } from "@/lib/storefront-routing";

export const dynamic="force-dynamic";

export default async function StoreHome({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{q?:string;preview?:string}>}){
  const {slug}=await params;
  const q=await searchParams;
  const preview=q.preview==="1";
  const store=await getPublicStoreBySlug(slug,preview);
  const [products,reviews]=await Promise.all([getStoreProducts(store.id,q.q),getStoreReviews(store.id)]);
  const basePath=await storefrontBasePath(slug);
  const sections=storefrontSections(store,preview);

  return <StoreShell store={store} basePath={basePath} preview={preview}>
    <TrackView storeSlug={slug}/>
    {sections
      ? <SectionRenderer sections={sections} store={store} products={products} reviews={reviews} basePath={basePath}/>
      : <>
          <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
            <p className="text-sm font-medium text-[var(--accent)]">DIGITAL STOREFRONT</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{store.name}</h1>
            {store.description&&<p className="mt-5 max-w-2xl text-lg opacity-60">{store.description}</p>}
            <form className="mt-8 max-w-xl"><input name="q" defaultValue={q.q} placeholder="Search products" className="border-white/10 bg-white/[.035]"/></form>
          </section>
          <section className="mx-auto max-w-7xl px-5">
            <div className="store-product-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(p=><ProductCard key={p.id} product={p} basePath={basePath}/>)}</div>
            {products.length===0&&<div className="rounded-[var(--radius)] border border-dashed border-white/10 p-12 text-center opacity-60">No published products found.</div>}
          </section>
        </>
    }
  </StoreShell>;
}
