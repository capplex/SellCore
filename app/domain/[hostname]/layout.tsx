import type { Metadata } from "next";
import { getPublicStoreByHostname, storeAssetPublicUrl } from "@/lib/storefront";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{hostname:string}>}):Promise<Metadata>{
  const {hostname}=await params;
  const store=await getPublicStoreByHostname(decodeURIComponent(hostname));
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

export default function DomainStoreLayout({children}:{children:React.ReactNode}){
  return children;
}
