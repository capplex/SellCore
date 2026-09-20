import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { storeAssetPublicUrl } from "@/lib/storefront";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const db=createSupabaseAdminClient();
  const {data:store}=await db.from("stores").select("name,description,store_settings(*)").eq("slug",slug).maybeSingle();
  if(!store)return {};
  const settings=Array.isArray(store.store_settings)?store.store_settings[0]:store.store_settings;
  const favicon=settings?.favicon_path?storeAssetPublicUrl(settings.favicon_path):undefined;
  const social=settings?.og_image_path?storeAssetPublicUrl(settings.og_image_path):(settings?.logo_path?storeAssetPublicUrl(settings.logo_path):undefined);

  return {
    title:settings?.title||store.name,
    description:settings?.meta_description||store.description||undefined,
    icons:favicon?{icon:favicon,shortcut:favicon,apple:favicon}:undefined,
    openGraph:social?{images:[social]}:undefined,
  };
}

export default function StoreLayout({children}:{children:React.ReactNode}){
  return children;
}
