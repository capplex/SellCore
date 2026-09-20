import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingLayout({children}:{children:React.ReactNode}){
  return <div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-20 border-b border-[#181818] bg-[#050505]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/"><Logo/></Link>
        <nav className="hidden gap-6 text-sm text-sc-secondary md:flex">
          <Link href="/#platform">Platform</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="flex gap-2">
          <Link className="rounded-lg px-3 py-2 text-sm text-sc-secondary hover:bg-[#111]" href="/login">Log in</Link>
          <Link className="rounded-lg bg-sc-red px-3 py-2 text-sm font-medium" href="/register">Start selling</Link>
        </div>
      </div>
    </header>

    <div className="flex-1">{children}</div>

    <footer className="mt-auto border-t border-[#181818] bg-[#050505]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-sm text-sc-secondary md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo size={28}/>
          <p className="mt-4 max-w-md leading-6">Hosted commerce infrastructure for digital products and services.</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sc-muted">SellCore</div>
          <div className="mt-4 grid gap-2.5">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/login" className="hover:text-white">Dashboard</Link>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sc-muted">Legal</div>
          <div className="mt-4 grid gap-2.5">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/refunds" className="hover:text-white">Refund Policy</Link>
            <Link href="/acceptable-use" className="hover:text-white">Acceptable Use Policy</Link>
            <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#181818]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-sc-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} SellCore. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/refunds" className="hover:text-white">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  </div>;
}
