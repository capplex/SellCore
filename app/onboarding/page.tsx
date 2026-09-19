import { createFirstStoreAction } from "@/lib/onboarding";
import { Logo } from "@/components/logo";

export default function Onboarding(){
  return <main className="mx-auto max-w-xl px-5 py-16"><Logo/><div className="mt-10"><p className="text-sm font-semibold text-sc-red">FIRST STORE</p><h1 className="mt-2 text-3xl font-semibold">Give the store a place to start.</h1><p className="mt-3 text-sc-secondary">You can enter the dashboard immediately and configure payments before publishing.</p><form action={createFirstStoreAction} className="mt-8 space-y-4"><label className="block text-sm"><span className="mb-1 block text-sc-secondary">Store name</span><input name="storeName" required/></label><label className="block text-sm"><span className="mb-1 block text-sc-secondary">Store slug</span><input name="storeSlug" required pattern="[a-z0-9-]+" placeholder="my-store"/></label><label className="block text-sm"><span className="mb-1 block text-sc-secondary">Description</span><textarea name="description" rows={3}/></label><button className="rounded-lg bg-sc-red px-4 py-2 text-sm font-medium">Create store</button></form></div></main>
}
