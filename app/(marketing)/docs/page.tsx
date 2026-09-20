import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, CreditCard, Globe2, KeyRound, LayoutTemplate, PackageCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Docs",
  description: "SellCore documentation for merchants, storefronts, products, themes, payments, fulfillment, domains and developer tools.",
};

const sections = [
  { id:"getting-started", icon:BookOpen, title:"Getting started", body:"Create an account, complete onboarding, name your store and start from the merchant dashboard.", points:["Register and verify your account","Create your merchant workspace","Create your first store","Open the live storefront from the Storefront section"] },
  { id:"products", icon:Boxes, title:"Products", body:"Sell multiple digital product types through one catalog and order system.", points:["License keys","Digital files","Account inventory","Services","Subscriptions","Generated delivery","Custom fulfillment","Variants and inventory"] },
  { id:"themes", icon:LayoutTemplate, title:"Themes & storefront", body:"Control how the storefront looks and behaves without changing commerce data. SellCore currently supports theme selection and structured theme settings; the merchant theme builder and cross-platform importer are being expanded.", points:["Theme selection","Structured colors, typography and layout settings","Storefront preview","Published storefront themes","Merchant-created theme system in development","Cross-platform theme importing in development"] },
  { id:"payments", icon:CreditCard, title:"Payments", body:"Connect a merchant payment account and use server-verified checkout state.", points:["Stripe Connect for merchant payments","Server-side pricing and coupon validation","Verified payment webhooks","Refund actions from eligible orders"] },
  { id:"fulfillment", icon:PackageCheck, title:"Orders & fulfillment", body:"Orders move through payment and fulfillment states depending on the product type.", points:["Automatic delivery for supported digital products","Manual service fulfillment workflow","Inventory reservation and claiming","Customer delivery and order access"] },
  { id:"domains", icon:Globe2, title:"Domains", body:"Every published store has a SellCore subdomain and eligible plans can attach custom domains.", points:["store.sellcore.shop storefronts","DNS verification for custom domains","Store-level routing","Preview before publishing"] },
  { id:"team", icon:Users, title:"Team access", body:"Add existing SellCore users to a merchant workspace with scoped roles.", points:["Owner","Admin","Staff","Viewer"] },
  { id:"developers", icon:KeyRound, title:"Developer tools", body:"Eligible plans can integrate directly with SellCore.", points:["Scoped API keys","Signed webhooks","Webhook delivery history","Per-plan API and webhook limits"] },
];

export default function DocsPage(){
  return <main>
    <section className="border-b border-sc-border">
      <div className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">SellCore Docs</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Build, operate and customize your store.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-sc-secondary">Documentation for merchants using SellCore storefronts, products, themes, payments, fulfillment and developer tools.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-sc-red px-4 py-2.5 text-sm font-medium">Create a store <ArrowRight size={16}/></Link><Link href="/login" className="rounded-lg border border-sc-border px-4 py-2.5 text-sm">Open dashboard</Link></div>
      </div>
    </section>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="text-xs font-semibold uppercase tracking-wider text-sc-muted">Contents</div>
        <nav className="mt-3 grid gap-1 text-sm text-sc-secondary">
          {sections.map(s=><a key={s.id} href={"#"+s.id} className="rounded-md px-2 py-1.5 hover:bg-[#111] hover:text-white">{s.title}</a>)}
          <a href="#plans" className="rounded-md px-2 py-1.5 hover:bg-[#111] hover:text-white">Plans</a>
        </nav>
      </aside>
      <div className="space-y-5">
        {sections.map(({id,icon:Icon,title,body,points})=><Card key={id} id={id} className="scroll-mt-24 p-6 md:p-8"><Icon size={22} className="text-sc-red"/><h2 className="mt-4 text-2xl font-semibold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-sc-secondary">{body}</p><ul className="mt-5 grid gap-2 text-sm text-sc-secondary sm:grid-cols-2">{points.map(p=><li key={p} className="rounded-lg border border-sc-border bg-[#0b0b0b] px-3 py-2">{p}</li>)}</ul></Card>)}
        <Card id="plans" className="scroll-mt-24 p-6 md:p-8"><h2 className="text-2xl font-semibold">Plans & feature access</h2><p className="mt-3 text-sm leading-7 text-sc-secondary">SellCore plans control operating limits and selected platform capabilities. Your current usage and plan are shown in the dashboard. Upgrading raises limits or unlocks additional capabilities without requiring a new store.</p><Link href="/pricing" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#ff7a80]">View pricing <ArrowRight size={15}/></Link></Card>
      </div>
    </div>
  </main>
}
