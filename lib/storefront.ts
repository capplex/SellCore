import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uniqueById } from "@/lib/utils";
import type { StoreSection } from "@/components/dashboard/section-builder";

function themeSettingsRecord(store: Record<string,unknown>) {
  const ts=Array.isArray(store.theme_settings)?store.theme_settings[0]:store.theme_settings;
  return (ts as Record<string,unknown>|null) ?? {};
}

export function activeCustomTheme(store: Record<string,unknown>) {
  const ts=themeSettingsRecord(store);
  const raw=ts.merchant_themes;
  const theme=Array.isArray(raw)?raw[0]:raw;
  return (theme as Record<string,unknown>|null) ?? null;
}

export async function getPublicStoreBySlug(slug:string, preview=false){
  const db=createSupabaseAdminClient();
  let q=db.from("stores").select("*,store_settings(*),theme_settings(*,themes(*),merchant_themes(*))").eq("slug",slug);
  if(!preview)q=q.eq("status","published");
  const {data}=await q.maybeSingle();
  if(!data)notFound();
  return data;
}

export async function getPublicStoreByHostname(hostname:string){
  const db=createSupabaseAdminClient();
  const {data:d}=await db.from("domains").select("store_id").eq("hostname",hostname).eq("status","verified").maybeSingle();
  if(!d)notFound();
  const {data}=await db.from("stores").select("*,store_settings(*),theme_settings(*,themes(*),merchant_themes(*))").eq("id",d.store_id).eq("status","published").maybeSingle();
  if(!data)notFound();
  return data;
}

export async function getStoreProducts(storeId:string,q?:string){
  const db=createSupabaseAdminClient();
  let query=db.from("products").select("id,name,slug,short_description,price_minor,currency,type,product_images(storage_path,alt_text,sort_order)").eq("store_id",storeId).eq("status","active").order("created_at",{ascending:false});
  if(q)query=query.or("name.ilike.%"+q.replace(/[,%]/g,"")+"%,description.ilike.%"+q.replace(/[,%]/g,"")+"%");
  return (await query).data??[];
}

export async function getStoreReviews(storeId:string){
  const db=createSupabaseAdminClient();
  const {data}=await db.from("reviews").select("id,rating,review_text,merchant_response,customers(name)").eq("store_id",storeId).eq("status","approved").order("created_at",{ascending:false}).limit(12);
  return uniqueById(data??[]);
}

export async function getPublicProduct(storeId:string,slug:string){
  const db=createSupabaseAdminClient();
  const {data}=await db.from("products").select("*,product_variants(*),product_images(*),product_categories(categories(*))").eq("store_id",storeId).eq("slug",slug).eq("status","active").maybeSingle();
  if(!data)notFound();
  const {data:reviews}=await db.from("reviews").select("id,rating,review_text,verified_purchase,merchant_response,created_at,customers(name)").eq("product_id",data.id).eq("status","approved").order("created_at",{ascending:false});
  return {...data,reviews:uniqueById(reviews??[])};
}

export function publicImageUrl(path:string){
  const db=createSupabaseAdminClient();
  return db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function themeVars(store:Record<string,unknown>){
  const ts=themeSettingsRecord(store);
  const custom=activeCustomTheme(store);
  const settings=((custom?.settings as Record<string,string>|undefined) ?? (ts.settings as Record<string,string>|undefined) ?? {});
  return {
    background:settings.background||"#050505",
    color:settings.text||"#F5F5F5",
    fontFamily:settings.font||"Manrope",
    "--accent":settings.accent||"#E50914",
    "--radius":settings.radius||"8px",
    "--store-bg":settings.background||"#050505",
  } as React.CSSProperties;
}

export function customThemeCss(store:Record<string,unknown>){
  const custom=activeCustomTheme(store);
  return typeof custom?.custom_css==="string"?custom.custom_css:"";
}

export function storefrontSections(store:Record<string,unknown>, preview=false):StoreSection[]|null{
  const custom=activeCustomTheme(store);
  if(!custom)return null;
  const layout=(preview?custom.draft_layout:custom.published_layout) as {home?:StoreSection[]}|undefined;
  const sections=layout?.home;
  return Array.isArray(sections)&&sections.length?sections:null;
}
