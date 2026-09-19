import "server-only";
import { getStripe } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export async function createStripeConnectOnboarding(storeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: store } = await db.from("stores").select("id,merchant_id").eq("id", storeId).eq("merchant_id", merchantId).single();
  if (!store) throw new Error("FORBIDDEN");
  let { data: payment } = await db.from("payment_accounts").select("*").eq("store_id", storeId).eq("provider", "stripe").maybeSingle();
  const stripe = getStripe();
  if (!payment) {
    const account = await stripe.accounts.create({ type: "express", metadata: { store_id: storeId, merchant_id: merchantId } });
    const inserted = await db.from("payment_accounts").insert({ store_id: storeId, provider: "stripe", provider_account_id: account.id }).select("*").single();
    payment = inserted.data;
  }
  if (!payment) throw new Error("PAYMENT_ACCOUNT_CREATE_FAILED");
  const appUrl = serverEnv().NEXT_PUBLIC_APP_URL;
  const link = await stripe.accountLinks.create({
    account: payment.provider_account_id,
    refresh_url: `${appUrl}/dashboard/payments?refresh=1`,
    return_url: `${appUrl}/api/payments/stripe/connect/return?store=${storeId}`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function refreshStripeAccount(storeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: store } = await db.from("stores").select("merchant_id").eq("id", storeId).eq("merchant_id", merchantId).single();
  if (!store) throw new Error("FORBIDDEN");
  const { data: payment } = await db.from("payment_accounts").select("*").eq("store_id", storeId).eq("provider", "stripe").single();
  const account = await getStripe().accounts.retrieve(payment.provider_account_id);
  await db.from("payment_accounts").update({ charges_enabled: Boolean(account.charges_enabled), details_submitted: Boolean(account.details_submitted) }).eq("id", payment.id);
  return account;
}
