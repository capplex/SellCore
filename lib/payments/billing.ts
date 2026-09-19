import "server-only";
import { getStripe } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export async function createBillingCheckout(merchantId: string, planId: string, interval: "monthly" | "yearly") {
  const db = createSupabaseAdminClient();
  const [{ data: merchant }, { data: plan }] = await Promise.all([
    db.from("merchants").select("*").eq("id", merchantId).single(),
    db.from("platform_plans").select("*").eq("id", planId).eq("is_active", true).single(),
  ]);
  if (!merchant || !plan || plan.is_free) throw new Error("INVALID_PLAN");
  const price = interval === "monthly" ? plan.stripe_monthly_price_id : plan.stripe_yearly_price_id;
  if (!price) throw new Error("PLAN_STRIPE_PRICE_NOT_CONFIGURED");
  const stripe = getStripe();
  let customerId = merchant.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({ name: merchant.name, metadata: { merchant_id: merchantId } });
    customerId = customer.id;
    await db.from("merchants").update({ stripe_customer_id: customerId }).eq("id", merchantId);
  }
  const appUrl = serverEnv().NEXT_PUBLIC_APP_URL;
  const { data: existing } = await db.from("merchant_subscriptions").select("stripe_subscription_id,status").eq("merchant_id", merchantId).maybeSingle();
  if (existing?.stripe_subscription_id && existing.status !== "canceled") {
    const current = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
    const item = current.items.data[0];
    if (!item) throw new Error("BILLING_SUBSCRIPTION_ITEM_MISSING");
    await stripe.subscriptions.update(current.id, { items: [{ id: item.id, price }], cancel_at_period_end: false, proration_behavior: "create_prorations", metadata: { merchant_id: merchantId, plan_id: planId, interval } });
    return `${appUrl}/dashboard/settings/billing?changed=1`;
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings/billing?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/settings/billing?cancelled=1`,
    metadata: { merchant_id: merchantId, plan_id: planId, interval },
    subscription_data: { metadata: { merchant_id: merchantId, plan_id: planId, interval }, ...(plan.trial_days > 0 ? { trial_period_days: plan.trial_days } : {}) },
  });
  return session.url!;
}

export async function createBillingPortal(merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: merchant } = await db.from("merchants").select("stripe_customer_id").eq("id", merchantId).single();
  if (!merchant?.stripe_customer_id) throw new Error("NO_BILLING_CUSTOMER");
  const session = await getStripe().billingPortal.sessions.create({ customer: merchant.stripe_customer_id, return_url: `${serverEnv().NEXT_PUBLIC_APP_URL}/dashboard/settings/billing` });
  return session.url;
}
