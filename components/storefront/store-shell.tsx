import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { activeCustomTheme, customThemeCss, themeVars } from "@/lib/storefront";

function storeHref(basePath:string,path=""){return basePath ? basePath+path : (path || "/");}

export function StoreShell({store,basePath,children}:{store:Record<string,unknown>;basePath:string;children:React.ReactNode}){
  const settings=(Array.isArray(store.store_settings)?store.store_settings[0]:store.store_settings) as {header_links?:{label:string;href:string}[];footer_links?:{label:string;href:string}[]} | null;
  const sellCoreHome=process.env.NEXT_PUBLIC_APP_URL||"https://sellcore.shop";
  const custom=activeCustomTheme(store);
  const themeSettings=((custom?.settings as Record<string,string>|undefined)??{});
  const headerStyle=themeSettings.headerStyle||"standard";
  const css=customThemeCss(store);
  const headerInner=headerStyle==="centered"?"mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-5 md:flex-row md:justify-between":headerStyle==="compact"?"mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3":"mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5";

  return <div style={themeVars(store)} className="flex min-h-screen flex-col bg-[var(--store-bg)]">
    {css&&<style dangerouslySetInnerHTML={{__html:css}}/>}
    <header className="border-b border-white/10">
      <div className={headerInner}>
        <Link href={storeHref(basePath)} className="text-lg font-semibold tracking-tight">{String(store.name)}</Link>
        <nav className="hidden gap-5 text-sm opacity-70 md:flex">{(settings?.header_links??[]).map((l,i)=><Link key={i} href={l.href}>{l.label}</Link>)}</nav>
        <div className="flex items-center gap-2">
          <Link href={storeHref(basePath)+"?search=1"} aria-label="Search" className="rounded-lg border border-white/10 p-2"><Search size={17}/></Link>
          <Link href={storeHref(basePath,"/cart")} aria-label="Cart" className="rounded-lg border border-white/10 p-2"><ShoppingBag size={17}/></Link>
        </div>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm opacity-60 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>{String(store.name)}</span>
          <span>Powered By <Link href={sellCoreHome} className="font-medium underline-offset-4 hover:underline">SellCore</Link></span>
        </div>
        <div className="flex flex-wrap gap-4">{(settings?.footer_links??[]).map((l,i)=><Link key={i} href={l.href}>{l.label}</Link>)}</div>
      </div>
    </footer>
  </div>;
}
