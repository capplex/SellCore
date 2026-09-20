import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag } from "lucide-react";
import { customThemeCss, storeAssetPublicUrl, storefrontThemeSettings, storefrontThemeSlug, themeVars } from "@/lib/storefront";

function storeHref(basePath:string,path=""){return basePath ? basePath+path : (path || "/");}
function storeLink(basePath:string,href:string){return href.startsWith("/")?storeHref(basePath,href):href;}

export function StoreShell({store,basePath,children,preview=false}:{store:Record<string,unknown>;basePath:string;children:React.ReactNode;preview?:boolean}){
  const settings=(Array.isArray(store.store_settings)?store.store_settings[0]:store.store_settings) as {header_links?:{label:string;href:string}[];footer_links?:{label:string;href:string}[];logo_path?:string|null;favicon_path?:string|null} | null;
  const sellCoreHome=(process.env.NEXT_PUBLIC_APP_URL||"https://sellcore.shop").replace(/\/$/,"");
  const logoUrl=settings?.logo_path?storeAssetPublicUrl(settings.logo_path):null;
  const themeSettings=storefrontThemeSettings(store,preview);
  const themeSlug=themeSettings.stylePreset||storefrontThemeSlug(store);
  const headerStyle=themeSettings.headerStyle||"standard";
  const css=customThemeCss(store,preview);
  const headerInner=headerStyle==="centered"?"mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-5 md:flex-row md:justify-between":headerStyle==="compact"?"mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3":"mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5";

  return <div
    style={themeVars(store,preview)}
    data-card-style={themeSettings.cardStyle||"bordered"}
    data-store-layout={themeSettings.productLayout||themeSettings.layout||"grid"}
    data-store-theme={themeSlug}
    data-store-background={themeSettings.backgroundStyle||"solid"}
    data-store-button={themeSettings.buttonStyle||"solid"}
    data-store-motion={themeSettings.motion||"subtle"}
    className="flex min-h-screen flex-col bg-[var(--store-bg)]"
  >
    {css&&<style dangerouslySetInnerHTML={{__html:css}}/>}
    <header className="border-b border-white/10">
      <div className={headerInner}>
        <Link href={storeHref(basePath)} className="inline-flex min-h-9 items-center text-lg font-semibold tracking-tight" aria-label={String(store.name)}>{logoUrl?<Image src={logoUrl} alt={String(store.name)} width={220} height={72} className="max-h-10 w-auto object-contain"/>:String(store.name)}</Link>
        <nav className="hidden gap-5 text-sm opacity-70 md:flex">{(settings?.header_links??[]).map((l,i)=><Link key={i} href={storeLink(basePath,l.href)}>{l.label}</Link>)}</nav>
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
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(settings?.footer_links??[]).map((l,i)=><Link key={i} href={storeLink(basePath,l.href)}>{l.label}</Link>)}
          <Link href={sellCoreHome+"/terms"}>Terms</Link>
          <Link href={sellCoreHome+"/privacy"}>Privacy</Link>
          <Link href={sellCoreHome+"/refunds"}>Refunds</Link>
          <Link href={sellCoreHome+"/acceptable-use"}>Acceptable Use</Link>
          <Link href={sellCoreHome+"/disclaimer"}>Disclaimer</Link>
        </div>
      </div>
    </footer>
  </div>;
}
