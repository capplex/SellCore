import { Bitcoin, CreditCard, DollarSign, Smartphone, WalletCards } from "lucide-react";
import { getDashboardContext } from "@/lib/dashboard-context";
import { connectStripeAction } from "@/lib/merchant-actions";
import { EmptyState } from "@/components/ui/empty-state";

const methods=[
  {name:"Cards",detail:"Visa, Mastercard and other eligible cards",icon:CreditCard,availability:"All eligible Stripe merchants"},
  {name:"Apple Pay",detail:"Shown automatically on compatible Apple devices",icon:WalletCards,availability:"Eligible buyers and merchants"},
  {name:"Google Pay",detail:"Shown automatically when the wallet is available",icon:WalletCards,availability:"Eligible buyers and merchants"},
  {name:"Cash App Pay",detail:"Available through Stripe for qualifying USD checkout",icon:Smartphone,availability:"US merchants · USD"},
  {name:"Stablecoin",detail:"Stripe can show Pay with Crypto when the connected account is approved",icon:Bitcoin,availability:"Eligible US merchants"},
];

export default async function Payments(){
  const ctx=await getDashboardContext();
  if(!ctx.store)return <EmptyState title="No store"/>;
  const {data:p}=await ctx.db.from("payment_accounts").select("*").eq("store_id",ctx.store.id).eq("provider","stripe").maybeSingle();
  const ready=Boolean(p?.charges_enabled);
  return <>
    <h1 className="text-2xl font-semibold">Payments</h1>
    <p className="mt-1 max-w-3xl text-sm text-sc-secondary">Connect one verified Stripe account. SellCore then uses dynamic checkout so Stripe can present the methods that are actually eligible for each merchant, currency, device and buyer.</p>

    <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-xl border border-sc-border bg-sc-card p-6">
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><CreditCard size={18} className="text-sc-red"/><h2 className="font-semibold">Stripe Connect</h2></div><p className="mt-2 text-sm text-sc-secondary">{!p?"Not connected":ready?"Connected and accepting payments":p.details_submitted?"Stripe is reviewing or enabling charges":"Onboarding incomplete"}</p></div><span className={`mt-1 h-2.5 w-2.5 rounded-full ${ready?"bg-emerald-400":"bg-[#555]"}`}/></div>
        <form action={connectStripeAction} className="mt-5"><input type="hidden" name="storeId" value={ctx.store.id}/><button className="rounded-lg bg-sc-red px-4 py-2 text-sm font-medium">{p?"Continue Stripe setup":"Connect Stripe"}</button></form>
        <p className="mt-4 text-xs leading-5 text-sc-muted">SellCore never stores card or wallet credentials. Prices are rebuilt on the server, and payment state becomes authoritative only after a verified Stripe webhook.</p>
      </section>

      <section className="rounded-xl border border-sc-border bg-[radial-gradient(circle_at_90%_0%,rgba(229,9,20,.14),transparent_36%),#101010] p-6">
        <DollarSign size={18} className="text-sc-red"/><h2 className="mt-4 font-semibold">One connection, dynamic methods</h2><p className="mt-2 text-sm leading-6 text-sc-secondary">Availability is controlled by Stripe’s connected-account settings and compliance checks. A method is never shown when the transaction is ineligible.</p>
      </section>
    </div>

    <section className="mt-6">
      <h2 className="font-semibold">Checkout methods</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{methods.map(({name,detail,icon:Icon,availability})=><article key={name} className="rounded-xl border border-sc-border bg-sc-card p-5"><div className="flex items-center justify-between gap-3"><Icon size={18} className="text-sc-red"/><span className={`rounded-full px-2 py-1 text-[10px] uppercase ${ready?"bg-emerald-950 text-emerald-300":"bg-[#202020] text-sc-muted"}`}>{ready?"Dynamic":"Connect Stripe"}</span></div><h3 className="mt-5 font-medium">{name}</h3><p className="mt-2 text-sm leading-6 text-sc-secondary">{detail}</p><p className="mt-3 text-xs text-sc-muted">{availability}</p></article>)}</div>
    </section>

    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-sc-border bg-sc-card p-5"><h2 className="font-semibold">PayPal Business</h2><p className="mt-2 text-sm leading-6 text-sc-secondary">SellCore will use PayPal’s multiparty Business checkout once the platform has PayPal partner credentials and merchant onboarding approval. It is not silently simulated or treated as paid without a verified capture.</p><span className="mt-4 inline-flex rounded-full bg-amber-950/60 px-2.5 py-1 text-xs text-amber-200">Platform approval required</span></article>
      <article className="rounded-xl border border-red-950 bg-[#100708] p-5"><h2 className="font-semibold">PayPal Friends &amp; Family</h2><p className="mt-2 text-sm leading-6 text-sc-secondary">Not offered for merchant sales. It is a personal-transfer flow, not a proper store checkout. PayPal Business is the supported path.</p><span className="mt-4 inline-flex rounded-full bg-red-950 px-2.5 py-1 text-xs text-red-200">Not supported</span></article>
    </section>
  </>;
}
