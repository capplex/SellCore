import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { getDashboardContext } from "@/lib/dashboard-context";
export const dynamic="force-dynamic";
export default async function DashboardLayout({children}:{children:React.ReactNode}){const ctx=await getDashboardContext(); return <div className="flex min-h-screen"><Sidebar stores={ctx.stores} activeId={ctx.store?.id}/><div className="min-w-0 flex-1"><Topbar storeSlug={ctx.store?.slug}/><main className="mx-auto max-w-[1500px] p-4 sm:p-6">{children}</main></div></div>}
