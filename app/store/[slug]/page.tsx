import { getPublicStoreBySlug,getStoreProducts,getStoreReviews,storefrontSections, storefrontThemeSettings, storefrontThemeSlug } from "@/lib/storefront";
import { StoreShell } from "@/components/storefront/store-shell";
import { ProductCard } from "@/components/storefront/product-card";
import { TrackView } from "@/components/storefront/track-view";
import { SectionRenderer } from "@/components/storefront/section-renderer";
import { storefrontBasePath } from "@/lib/storefront-routing";

export const dynamic="force-dynamic";

export default async function StoreHome({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{q?:string;preview?:string;theme?:string}>}){
  const {slug}=await params;
  const q=await searchParams;
  const preview=q.preview==="1";
  const store=await getPublicStoreBySlug(slug,preview,q.theme);
  const [products,reviews]=await Promise.all([getStoreProducts(store.id,q.q),getStoreReviews(store.id)]);
  const basePath=await storefrontBasePath(slug);
  const sections=storefrontSections(store,preview);
  const themeSettings=storefrontThemeSettings(store,preview);
  const theme=themeSettings.stylePreset||storefrontThemeSlug(store);

  return <StoreShell store={store} basePath={basePath} preview={preview}>
    <TrackView storeSlug={slug}/>
    {sections
      ? <SectionRenderer sections={sections} store={store} products={products} reviews={reviews} basePath={basePath}/>
      : <>
          <section className="store-hero mx-auto max-w-7xl px-5 py-16 md:py-24">
            <div className="store-hero-copy">
            <p className="store-hero-eyebrow text-sm font-medium text-[var(--accent)]">{theme==="technical"?"// DIGITAL CATALOG":theme==="editorial"?"THE COLLECTION":"DIGITAL STOREFRONT"}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{store.name}</h1>
            {store.description&&<p className="mt-5 max-w-2xl text-lg opacity-60">{store.description}</p>}
            <form className="mt-8 max-w-xl"><input name="q" defaultValue={q.q} placeholder="Search products" className="border-white/10 bg-white/[.035]"/></form>
            </div>
            {(theme==="editorial"||theme==="modern"||theme==="technical")&&<div className="store-hero-art" aria-hidden="true"><span>{theme==="editorial"?"THE COLLECTION":theme==="technical"?"01 / SYSTEM ONLINE":"Discover more"}</span></div>}
          </section>
          <section className="mx-auto max-w-7xl px-5">
            <div className="store-section-heading"><h2>{theme==="editorial"?"The edit":theme==="technical"?"CATALOG / 01":"Explore products"}</h2><span>{products.length} {products.length===1?"item":"items"}</span></div>
            <div className="store-product-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(p=><ProductCard key={p.id} product={p} basePath={basePath}/>)}</div>
            {products.length===0&&<div className="rounded-[var(--radius)] border border-dashed border-white/10 p-12 text-center opacity-60"><span className="store-empty-symbol">{theme==="technical"?"[ 00 ]":theme==="editorial"?"COMING SOON":"✦"}</span><h3>{q.q?"No matching products":"The collection is coming soon"}</h3><p>{q.q?"Try another search.":"Check back soon for new products."}</p></div>}
          </section>
        </>
    }
  </StoreShell>;
}
