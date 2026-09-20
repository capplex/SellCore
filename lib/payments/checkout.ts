import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/payments/stripe";
import { validateCoupon } from "@/lib/payments/coupons";
import { randomToken, sha256 } from "@/lib/crypto";
import { serverEnv } from "@/lib/env";
import { getMerchantUsage, getPlanLimits } from "@/lib/usage/service";
import { selectRequiredVariant } from "@/lib/variant-selection";

export type CheckoutCartItem = { productId: string; variantId?: string | null; quantity: number };

export async function createStoreCheckout(params: { storeSlug: string; email: string; name?: string; couponCode?: string | null; items: CheckoutCartItem[] }) {
  if (!params.items.length) throw new Error("CART_EMPTY");
  const db = createSupabaseAdminClient();
  const { data: store } = await db.from("stores").select("*").eq("slug", params.storeSlug).eq("status", "published").single();
  if (!store) throw new Error("STORE_NOT_FOUND");

  const ids = [...new Set(params.items.map((i) => i.productId))];
  const { data: products } = await db.from("products").select("*").eq("store_id", store.id).in("id", ids).eq("status", "active");
  if (!products || products.length !== ids.length) throw new Error("PRODUCT_UNAVAILABLE");
  const { data: variants, error: variantsError } = await db
    .from("product_variants")
    .select("*")
    .in("product_id", ids)
    .eq("active", true);
  if (variantsError) throw variantsError;
  const activeVariants = variants ?? [];

  const computed = params.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const variant = selectRequiredVariant(activeVariants, product.id, item.variantId);
    const quantity = Math.max(1, Math.min(100, Math.trunc(item.quantity)));
    const price = variant?.price_minor ?? product.price_minor;
    const available = variant?.inventory_quantity ?? product.inventory_quantity;
    if ((variant?.inventory_quantity !== null || product.track_inventory) && available !== null && available !== undefined && available < quantity) throw new Error("SOLD_OUT");
    return { product, variant, quantity, price, total: price * quantity };
  });
  const currencies = new Set(computed.map((i) => i.product.currency.toUpperCase()));
  if (currencies.size !== 1) throw new Error("MIXED_CURRENCY_CART");
  const currency = [...currencies][0];
  const subtotal = computed.reduce((sum, i) => sum + i.total, 0);

  const [usage, limits] = await Promise.all([getMerchantUsage(store.merchant_id), getPlanLimits(store.merchant_id)]);
  if (limits.orders_monthly !== Infinity && usage.orders_monthly >= limits.orders_monthly) throw new Error("PLAN_LIMIT:orders_monthly");

  const normalizedEmail = params.email.trim().toLowerCase();
  const { data: existingCustomer } = await db.from("customers").select("*").eq("store_id", store.id).eq("email", normalizedEmail).maybeSingle();
  if (!existingCustomer && limits.customers !== Infinity && usage.customers >= limits.customers) throw new Error("PLAN_LIMIT:customers");
  const { data: customer } = existingCustomer
    ? await db.from("customers").update({ name: params.name || existingCustomer.name }).eq("id", existingCustomer.id).select("*").single()
    : await db.from("customers").insert({ store_id: store.id, email: normalizedEmail, name: params.name || null }).select("*").single();
  if (!customer) throw new Error("CUSTOMER_CREATE_FAILED");

  const { coupon, discount } = await validateCoupon({ storeId: store.id, code: params.couponCode, subtotal, productIds: ids, customerId: customer.id });
  const accessToken = randomToken("ord_");
  const total = subtotal - discount;
  const { data: order, error: orderError } = await db.from("orders").insert({
    store_id: store.id,
    customer_id: customer.id,
    currency,
    subtotal_minor: subtotal,
    discount_minor: discount,
    total_minor: total,
    payment_status: "pending",
    fulfillment_status: "pending",
    payment_provider: "stripe",
    access_token_hash: sha256(accessToken),
    coupon_id: coupon?.id ?? null,
  }).select("*").single();
  if (orderError || !order) throw new Error(orderError?.message ?? "ORDER_CREATE_FAILED");

  const orderItems = computed.map((i) => ({
    order_id: order.id,
    product_id: i.product.id,
    variant_id: i.variant?.id ?? null,
    product_name: i.product.name,
    variant_name: i.variant?.name ?? null,
    product_type: i.product.type,
    sku: i.variant?.sku ?? i.product.sku,
    quantity: i.quantity,
    unit_price_minor: i.price,
    total_minor: i.total,
    metadata: {},
  }));
  const { data: insertedItems, error: itemError } = await db.from("order_items").insert(orderItems).select("id,product_id,variant_id,quantity,product_type");
  if (itemError || !insertedItems) { await db.from("orders").delete().eq("id", order.id); throw new Error(itemError?.message ?? "ORDER_ITEMS_CREATE_FAILED"); }
  try {
    for (const item of insertedItems) {
      const fn = item.product_type === "license" ? "reserve_license_inventory" : item.product_type === "account" ? "reserve_account_inventory" : "reserve_order_item_inventory";
      const { error } = await db.rpc(fn, { p_order_item: item.id, p_product: item.product_id, p_variant: item.variant_id, p_quantity: item.quantity });
      if (error) throw error;
    }
  } catch (error) {
    await db.rpc("release_order_reservations", { p_order: order.id });
    await db.from("orders").delete().eq("id", order.id);
    throw error;
  }

  const { data: payAccount } = await db.from("payment_accounts").select("*").eq("store_id", store.id).eq("provider", "stripe").eq("charges_enabled", true).maybeSingle();
  if (!payAccount) {
    await db.rpc("release_order_reservations", { p_order: order.id });
    await db.from("orders").delete().eq("id", order.id);
    throw new Error("STORE_PAYMENT_NOT_CONFIGURED");
  }

  const mode = computed.some((i) => i.product.type === "subscription") ? "subscription" : "payment";
  const lineItems = computed.map((i) => ({
    quantity: i.quantity,
    price_data: {
      currency: currency.toLowerCase(),
      product_data: { name: i.variant ? `${i.product.name} — ${i.variant.name}` : i.product.name },
      unit_amount: i.price,
      ...(i.product.type === "subscription" ? { recurring: { interval: (i.product.subscription_interval || "month") as "week" | "month" | "year" } } : {}),
    },
  }));

  // Apply SellCore coupon as a one-time negative discount by creating a Stripe coupon on the connected account.
  let discounts: { coupon: string }[] | undefined;
  if (discount > 0) {
    const sc = getStripe();
    const stripeCoupon = await sc.coupons.create({ amount_off: discount, currency: currency.toLowerCase(), duration: "once", name: `SellCore ${coupon?.code ?? "discount"}` }, { stripeAccount: payAccount.provider_account_id });
    discounts = [{ coupon: stripeCoupon.id }];
  }

  const stripe = getStripe();
  const successUrl = `${serverEnv().NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.id}&token=${encodeURIComponent(accessToken)}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      // Stripe Checkout uses the connected account's dynamic payment-method configuration.
      customer_email: customer.email,
      line_items: lineItems,
      discounts,
      success_url: successUrl,
      cancel_url: `${serverEnv().NEXT_PUBLIC_APP_URL}/store/${store.slug}/cart?cancelled=1`,
      client_reference_id: order.id,
      metadata: { order_id: order.id, store_id: store.id },
      ...(mode === "subscription" ? { subscription_data: { metadata: { order_id: order.id, store_id: store.id } } } : {}),
    }, { stripeAccount: payAccount.provider_account_id });
    await db.from("orders").update({ payment_provider_session_id: session.id }).eq("id", order.id);
    return { url: session.url!, orderId: order.id, accessToken };
  } catch (error) {
    await db.rpc("release_order_reservations", { p_order: order.id });
    await db.from("orders").delete().eq("id", order.id);
    throw error;
  }
}
