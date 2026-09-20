"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseSections(raw: FormDataEntryValue | null) {
  const parsed = JSON.parse(String(raw || "[]"));
  if (!Array.isArray(parsed)) throw new Error("INVALID_PAGE_CONTENT");
  return parsed.slice(0, 100);
}

function cleanSlug(value: string) {
  const slug=value.toLowerCase().trim().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");
  if(!slug)throw new Error("INVALID_PAGE_SLUG");
  return slug.slice(0,80);
}

async function ownedPage(pageId:string,merchantId:string){
  const db=createSupabaseAdminClient();
  const {data,error}=await db.from("pages").select("*,stores!inner(merchant_id,slug)").eq("id",pageId).eq("stores.merchant_id",merchantId).maybeSingle();
  if(error||!data)throw new Error("PAGE_NOT_FOUND");
  return {db,page:data};
}

export async function createPageBuilderAction(formData:FormData){
  const {merchantId}=await requireMerchant();
  const storeId=String(formData.get("storeId"));
  const db=createSupabaseAdminClient();
  const {data:store}=await db.from("stores").select("id").eq("id",storeId).eq("merchant_id",merchantId).maybeSingle();
  if(!store)throw new Error("STORE_NOT_FOUND");
  const title=String(formData.get("title")||"Untitled page").trim().slice(0,120);
  const slug=cleanSlug(String(formData.get("slug")||title));
  const {data:page,error}=await db.from("pages").insert({
    store_id:storeId,
    title,
    slug,
    content:[{id:"intro",type:"rich_text",heading:title,text:""}],
    status:"draft",
  }).select("id").single();
  if(error||!page)throw new Error(error?.message||"PAGE_CREATE_FAILED");
  redirect("/dashboard/pages/"+page.id);
}

export async function updatePageBuilderAction(formData:FormData){
  const {merchantId}=await requireMerchant();
  const pageId=String(formData.get("pageId"));
  const {db,page}=await ownedPage(pageId,merchantId);
  const title=String(formData.get("title")||page.title).trim().slice(0,120);
  const slug=cleanSlug(String(formData.get("slug")||page.slug));
  const status=String(formData.get("status"))==="active"?"active":"draft";
  const content=parseSections(formData.get("content"));
  const {error}=await db.from("pages").update({
    title,
    slug,
    content,
    status,
    seo_title:String(formData.get("seoTitle")||"").trim()||null,
    seo_description:String(formData.get("seoDescription")||"").trim()||null,
    updated_at:new Date().toISOString(),
  }).eq("id",pageId);
  if(error)throw new Error(error.message);
  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/pages/"+pageId);
  revalidatePath("/store","layout");
}

export async function deletePageBuilderAction(formData:FormData){
  const {merchantId}=await requireMerchant();
  const pageId=String(formData.get("pageId"));
  const {db}=await ownedPage(pageId,merchantId);
  await db.from("pages").delete().eq("id",pageId);
  revalidatePath("/dashboard/pages");
  revalidatePath("/store","layout");
  redirect("/dashboard/pages");
}
