import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { logoutAction } from "@/lib/auth/actions";
import { storefrontPathUrl } from "@/lib/storefront-routing";
export function Topbar({storeSlug}:{storeSlug?:string}){const previewUrl=storeSlug?`${storefrontPathUrl(storeSlug)}?preview=1`:undefined;return <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#181818] bg-[#050505]/90 px-4 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><MobileNav/><div className="hidden items-center gap-2 rounded-lg border border-sc-border bg-[#0b0b0b] px-3 py-2 text-sm text-sc-muted sm:flex"><Search size={15}/>Search SellCore</div></div><div className="flex items-center gap-2">{storeSlug&&previewUrl&&<Link href={previewUrl} className="inline-flex items-center gap-2 rounded-lg border border-sc-border px-3 py-2 text-xs text-sc-secondary">Preview <ExternalLink size={14}/></Link>}<form action={logoutAction}><button className="rounded-lg border border-sc-border px-3 py-2 text-xs text-sc-secondary">Log out</button></form></div></header>}
