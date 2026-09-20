import "server-only";
import { getStripe } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export async function createStripeConnectOnboarding(storeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id,merchant_id")
    .eq("id", storeId)
    .eq("merchant_id", merchantId)
    .single();
  if (storeError || !store) throw new Error("FORBIDDEN");

  let { data: payment, error: paymentReadError } = await db
    .from("payment_accounts")
    .select("*")
    .eq("store_id", storeId)
    .eq("provider", "stripe")
    .maybeSingle();
  if (paymentReadError) throw paymentReadError;

  const stripe = getStripe();

  if (!payment) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { store_id: storeId, merchant_id: merchantId },
    });

    const { data: inserted, error: insertError } = await db
      .from("payment_accounts")
      .insert({
        store_id: storeId,
        provider: "stripe",
        provider_account_id: account.id,
        charges_enabled: Boolean(account.charges_enabled),
        details_submitted: Boolean(account.details_submitted),
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      // Avoid leaving an orphaned connected account when our database insert fails.
      await stripe.accounts.del(account.id).catch(() => undefined);
      throw insertError ?? new Error("PAYMENT_ACCOUNT_CREATE_FAILED");
    }
    payment = inserted;
  }

  const appUrl = serverEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const link = await stripe.accountLinks.create({
    account: payment.provider_account_id,
    refresh_url: `${appUrl}/dashboard/payments?stripe_refresh=1`,
    return_url: `${appUrl}/api/payments/stripe/connect/return?store=${encodeURIComponent(storeId)}`,
    type: "account_onboarding",
  });

  if (!link.url) throw new Error("STRIPE_ONBOARDING_LINK_MISSING");
  return link.url;
}

export async function refreshStripeAccount(storeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: store } = await db
    .from("stores")
    .select("merchant_id")
    .eq("id", storeId)
    .eq("merchant_id", merchantId)
    .single();
  if (!store) throw new Error("FORBIDDEN");

  const { data: payment } = await db
    .from("payment_accounts")
    .select("*")
    .eq("store_id", storeId)
    .eq("provider", "stripe")
    .single();
  if (!payment) throw new Error("STRIPE_ACCOUNT_NOT_FOUND");

  const account = await getStripe().accounts.retrieve(payment.provider_account_id);
  if ("deleted" in account && account.deleted) throw new Error("STRIPE_ACCOUNT_DELETED");

  await db
    .from("payment_accounts")
    .update({
      charges_enabled: Boolean(account.charges_enabled),
      details_submitted: Boolean(account.details_submitted),
    })
    .eq("id", payment.id);

  return account;
}
