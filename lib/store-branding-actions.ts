"use server";

import { revalidatePath } from "next/cache";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const logoTypes:Record<string,string>={
  "image/png":"png",
  "image/jpeg":"jpg",
  "image/webp":"webp",
};
const faviconTypes:Record<string,string>={
  ...logoTypes,
  "image/x-icon":"ico",
  "image/vnd.microsoft.icon":"ico",
};

async function ownedStore(storeId:string,merchantId:string){
  const db=createSupabaseAdminClient();
  const {data,error}=await db.from("stores").select("id").eq("id",storeId).eq("merchant_id",merchantId).maybeSingle();
  if(error||!data)throw new Error("STORE_NOT_FOUND");
  return db;
}

async function uploadAsset(db:ReturnType<typeof createSupabaseAdminClient>,storeId:string,file:File,kind:"logo"|"favicon"){
  const allowed=kind==="logo"?logoTypes:faviconTypes;
  const ext=allowed[file.type];
  if(!ext)throw new Error(kind==="logo"?"LOGO_TYPE_UNSUPPORTED":"FAVICON_TYPE_UNSUPPORTED");
  const max=kind==="logo"?2*1024*1024:512*1024;
  if(file.size<=0||file.size>max)throw new Error(kind==="logo"?"LOGO_TOO_LARGE":"FAVICON_TOO_LARGE");

  const path=`${storeId}/${kind}.${ext}`;
  const {error}=await db.storage.from("store-assets").upload(path,file,{
    upsert:true,
    contentType:file.type,
    cacheControl:"3600",
  });
  if(error)throw error;
  return path;
}

export async function updateStoreBrandingAction(formData:FormData){
  const {merchantId}=await requireMerchant();
  const storeId=String(formData.get("storeId"));
  const db=await ownedStore(storeId,merchantId);
  const {data:current}=await db.from("store_settings").select("logo_path,favicon_path").eq("store_id",storeId).maybeSingle();

  let logoPath=current?.logo_path??null;
  let faviconPath=current?.favicon_path??null;

  const logo=formData.get("logo");
  const favicon=formData.get("favicon");

  if(formData.get("removeLogo")==="on"){
    if(logoPath)await db.storage.from("store-assets").remove([logoPath]).catch(()=>undefined);
    logoPath=null;
  }else if(logo instanceof File&&logo.size>0){
    logoPath=await uploadAsset(db,storeId,logo,"logo");
  }

  if(formData.get("removeFavicon")==="on"){
    if(faviconPath)await db.storage.from("store-assets").remove([faviconPath]).catch(()=>undefined);
    faviconPath=null;
  }else if(favicon instanceof File&&favicon.size>0){
    faviconPath=await uploadAsset(db,storeId,favicon,"favicon");
  }

  const {error}=await db.from("store_settings").upsert({
    store_id:storeId,
    logo_path:logoPath,
    favicon_path:faviconPath,
  },{onConflict:"store_id"});
  if(error)throw error;

  revalidatePath("/dashboard/settings");
  revalidatePath("/store","layout");
}
