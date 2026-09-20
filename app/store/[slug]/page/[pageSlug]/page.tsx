import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicStoreBySlug, getStoreProducts, getStoreReviews } from "@/lib/storefront";
import { StoreShell } from "@/components/storefront/store-shell";
import { SectionRenderer } from "@/components/storefront/section-renderer";
import { storefrontBasePath } from "@/lib/storefront-routing";
import type { StoreSection } from "@/components/dashboard/section-builder";

export default async function StorePage({
  params,
  searchParams,
}:{
  params:Promise<{slug:string;pageSlug:string}>;
  searchParams:Promise<{preview?:string}>;
}){
  const {slug,pageSlug}=await params;
  const q=await searchParams;
  const preview=q.preview==="1";
  const store=await getPublicStoreBySlug(slug,preview);
  const db=createSupabaseAdminClient();

  let pageQuery=db.from("pages").select("*").eq("store_id",store.id).eq("slug",pageSlug);
  if(!preview)pageQuery=pageQuery.eq("status","active");
  const {data:page}=await pageQuery.maybeSingle();
  if(!page)notFound();

  const [products,reviews]=await Promise.all([getStoreProducts(store.id),getStoreReviews(store.id)]);
  const basePath=await storefrontBasePath(slug);
  const sections=(page.content??[]) as StoreSection[];

  return <StoreShell store={store} basePath={basePath}>
    <SectionRenderer sections={sections} store={store} products={products} reviews={reviews} basePath={basePath}/>
  </StoreShell>;
}
