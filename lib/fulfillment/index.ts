import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, signHmac } from "@/lib/crypto";

async function deliverGenerated(item: Record<string, unknown>, config: Record<string, unknown>) {
  const endpoint = typeof config.endpoint_url === "string" ? config.endpoint_url : null;
  const encryptedSecret = typeof config.encrypted_secret === "string" ? config.encrypted_secret : null;
  if (!endpoint || !encryptedSecret) throw new Error("GENERATED_PRODUCT_NOT_CONFIGURED");
  const body = JSON.stringify({ order_item_id: item.id, product_id: item.product_id, variant_id: item.variant_id ?? null, quantity: item.quantity });
  const secret = decryptSecret(encryptedSecret);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-sellcore-signature": signHmac(secret, body) }, body, signal: controller.signal });
    if (!res.ok) throw new Error(`GENERATOR_HTTP_${res.status}`);
    return await res.json() as unknown;
  } finally { clearTimeout(timeout); }
}

export async function fulfillOrder(orderId: string) {
  const db = createSupabaseAdminClient();
  const { data: claimed } = await db.from("orders").update({ fulfillment_status: "processing" }).eq("id", orderId).eq("payment_status", "paid").in("fulfillment_status", ["pending", "failed"]).select("id,store_id,customer_id").maybeSingle();
  if (!claimed) return { alreadyProcessed: true };
  const { data: items, error } = await db.from("order_items").select("*").eq("order_id", orderId);
  if (error || !items) throw new Error(error?.message ?? "ORDER_ITEMS_NOT_FOUND");
  try {
    for (const item of items) {
      const { data: existing } = await db.from("deliveries").select("id").eq("order_item_id", item.id).maybeSingle();
      if (existing) continue;
      if (item.product_type === "license") {
        const { data: rows } = await db.from("licenses").select("id,key_value").eq("order_item_id", item.id).eq("status", "reserved");
        if (!rows || rows.length < item.quantity) throw new Error("RESERVED_LICENSE_MISSING");
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "license", payload: { licenses: rows.map((r) => r.key_value) } });
      } else if (item.product_type === "account") {
        const { data: rows } = await db.from("account_inventory").select("id,encrypted_payload").eq("order_item_id", item.id).eq("status", "reserved");
        if (!rows || rows.length < item.quantity) throw new Error("RESERVED_ACCOUNT_MISSING");
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "account", payload: { encrypted_accounts: rows.map((r) => r.encrypted_payload) } });
      } else if (item.product_type === "digital_file") {
        const { data: files } = await db.from("digital_files").select("id,original_name,max_downloads").eq("product_id", item.product_id).or(`variant_id.is.null,variant_id.eq.${item.variant_id ?? "00000000-0000-0000-0000-000000000000"}`);
        if (!files?.length) throw new Error("DIGITAL_FILE_MISSING");
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "digital_file", payload: { files } });
      } else if (item.product_type === "service") {
        await db.from("service_fulfillments").upsert({ order_item_id: item.id, status: "paid" }, { onConflict: "order_item_id" });
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "service", payload: { status: "paid" } });
      } else if (item.product_type === "subscription") {
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "subscription", payload: { status: "active" } });
      } else if (item.product_type === "generated") {
        const { data: cfg } = await db.from("generated_products").select("*").eq("product_id", item.product_id).single();
        const payload = await deliverGenerated(item, cfg ?? {});
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "generated", payload: payload as object });
      } else {
        const { data: cfg } = await db.from("custom_delivery").select("instructions").eq("product_id", item.product_id).maybeSingle();
        await db.from("deliveries").insert({ order_item_id: item.id, delivery_type: "manual", payload: { instructions: cfg?.instructions ?? "Merchant fulfillment required." } });
      }
    }
    await db.rpc("consume_order_reservations", { p_order: orderId });
    await db.from("orders").update({ fulfillment_status: "fulfilled" }).eq("id", orderId);
    return { alreadyProcessed: false };
  } catch (e) {
    await db.from("orders").update({ fulfillment_status: "failed" }).eq("id", orderId);
    throw e;
  }
}
