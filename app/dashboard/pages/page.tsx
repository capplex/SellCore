import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard-context";
import { createPageBuilderAction } from "@/lib/page-actions";
import { EmptyState } from "@/components/ui/empty-state";

export default async function Pages(){
  const ctx=await getDashboardContext();
  if(!ctx.store)return <EmptyState title="No store"/>;
  const {data}=await ctx.db.from("pages").select("*").eq("store_id",ctx.store.id).order("created_at");

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Pages</h1>
        <p className="mt-1 text-sm text-sc-secondary">Build storefront pages from reusable sections, then publish when ready.</p>
      </div>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        {!data?.length?<EmptyState title="No custom pages"/>:data.map((p)=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sc-border bg-sc-card p-4">
          <div>
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-sc-muted">/{p.slug} · {p.status}</div>
          </div>
          <Link href={"/dashboard/pages/"+p.id} className="rounded-lg border border-sc-border px-3 py-2 text-sm">Edit page</Link>
        </div>)}
      </div>

      <form action={createPageBuilderAction} className="rounded-xl border border-sc-border bg-sc-card p-5">
        <input type="hidden" name="storeId" value={ctx.store.id}/>
        <h2 className="font-semibold">Create page</h2>
        <p className="mt-1 text-sm text-sc-secondary">Start a draft, then add sections in the visual editor.</p>
        <div className="mt-4 space-y-3">
          <input name="title" required placeholder="Page title"/>
          <input name="slug" pattern="[a-z0-9-]+" placeholder="page-slug"/>
          <button className="w-full rounded-lg bg-sc-red px-4 py-2 text-sm">Create & edit</button>
        </div>
      </form>
    </div>
  </>;
}
