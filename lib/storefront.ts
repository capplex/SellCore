import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uniqueById } from "@/lib/utils";
import type { StoreSection } from "@/components/dashboard/section-builder";

export type StorefrontReview = {
  id: string;
  rating: number;
  review_text: string;
  merchant_response: string | null;
  customers: { name: string | null } | null;
};

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

function activeThemeSettings(store: Record<string, unknown>, preview: boolean) {
  const custom = activeCustomTheme(store);
  if (!custom || (!preview && custom.status !== "published")) return null;
  const settings = preview ? custom.settings : custom.published_settings;
  return (settings as Record<string, string> | null) ?? null;
}

function normalizeReview(review: Record<string, unknown>): StorefrontReview {
  const relation = Array.isArray(review.customers) ? review.customers[0] : review.customers;
  const customer = relation && typeof relation === "object"
    ? { name: typeof (relation as { name?: unknown }).name === "string" ? (relation as { name: string }).name : null }
    : null;

  return {
    id: String(review.id),
    rating: Number(review.rating),
    review_text: String(review.review_text ?? ""),
    merchant_response: typeof review.merchant_response === "string" ? review.merchant_response : null,
    customers: customer,
  };
}

async function requireStorePreviewAccess(store: Record<string, unknown>) {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) notFound();

  const db = createSupabaseAdminClient();
  const { data: membership } = await db
    .from("merchant_members")
    .select("merchant_id")
    .eq("merchant_id", String(store.merchant_id))
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();
}

export async function getPublicStoreBySlug(slug:string, preview=false){
  const db=createSupabaseAdminClient();
  let q=db.from("stores").select("*,store_settings(*),theme_settings(*,themes(*),merchant_themes(*))").eq("slug",slug);
  if(!preview)q=q.eq("status","published");
  const {data}=await q.maybeSingle();
  if(!data)notFound();
  if(preview)await requireStorePreviewAccess(data);
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
  return uniqueById((data??[]).map((review)=>normalizeReview(review as Record<string, unknown>)));
}

export async function getPublicProduct(storeId:string,slug:string){
  const db=createSupabaseAdminClient();
  const {data}=await db.from("products").select("*,product_variants(*),product_images(*),product_categories(categories(*))").eq("store_id",storeId).eq("slug",slug).eq("status","active").maybeSingle();
  if(!data)notFound();
  const {data:reviews}=await db.from("reviews").select("id,rating,review_text,verified_purchase,merchant_response,created_at,customers(name)").eq("product_id",data.id).eq("status","approved").order("created_at",{ascending:false});
  return {
    ...data,
    reviews: uniqueById((reviews??[]).map((review)=>({
      ...normalizeReview(review as Record<string, unknown>),
      verified_purchase: Boolean(review.verified_purchase),
      created_at: String(review.created_at ?? ""),
    }))),
  };
}

export function publicImageUrl(path:string){
  const db=createSupabaseAdminClient();
  return db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function themeVars(store:Record<string,unknown>, preview=false){
  const ts=themeSettingsRecord(store);
  const settings=activeThemeSettings(store, preview) ?? (ts.settings as Record<string,string>|undefined) ?? {};
  const fontFamilies:Record<string,string>={
    Manrope:'var(--font-manrope), "Segoe UI", sans-serif',
    "Space Grotesk":'var(--font-space-grotesk), var(--font-manrope), "Segoe UI", sans-serif',
    Sora:'var(--font-sora), var(--font-manrope), "Segoe UI", sans-serif',
    "Plus Jakarta Sans":'var(--font-plus-jakarta-sans), var(--font-manrope), "Segoe UI", sans-serif',
    "system-ui":'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };
  const selectedFont=settings.font||"Manrope";
  return {
    backgroundColor:settings.background||"#050505",
    color:settings.text||"#F5F5F5",
    fontFamily:fontFamilies[selectedFont]||fontFamilies.Manrope,
    "--accent":settings.accent||"#E50914",
    "--radius":settings.radius||"8px",
    "--store-bg":settings.background||"#050505",
  } as React.CSSProperties;
}

export function storefrontThemeSettings(store: Record<string, unknown>, preview=false) {
  const ts=themeSettingsRecord(store);
  return activeThemeSettings(store, preview) ?? (ts.settings as Record<string,string>|undefined) ?? {};
}

export function storefrontThemeSlug(store: Record<string, unknown>) {
  const ts=themeSettingsRecord(store);
  const raw=ts.themes;
  const theme=Array.isArray(raw)?raw[0]:raw;
  return typeof (theme as {slug?:unknown}|null)?.slug==="string" ? (theme as {slug:string}).slug : "dark";
}

export function customThemeCss(store:Record<string,unknown>, preview=false){
  const custom=activeCustomTheme(store);
  if(!custom||(custom.status!=="published"&&!preview))return "";
  const css=preview?custom.custom_css:custom.published_custom_css;
  return typeof css==="string"?css.replace(/<\/style/gi,"<\\/style"):"";
}

export function storefrontSections(store:Record<string,unknown>, preview=false):StoreSection[]|null{
  const custom=activeCustomTheme(store);
  if(!custom||(custom.status!=="published"&&!preview))return null;
  const layout=(preview?custom.draft_layout:custom.published_layout) as {home?:StoreSection[]}|undefined;
  const sections=layout?.home;
  return Array.isArray(sections)&&sections.length?sections:null;
}
