import { getPublicStoreBySlug } from "@/lib/storefront";
import { StoreShell } from "@/components/storefront/store-shell";
import { CartClient } from "@/components/storefront/cart-client";
import { storefrontBasePath } from "@/lib/storefront-routing";
export default async function CartPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const store=await getPublicStoreBySlug(slug);const basePath=await storefrontBasePath(slug);return <StoreShell store={store} basePath={basePath}><section className="mx-auto max-w-6xl px-5 py-12"><h1 className="mb-6 text-3xl font-semibold">Cart</h1><CartClient storeSlug={slug}/></section></StoreShell>}
