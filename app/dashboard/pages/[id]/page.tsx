import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { SectionBuilder, type StoreSection } from "@/components/dashboard/section-builder";
import { deletePageBuilderAction, updatePageBuilderAction } from "@/lib/page-actions";
import { storefrontUrl } from "@/lib/storefront-routing";

export default async function PageEditor({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const ctx=await getDashboardContext();
  if(!ctx.store)notFound();

  const {data:page}=await ctx.db.from("pages").select("*").eq("id",id).eq("store_id",ctx.store.id).maybeSingle();
  if(!page)notFound();

  const sections=(page.content??[]) as StoreSection[];
  const preview=storefrontUrl(ctx.store.slug)+"/page/"+page.slug+"?preview=1";

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href="/dashboard/pages" className="text-sm text-sc-secondary">← Pages</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {page.title}</h1>
        <p className="mt-1 text-sm text-sc-secondary">Build the page from sections and choose when it becomes public.</p>
      </div>
      <Link href={preview} className="rounded-lg border border-sc-border px-4 py-2 text-sm">Preview page</Link>
    </div>

    <form action={updatePageBuilderAction} className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="pageId" value={page.id}/>
      <div className="space-y-5">
        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Page sections</h2>
          <p className="mt-1 text-sm text-sc-secondary">Add, remove and reorder sections.</p>
          <div className="mt-4"><SectionBuilder name="content" initialSections={sections}/></div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Page settings</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Title<input name="title" defaultValue={page.title} required/></label>
            <label className="text-sm">Slug<input name="slug" defaultValue={page.slug} required pattern="[a-z0-9-]+"/></label>
            <label className="text-sm">Status<select name="status" defaultValue={page.status}><option value="draft">Draft</option><option value="active">Published</option></select></label>
            <label className="text-sm">SEO title<input name="seoTitle" defaultValue={page.seo_title??""}/></label>
            <label className="text-sm">SEO description<textarea name="seoDescription" defaultValue={page.seo_description??""} rows={4}/></label>
            <button className="mt-2 rounded-lg bg-sc-red px-4 py-2.5 text-sm font-medium">Save page</button>
          </div>
        </section>

        <section className="rounded-xl border border-red-950 bg-[#100708] p-5">
          <h2 className="font-semibold">Delete page</h2>
          <p className="mt-2 text-sm text-sc-secondary">This permanently removes the page from this store.</p>
          <form action={deletePageBuilderAction} className="mt-4">
            <input type="hidden" name="pageId" value={page.id}/>
            <button className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300">Delete page</button>
          </form>
        </section>
      </aside>
    </form>
  </>;
}
