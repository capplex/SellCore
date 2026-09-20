import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard-context";
import { selectThemeAction } from "@/lib/merchant-actions";
import { activateMerchantThemeAction, createMerchantThemeAction, duplicateMerchantThemeAction } from "@/lib/theme-actions";
import { EmptyState } from "@/components/ui/empty-state";

export default async function Themes(){
  const ctx=await getDashboardContext();
  if(!ctx.store)return <EmptyState title="No store"/>;
  const [{data:themes},{data:current},{data:customThemes}]=await Promise.all([
    ctx.db.from("themes").select("*").eq("is_active",true).order("created_at"),
    ctx.db.from("theme_settings").select("*,themes(name,slug),merchant_themes(id,name,status)").eq("store_id",ctx.store.id).single(),
    ctx.db.from("merchant_themes").select("id,name,status,mode,source_platform,updated_at").eq("store_id",ctx.store.id).order("updated_at",{ascending:false}),
  ]);
  const activeCustomId=current?.custom_theme_id as string|undefined;

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Themes</h1>
        <p className="mt-1 text-sm text-sc-secondary">Use an official theme, build your own, or import a theme package.</p>
      </div>
      <Link href="/dashboard/themes/import" className="rounded-lg border border-sc-border px-4 py-2 text-sm">Import theme</Link>
    </div>

    <section className="mt-6 rounded-xl border border-sc-border bg-sc-card p-5">
      <h2 className="font-semibold">Create your own theme</h2>
      <p className="mt-1 text-sm text-sc-secondary">Start from the current storefront and edit sections, styles and custom CSS.</p>
      <form action={createMerchantThemeAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="storeId" value={ctx.store.id}/>
        <input name="name" required maxLength={80} placeholder="My custom theme" className="max-w-md"/>
        <button className="rounded-lg bg-sc-red px-4 py-2 text-sm font-medium">Create theme</button>
      </form>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">Your themes</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!customThemes?.length
          ? <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No custom themes yet">Create one above or import a supported theme package.</EmptyState></div>
          : customThemes.map((t)=><div key={t.id} className={"rounded-xl border p-5 "+(activeCustomId===t.id?"border-sc-red bg-[#130809]":"border-sc-border bg-sc-card")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="mt-1 text-xs uppercase text-sc-muted">{t.mode} · {t.status}{t.source_platform?" · "+t.source_platform:""}</div>
                </div>
                {activeCustomId===t.id&&<span className="rounded-full bg-[#351013] px-2 py-1 text-[10px] uppercase text-[#ff9ca1]">Active</span>}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={"/dashboard/themes/"+t.id} className="rounded-lg border border-sc-border px-3 py-2 text-sm">Edit</Link>
                <form action={activateMerchantThemeAction}><input type="hidden" name="themeId" value={t.id}/><button className="rounded-lg border border-sc-border px-3 py-2 text-sm">{activeCustomId===t.id?"Active":"Use theme"}</button></form>
                <form action={duplicateMerchantThemeAction}><input type="hidden" name="themeId" value={t.id}/><button className="rounded-lg border border-sc-border px-3 py-2 text-sm">Duplicate</button></form>
              </div>
            </div>)
        }
      </div>
    </section>

    <section className="mt-8">
      <h2 className="font-semibold">SellCore themes</h2>
      <p className="mt-1 text-sm text-sc-secondary">Official starting points. Selecting one switches away from a custom theme.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {themes?.map((t)=><form action={selectThemeAction} key={t.id} className={"rounded-xl border p-4 "+(!activeCustomId&&current?.theme_id===t.id?"border-sc-red bg-[#130809]":"border-sc-border bg-sc-card")}>
          <input type="hidden" name="storeId" value={ctx.store.id}/>
          <input type="hidden" name="themeId" value={t.id}/>
          <div className="font-medium">{t.name}</div>
          <p className="mt-2 min-h-16 text-xs leading-5 text-sc-secondary">{t.description}</p>
          <div className="mt-3 text-[11px] uppercase text-sc-muted">{t.is_advanced?"Advanced":"Basic"}</div>
          <button className="mt-4 w-full rounded-lg border border-sc-border py-2 text-sm">{!activeCustomId&&current?.theme_id===t.id?"Selected":"Use theme"}</button>
        </form>)}
      </div>
    </section>
  </>;
}
