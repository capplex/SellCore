import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LimitKey =
  | "stores" | "products" | "orders_monthly" | "customers" | "storage_mb"
  | "api_requests_minute" | "webhook_deliveries_monthly" | "custom_domains"
  | "team_members" | "analytics_retention_days" | "digital_downloads_monthly" | "product_variants";

type FeatureKey =
  | "basic_storefront" | "basic_analytics" | "reviews" | "custom_domain"
  | "advanced_themes" | "advanced_analytics" | "api" | "webhooks"
  | "custom_branding" | "priority_support";

export async function getMerchantPlan(merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data: subscription } = await db
    .from("merchant_subscriptions")
    .select("*, platform_plans(*)")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  if (subscription) return subscription;
  const { data: free } = await db.from("platform_plans").select("*").eq("is_free", true).eq("is_active", true).single();
  if (!free) throw new Error("No active Free plan is configured.");
  return { merchant_id: merchantId, plan_id: free.id, status: "free", billing_interval: "none", platform_plans: free };
}

export async function getPlanLimits(merchantId: string) {
  const db = createSupabaseAdminClient();
  const plan = await getMerchantPlan(merchantId);
  const { data } = await db.from("plan_limits").select("limit_key,limit_value").eq("plan_id", plan.plan_id);
  return Object.fromEntries((data ?? []).map((x) => [x.limit_key, x.limit_value === null ? Infinity : Number(x.limit_value)])) as Record<LimitKey, number>;
}

export async function getPlanFeatures(merchantId: string) {
  const db = createSupabaseAdminClient();
  const plan = await getMerchantPlan(merchantId);
  const { data } = await db.from("plan_features").select("feature_key,enabled").eq("plan_id", plan.plan_id);
  return Object.fromEntries((data ?? []).map((x) => [x.feature_key, x.enabled])) as Record<FeatureKey, boolean>;
}

export async function getMerchantUsage(merchantId: string) {
  const db = createSupabaseAdminClient();
  const [{ count: stores }, { data: storeRows }, { data: monthUsage }, { count: members }] = await Promise.all([
    db.from("stores").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId),
    db.from("stores").select("id").eq("merchant_id", merchantId),
    db.from("merchant_usage").select("metric_key,metric_value").eq("merchant_id", merchantId).eq("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)),
    db.from("merchant_members").select("user_id", { count: "exact", head: true }).eq("merchant_id", merchantId),
  ]);
  const storeIds = (storeRows ?? []).map((s) => s.id);
  const [{ count: products }, { count: customers }, { count: domains }] = storeIds.length
    ? await Promise.all([
        db.from("products").select("id", { count: "exact", head: true }).in("store_id", storeIds),
        db.from("customers").select("id", { count: "exact", head: true }).in("store_id", storeIds),
        db.from("domains").select("id", { count: "exact", head: true }).in("store_id", storeIds),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }];
  const monthly = Object.fromEntries((monthUsage ?? []).map((x) => [x.metric_key, Number(x.metric_value)]));
  return {
    stores: stores ?? 0,
    products: products ?? 0,
    customers: customers ?? 0,
    custom_domains: domains ?? 0,
    team_members: members ?? 0,
    orders_monthly: monthly.orders ?? 0,
    api_requests_monthly: monthly.api_requests ?? 0,
    webhook_deliveries_monthly: monthly.webhook_deliveries ?? 0,
    digital_downloads_monthly: monthly.digital_downloads ?? 0,
    storage_mb: monthly.storage_mb ?? 0,
  };
}

export async function canUseFeature(merchantId: string, feature: FeatureKey) {
  const f = await getPlanFeatures(merchantId);
  return Boolean(f[feature]);
}

export async function assertFeature(merchantId: string, feature: FeatureKey) {
  if (!(await canUseFeature(merchantId, feature))) throw new Error(`PLAN_FEATURE_REQUIRED:${feature}`);
}

export async function canCreateWithinLimit(merchantId: string, limit: LimitKey, current?: number) {
  const limits = await getPlanLimits(merchantId);
  const usage = current === undefined ? await getMerchantUsage(merchantId) : null;
  const used = current ?? Number((usage as Record<string, number>)[limit] ?? 0);
  const max = limits[limit] ?? 0;
  return { allowed: max === Infinity || used < max, used, limit: max };
}

export const canCreateProduct = (merchantId: string) => canCreateWithinLimit(merchantId, "products");
export const canCreateStore = (merchantId: string) => canCreateWithinLimit(merchantId, "stores");
export const canUseCustomDomain = (merchantId: string) => assertFeature(merchantId, "custom_domain");
export const canUseApi = (merchantId: string) => assertFeature(merchantId, "api");
export const canUseWebhooks = (merchantId: string) => assertFeature(merchantId, "webhooks");
export const canUseAdvancedAnalytics = (merchantId: string) => assertFeature(merchantId, "advanced_analytics");
export const canUseCustomTheme = (merchantId: string) => assertFeature(merchantId, "advanced_themes");
export const canAddTeamMember = (merchantId: string) => canCreateWithinLimit(merchantId, "team_members");
