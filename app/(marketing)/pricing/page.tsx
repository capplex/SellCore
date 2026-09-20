import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";
import { billingCheckoutAction } from "@/lib/merchant-actions";
import { formatMoney } from "@/lib/utils";

export const dynamic="force-dynamic";

export default async function Pricing(){
  const db=createSupabaseAdminClient();
  const user=await getUser();
  let merchantId:string|null=null;

  if(user){
    const authDb=await createSupabaseServerClient();
    const {data:member}=await authDb
      .from("merchant_members")
      .select("merchant_id")
      .eq("user_id",user.id)
      .limit(1)
      .maybeSingle();
    merchantId=member?.merchant_id??null;
  }

  const {data:plans}=await db
    .from("platform_plans")
    .select("*,plan_limits(*),plan_features(*)")
    .eq("is_active",true)
    .order("sort_order");

  return <main className="mx-auto max-w-7xl px-5 py-20">
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-sc-red">PRICING</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Start free. Upgrade when the limits matter.</h1>
      <p className="mt-4 text-sc-secondary">Plans and limits below are loaded from SellCore platform configuration.</p>
    </div>

    <div className="mt-10 grid gap-4 lg:grid-cols-4">
      {(plans??[]).map(plan=>{
        const limits=Object.fromEntries((plan.plan_limits??[]).map((x:{limit_key:string;limit_value:number|null})=>[x.limit_key,x.limit_value]));
        const features=(plan.plan_features??[]).filter((x:{enabled:boolean})=>x.enabled).map((x:{feature_key:string})=>x.feature_key);

        return <div key={plan.id} className={"rounded-xl border p-6 "+(plan.is_free?"border-[#402023] bg-[#10090a]":"border-sc-border bg-sc-card")}>
          <div className="text-sm text-sc-secondary">{plan.name}</div>
          <div className="mt-3 text-3xl font-semibold">{plan.is_free?"Free":formatMoney(plan.monthly_price_minor,plan.currency)+"/mo"}</div>
          <p className="mt-3 min-h-12 text-sm text-sc-secondary">{plan.description}</p>

          {merchantId && !plan.is_free
            ? <form action={billingCheckoutAction} className="mt-6">
                <input type="hidden" name="planId" value={plan.id}/>
                <button className="w-full rounded-lg bg-sc-red px-4 py-2 text-center text-sm font-medium">Choose {plan.name}</button>
              </form>
            : <Link
                href={user ? (merchantId?"/dashboard/settings/billing":"/onboarding") : "/register"}
                className="mt-6 block rounded-lg bg-sc-red px-4 py-2 text-center text-sm font-medium"
              >
                Choose {plan.name}
              </Link>
          }

          <div className="mt-6 space-y-2 text-sm text-sc-secondary">
            <div>{limits.products??0} products</div>
            <div>{limits.stores??0} stores</div>
            <div>{limits.orders_monthly??0} orders / month</div>
            <div>{limits.custom_domains??0} custom domains</div>
            <div>{limits.storage_mb??0} MB storage</div>
            {features.slice(0,5).map((f:string)=><div key={f}>✓ {f.replaceAll("_"," ")}</div>)}
          </div>
        </div>
      })}
    </div>
  </main>;
}
