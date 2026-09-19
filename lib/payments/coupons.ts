import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function validateCoupon(params: { storeId: string; code?: string | null; subtotal: number; productIds: string[]; customerId?: string | null }) {
  if (!params.code) return { coupon: null, discount: 0 };
  const db = createSupabaseAdminClient();
  const { data: coupon } = await db.from("coupons").select("*").eq("store_id", params.storeId).ilike("code", params.code).eq("active", true).maybeSingle();
  if (!coupon) throw new Error("INVALID_COUPON");
  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) throw new Error("COUPON_EXPIRED");
  if (coupon.minimum_order_minor && params.subtotal < coupon.minimum_order_minor) throw new Error("COUPON_MINIMUM_NOT_MET");
  if ((coupon.product_ids ?? []).length && !params.productIds.some((id) => coupon.product_ids.includes(id))) throw new Error("COUPON_NOT_APPLICABLE");
  if (coupon.usage_limit) {
    const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) throw new Error("COUPON_USAGE_LIMIT");
  }
  if (coupon.per_customer_limit && params.customerId) {
    const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).eq("customer_id", params.customerId);
    if ((count ?? 0) >= coupon.per_customer_limit) throw new Error("COUPON_CUSTOMER_LIMIT");
  }
  const raw = coupon.discount_type === "percent"
    ? Math.floor(params.subtotal * Math.min(coupon.discount_value, 10000) / 10000)
    : coupon.discount_value;
  return { coupon, discount: Math.min(raw, params.subtotal) };
}
