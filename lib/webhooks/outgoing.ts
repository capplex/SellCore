import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, signHmac } from "@/lib/crypto";
import { getMerchantUsage, getPlanLimits, canUseFeature } from "@/lib/usage/service";

export async function enqueueWebhookEvent(merchantId: string, eventType: string, payload: object) {
  if (!(await canUseFeature(merchantId, "webhooks"))) return;
  const [usage, limits] = await Promise.all([getMerchantUsage(merchantId), getPlanLimits(merchantId)]);
  if (limits.webhook_deliveries_monthly !== Infinity && usage.webhook_deliveries_monthly >= limits.webhook_deliveries_monthly) {
    const db = createSupabaseAdminClient();
    await db.from("notifications").insert({ merchant_id: merchantId, type: "plan_limit", title: "Webhook delivery limit reached", body: "Webhook events are paused until your next usage period or a plan upgrade." });
    return;
  }
  const db = createSupabaseAdminClient();
  const { data: hooks } = await db.from("webhooks").select("id,events").eq("merchant_id", merchantId).eq("active", true).contains("events", [eventType]);
  if (!hooks?.length) return;
  const remaining = limits.webhook_deliveries_monthly === Infinity ? hooks.length : Math.max(0, limits.webhook_deliveries_monthly - usage.webhook_deliveries_monthly);
  const selected = hooks.slice(0, remaining);
  if (selected.length) await db.from("webhook_deliveries").insert(selected.map((h) => ({ webhook_id: h.id, event_type: eventType, payload })));
}

export async function dispatchPendingWebhooks(limit = 25) {
  const db = createSupabaseAdminClient();
  const { data: rows } = await db.from("webhook_deliveries").select("*, webhooks!inner(url,encrypted_secret,merchant_id)").eq("status", "pending").lte("next_attempt_at", new Date().toISOString()).order("created_at").limit(limit);
  for (const row of rows ?? []) {
    const body = JSON.stringify({ id: row.event_id, type: row.event_type, created_at: row.created_at, data: row.payload });
    const secret = decryptSecret(row.webhooks.encrypted_secret);
    let responseStatus = 0; let responseBody = ""; let delivered = false;
    try {
      const res = await fetch(row.webhooks.url, { method: "POST", headers: { "content-type": "application/json", "x-sellcore-signature": `sha256=${signHmac(secret, body)}`, "x-sellcore-event": row.event_type, "x-sellcore-delivery": row.event_id }, body, signal: AbortSignal.timeout(10000) });
      responseStatus = res.status; responseBody = (await res.text()).slice(0, 2000); delivered = res.ok;
    } catch (e) { responseBody = e instanceof Error ? e.message : "request failed"; }
    const attempt = row.attempt + 1;
    await db.from("webhook_deliveries").update(delivered ? { status: "delivered", delivered_at: new Date().toISOString(), response_status: responseStatus, response_body: responseBody, attempt } : { status: attempt >= 8 ? "failed" : "pending", response_status: responseStatus || null, response_body: responseBody, attempt, next_attempt_at: new Date(Date.now() + Math.min(3600_000, 2 ** attempt * 30_000)).toISOString() }).eq("id", row.id);
    if (delivered) await db.rpc("increment_usage", { p_merchant: row.webhooks.merchant_id, p_metric: "webhook_deliveries", p_amount: 1 });
    if (!delivered && attempt >= 8) await db.from("notifications").insert({ merchant_id: row.webhooks.merchant_id, type: "webhook_failed", title: "Webhook delivery failed", body: `${row.event_type} could not be delivered after ${attempt} attempts.` });
  }
  return rows?.length ?? 0;
}
