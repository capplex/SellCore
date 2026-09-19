import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMerchantUsage, getPlanLimits } from "@/lib/usage/service";

export async function createAuthorizedDownload(fileId: string, userId: string) {
  const db = createSupabaseAdminClient();
  const { data: file } = await db.from("digital_files").select("id,storage_path,max_downloads,product_id,products!inner(store_id,stores!inner(merchant_id))").eq("id", fileId).single();
  if (!file) throw new Error("FILE_NOT_FOUND");
  const merchantId = file.products.stores.merchant_id as string;
  const [usage, limits] = await Promise.all([getMerchantUsage(merchantId), getPlanLimits(merchantId)]);
  if (limits.digital_downloads_monthly !== Infinity && usage.digital_downloads_monthly >= limits.digital_downloads_monthly) throw new Error("PLAN_LIMIT:digital_downloads_monthly");
  const { data: customer } = await db.from("customers").select("id").eq("auth_user_id", userId);
  const customerIds = (customer ?? []).map((c) => c.id);
  if (!customerIds.length) throw new Error("FORBIDDEN");
  const { data: item } = await db.from("order_items").select("id,orders!inner(customer_id,payment_status)").eq("product_id", file.product_id).in("orders.customer_id", customerIds).eq("orders.payment_status", "paid").limit(1).maybeSingle();
  if (!item) throw new Error("FORBIDDEN");
  const { data: delivery } = await db.from("deliveries").select("id,download_count").eq("order_item_id", item.id).single();
  if (!delivery) throw new Error("DELIVERY_NOT_READY");
  if (file.max_downloads && delivery.download_count >= file.max_downloads) throw new Error("DOWNLOAD_LIMIT_REACHED");
  const { data: signed, error } = await db.storage.from("digital-files").createSignedUrl(file.storage_path, 60);
  if (error || !signed) throw new Error(error?.message ?? "SIGNED_URL_FAILED");
  await db.from("deliveries").update({ download_count: delivery.download_count + 1 }).eq("id", delivery.id);
  await db.rpc("increment_usage", { p_merchant: merchantId, p_metric: "digital_downloads", p_amount: 1 });
  return signed.signedUrl;
}
