import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard-context";
import { selectThemeAction } from "@/lib/merchant-actions";
import { activateMerchantThemeAction, createMerchantThemeAction, duplicateMerchantThemeAction } from "@/lib/theme-actions";
import { EmptyState } from "@/components/ui/empty-state";

const themeLooks:Record<string,{canvas:string;accent:string;label:string}>={
  minimal:{canvas:"bg-[#f4f1e9] text-[#171717]",accent:"bg-[#e50914]",label:"Airy / Clean"},
  dark:{canvas:"bg-[radial-gradient(circle_at_75%_0%,#5b0d13,#090909_48%)] text-white",accent:"bg-[#ff2632]",label:"Midnight / Glow"},
  editorial:{canvas:"bg-[#efe8dc] text-[#18130f]",accent:"bg-[#8b0000]",label:"Bold / Magazine"},
  modern:{canvas:"bg-[radial-gradient(circle_at_20%_0%,#522040,#0a0a12_48%,#101c2b)] text-white",accent:"bg-[#ff315a]",label:"Aurora / Glass"},
  technical:{canvas:"bg-[#080808] text-[#f5f5f5]",accent:"bg-[#ff1a24]",label:"Grid / Pixel"},
};

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
        {themes?.map((t)=>{const look=themeLooks[t.slug]??themeLooks.dark;return <form action={selectThemeAction} key={t.id} className={"overflow-hidden rounded-xl border "+(!activeCustomId&&current?.theme_id===t.id?"border-sc-red bg-[#130809]":"border-sc-border bg-sc-card")}>
          <input type="hidden" name="storeId" value={ctx.store.id}/>
          <input type="hidden" name="themeId" value={t.id}/>
          <div className={`relative h-40 overflow-hidden p-4 ${look.canvas}`}>
            {t.slug==="technical"&&<div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:18px_18px]"/>}
            <div className="relative flex items-center justify-between text-[8px] font-semibold"><span>YOUR STORE</span><span>SHOP · CART</span></div>
            <div className={`relative mt-7 ${t.slug==="minimal"?"text-center":t.slug==="editorial"?"text-3xl leading-none tracking-[-.08em]":""}`}><div className="text-xl font-semibold">Make it yours.</div><div className="mt-2 text-[8px] opacity-55">A storefront with actual personality.</div></div>
            <div className="relative mt-5 flex gap-2">{[0,1,2].map((item)=><span key={item} className={`h-7 flex-1 border border-current/10 ${t.slug==="modern"?"rounded-xl bg-white/10 backdrop-blur":t.slug==="editorial"?"bg-transparent":"rounded bg-current/5"}`}/>)}</div>
            <span className={`absolute bottom-3 right-3 h-2.5 w-8 rounded-full ${look.accent}`}/>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2"><div className="font-medium">{t.name}</div><span className="text-[9px] uppercase text-sc-muted">{look.label}</span></div>
            <p className="mt-2 min-h-16 text-xs leading-5 text-sc-secondary">{t.description}</p>
            <div className="mt-3 text-[11px] uppercase text-sc-muted">{t.is_advanced?"Advanced":"Basic"}</div>
            <button className="mt-4 w-full rounded-lg border border-sc-border py-2 text-sm">{!activeCustomId&&current?.theme_id===t.id?"Selected":"Use theme"}</button>
          </div>
        </form>})}
      </div>
    </section>
  </>;
}
