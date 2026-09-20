import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { SectionBuilder, type StoreSection } from "@/components/dashboard/section-builder";
import { deleteMerchantThemeAction, publishMerchantThemeAction, saveMerchantThemeAction } from "@/lib/theme-actions";
import { storefrontUrl } from "@/lib/storefront-routing";

export default async function ThemeEditor({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const ctx=await getDashboardContext();
  if(!ctx.store)notFound();

  const {data:theme}=await ctx.db.from("merchant_themes").select("*").eq("id",id).eq("store_id",ctx.store.id).maybeSingle();
  if(!theme)notFound();

  const settings=(theme.settings??{}) as Record<string,string>;
  const layout=(theme.draft_layout??{}) as {home?:StoreSection[]};
  const preview=storefrontUrl(ctx.store.slug)+"?preview=1";

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href="/dashboard/themes" className="text-sm text-sc-secondary">← Themes</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {theme.name}</h1>
        <p className="mt-1 text-sm text-sc-secondary">Save changes as a draft, preview them, then publish when ready.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={preview} className="rounded-lg border border-sc-border px-4 py-2 text-sm">Preview draft</Link>
        <form action={publishMerchantThemeAction}>
          <input type="hidden" name="themeId" value={theme.id}/>
          <button className="rounded-lg bg-sc-red px-4 py-2 text-sm font-medium">Publish</button>
        </form>
      </div>
    </div>

    <form action={saveMerchantThemeAction} className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="themeId" value={theme.id}/>
      <div className="space-y-5">
        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Homepage sections</h2>
          <p className="mt-1 text-sm text-sc-secondary">Add, remove and reorder storefront sections.</p>
          <div className="mt-4"><SectionBuilder name="layout" initialSections={layout.home??[]}/></div>
        </section>

        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Custom CSS</h2>
          <p className="mt-1 text-sm text-sc-secondary">Advanced styling for this theme. JavaScript is not executed here.</p>
          <textarea name="customCss" defaultValue={theme.custom_css??""} rows={18} spellCheck={false} className="mt-4 font-mono text-xs" placeholder=".product-card { ... }"/>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Theme settings</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Name<input name="name" defaultValue={theme.name} required/></label>
            <label className="text-sm">Accent<input name="accent" defaultValue={settings.accent||"#E50914"}/></label>
            <label className="text-sm">Background<input name="background" defaultValue={settings.background||"#050505"}/></label>
            <label className="text-sm">Text<input name="text" defaultValue={settings.text||"#F5F5F5"}/></label>
            <label className="text-sm">Radius<select name="radius" defaultValue={settings.radius||"8px"}><option>0px</option><option>4px</option><option>8px</option><option>16px</option><option>24px</option></select></label>
            <label className="text-sm">Font<select name="font" defaultValue={settings.font||"Manrope"}><option>Manrope</option><option>Space Grotesk</option><option>Sora</option><option>Plus Jakarta Sans</option><option>system-ui</option></select></label>
            <label className="text-sm">Header<select name="headerStyle" defaultValue={settings.headerStyle||"standard"}><option value="standard">Standard</option><option value="centered">Centered</option><option value="compact">Compact</option></select></label>
            <label className="text-sm">Product cards<select name="cardStyle" defaultValue={settings.cardStyle||"bordered"}><option value="bordered">Bordered</option><option value="flat">Flat</option><option value="editorial">Editorial</option></select></label>
            <button className="mt-2 rounded-lg bg-sc-red px-4 py-2.5 text-sm font-medium">Save draft</button>
          </div>
        </section>

        <section className="rounded-xl border border-red-950 bg-[#100708] p-5">
          <h2 className="font-semibold">Delete theme</h2>
          <p className="mt-2 text-sm text-sc-secondary">This permanently deletes this custom theme.</p>
          <form action={deleteMerchantThemeAction} className="mt-4">
            <input type="hidden" name="themeId" value={theme.id}/>
            <button className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300">Delete theme</button>
          </form>
        </section>
      </aside>
    </form>
  </>;
}
