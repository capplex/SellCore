import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard-context";
import { createCategoryAction } from "@/lib/product-actions";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CategoriesPage() {
  const ctx = await getDashboardContext();
  if (!ctx.store) return <EmptyState title="Create a store first" />;
  const { data: categories } = await ctx.db.from("categories").select("id,name,slug,description,parent_id").eq("store_id", ctx.store.id).order("name");
  return <>
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Categories</h1><p className="mt-1 text-sm text-sc-secondary">Organize products for storefront discovery.</p></div><Link href="/dashboard/products" className="rounded-lg border border-sc-border px-3 py-2 text-sm">Back to products</Link></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="rounded-xl border border-sc-border bg-sc-card"><div className="divide-y divide-sc-border">{categories?.map(c=><div key={c.id} className="p-4"><div className="font-medium">{c.name}</div><div className="text-xs text-sc-secondary">/{c.slug}{c.description?` · ${c.description}`:""}</div></div>)}{!categories?.length&&<div className="p-8 text-sm text-sc-secondary">No categories yet.</div>}</div></section>
      <form action={createCategoryAction} className="h-fit rounded-xl border border-sc-border bg-sc-card p-5"><input type="hidden" name="storeId" value={ctx.store.id}/><h2 className="font-semibold">New category</h2><div className="mt-4 space-y-3"><input name="name" required placeholder="Category name"/><input name="slug" required pattern="[a-z0-9-]+" placeholder="category-slug"/><select name="parentId" defaultValue=""><option value="">No parent</option>{categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><textarea name="description" rows={4} placeholder="Description"/><button className="rounded-lg bg-sc-red px-4 py-2 text-sm">Create category</button></div></form>
    </div>
  </>;
}
