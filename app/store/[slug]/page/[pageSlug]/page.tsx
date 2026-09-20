import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicStoreBySlug } from "@/lib/storefront";
import { StoreShell } from "@/components/storefront/store-shell";
import { storefrontBasePath } from "@/lib/storefront-routing";
export default async function StorePage({params}:{params:Promise<{slug:string;pageSlug:string}>}){const {slug,pageSlug}=await params;const store=await getPublicStoreBySlug(slug);const db=createSupabaseAdminClient();const {data:p}=await db.from("pages").select("*").eq("store_id",store.id).eq("slug",pageSlug).eq("status","active").maybeSingle();if(!p)notFound();const blocks=(p.content??[]) as {type:string;text?:string}[];const basePath=await storefrontBasePath(slug);return <StoreShell store={store} basePath={basePath}><article className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-4xl font-semibold">{p.title}</h1>{blocks.map((b,i)=><p key={i} className="mt-6 whitespace-pre-wrap leading-7 opacity-70">{b.text}</p>)}</article></StoreShell>}
