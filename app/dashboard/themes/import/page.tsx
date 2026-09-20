import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard-context";
import { importThemeAction } from "@/lib/theme-import-actions";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ThemeImportPage(){
  const ctx=await getDashboardContext();
  if(!ctx.store)return <EmptyState title="No store"/>;

  return <div className="mx-auto max-w-3xl">
    <Link href="/dashboard/themes" className="text-sm text-sc-secondary">← Themes</Link>
    <h1 className="mt-3 text-2xl font-semibold">Import theme</h1>
    <p className="mt-2 text-sm leading-6 text-sc-secondary">Upload an exported theme package. SellCore keeps supported source files, imports CSS, detects common storefront structures and converts them into editable SellCore sections.</p>

    <form action={importThemeAction} className="mt-6 rounded-xl border border-sc-border bg-sc-card p-5">
      <input type="hidden" name="storeId" value={ctx.store.id}/>
      <div className="grid gap-4">
        <label className="text-sm">Source platform
          <select name="sourcePlatform" defaultValue="auto" className="mt-1">
            <option value="auto">Auto detect</option>
            <option value="sellauth">SellAuth</option>
            <option value="shoppex">Shoppex</option>
            <option value="sellix">Sellix</option>
            <option value="sellapp">SellApp</option>
            <option value="komerza">Komerza</option>
            <option value="sellhub">SellHub</option>
            <option value="sellcore">SellCore</option>
          </select>
        </label>

        <label className="text-sm">Theme package
          <input name="themeFile" type="file" accept=".zip,.json,application/zip,application/json" required className="mt-1"/>
        </label>

        <div className="rounded-lg border border-sc-border bg-[#0a0a0a] p-4 text-xs leading-6 text-sc-secondary">
          <p><b className="text-white">ZIP:</b> imports supported HTML/template source, CSS and theme files. Platform JavaScript is preserved as source but is not executed automatically.</p>
          <p className="mt-2"><b className="text-white">JSON:</b> imports a SellCore-compatible theme package with settings, sections and optional custom CSS.</p>
          <p className="mt-2">After import, SellCore opens the theme editor and shows an import report so you can review anything that needs manual conversion.</p>
        </div>

        <button className="rounded-lg bg-sc-red px-4 py-2.5 text-sm font-medium">Import theme</button>
      </div>
    </form>
  </div>;
}
