"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const starterHome = [
  { id: "hero", type: "hero", eyebrow: "DIGITAL STOREFRONT", heading: "", text: "" },
  { id: "products", type: "products", heading: "Products" },
];

function parseSections(raw: FormDataEntryValue | null) {
  const parsed = JSON.parse(String(raw || "[]"));
  if (!Array.isArray(parsed)) throw new Error("INVALID_THEME_LAYOUT");
  return parsed.slice(0, 100);
}

async function ownedTheme(themeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("merchant_themes").select("*").eq("id", themeId).eq("merchant_id", merchantId).maybeSingle();
  if (error || !data) throw new Error("THEME_NOT_FOUND");
  return { db, theme: data };
}

async function ownedStore(storeId: string, merchantId: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("stores").select("id").eq("id", storeId).eq("merchant_id", merchantId).maybeSingle();
  if (error || !data) throw new Error("STORE_NOT_FOUND");
  return db;
}

export async function createMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const storeId = String(formData.get("storeId"));
  const name = String(formData.get("name") || "Untitled theme").trim().slice(0, 80);
  const db = await ownedStore(storeId, merchantId);
  const { data: current } = await db.from("theme_settings").select("theme_id,settings").eq("store_id", storeId).maybeSingle();
  const { data: created, error } = await db.from("merchant_themes").insert({
    merchant_id: merchantId,
    store_id: storeId,
    name,
    mode: "visual",
    source_platform: "sellcore",
    base_theme_id: current?.theme_id ?? null,
    settings: current?.settings ?? {},
    published_settings: current?.settings ?? {},
    draft_layout: { home: starterHome },
    published_layout: { home: starterHome },
    custom_css: "",
    published_custom_css: "",
    status: "draft",
  }).select("id").single();
  if (error || !created) throw new Error(error?.message || "THEME_CREATE_FAILED");
  revalidatePath("/dashboard/themes");
  redirect(`/dashboard/themes/${created.id}`);
}

export async function saveMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const themeId = String(formData.get("themeId"));
  const { db, theme } = await ownedTheme(themeId, merchantId);
  const home = parseSections(formData.get("layout"));
  const settings = {
    ...(theme.settings ?? {}),
    accent: String(formData.get("accent") || "#E50914"),
    background: String(formData.get("background") || "#050505"),
    text: String(formData.get("text") || "#F5F5F5"),
    radius: String(formData.get("radius") || "8px"),
    font: String(formData.get("font") || "Manrope"),
    headerStyle: String(formData.get("headerStyle") || "standard"),
    cardStyle: String(formData.get("cardStyle") || "bordered"),
    productLayout: String(formData.get("productLayout") || "grid"),
    stylePreset: String(formData.get("stylePreset") || "dark"),
    backgroundStyle: String(formData.get("backgroundStyle") || "solid"),
    buttonStyle: String(formData.get("buttonStyle") || "solid"),
    motion: String(formData.get("motion") || "subtle"),
  };
  const customCss = String(formData.get("customCss") || "").slice(0, 200000);
  const name = String(formData.get("name") || theme.name).trim().slice(0, 80);
  const publishing = String(formData.get("intent") || "") === "publish";
  const nextDraftLayout = { ...(theme.draft_layout ?? {}), home };
  const { error } = await db.from("merchant_themes").update({
    name,
    settings,
    custom_css: customCss,
    draft_layout: nextDraftLayout,
    ...(publishing ? {
      published_layout: nextDraftLayout,
      published_settings: settings,
      published_custom_css: customCss,
      status: "published",
    } : {}),
    updated_at: new Date().toISOString(),
  }).eq("id", themeId);
  if (error) throw new Error(error.message);
  if(publishing) await db.from("theme_settings").update({ custom_theme_id: themeId }).eq("store_id", theme.store_id);
  revalidatePath(`/dashboard/themes/${themeId}`);
  revalidatePath("/dashboard/themes");
  revalidatePath("/store", "layout");
}

export async function publishMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const themeId = String(formData.get("themeId"));
  const { db, theme } = await ownedTheme(themeId, merchantId);
  const { error } = await db.from("merchant_themes").update({
    published_layout: theme.draft_layout,
    published_settings: theme.settings,
    published_custom_css: theme.custom_css,
    status: "published",
    updated_at: new Date().toISOString(),
  }).eq("id", themeId);
  if (error) throw new Error(error.message);
  await db.from("theme_settings").update({ custom_theme_id: themeId }).eq("store_id", theme.store_id);
  revalidatePath("/store", "layout");
  revalidatePath("/dashboard/themes");
  revalidatePath(`/dashboard/themes/${themeId}`);
}

export async function activateMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const themeId = String(formData.get("themeId"));
  const { db, theme } = await ownedTheme(themeId, merchantId);
  if(theme.status!=="published") throw new Error("THEME_NOT_PUBLISHED");
  await db.from("theme_settings").update({ custom_theme_id: themeId }).eq("store_id", theme.store_id);
  revalidatePath("/dashboard/themes");
  revalidatePath("/store", "layout");
}

export async function duplicateMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const themeId = String(formData.get("themeId"));
  const { db, theme } = await ownedTheme(themeId, merchantId);
  const copy = Object.fromEntries(
    Object.entries(theme).filter(([key]) => !["id", "created_at", "updated_at"].includes(key)),
  );
  const { data: created, error } = await db.from("merchant_themes").insert({
    ...copy,
    name: `${theme.name} copy`.slice(0, 80),
    status: "draft",
    source_platform: theme.source_platform || "sellcore",
  }).select("id").single();
  if (error || !created) throw new Error(error?.message || "THEME_DUPLICATE_FAILED");
  revalidatePath("/dashboard/themes");
  redirect(`/dashboard/themes/${created.id}`);
}

export async function deleteMerchantThemeAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const themeId = String(formData.get("themeId"));
  const { db, theme } = await ownedTheme(themeId, merchantId);
  await db.from("theme_settings").update({ custom_theme_id: null }).eq("store_id", theme.store_id).eq("custom_theme_id", themeId);
  await db.from("merchant_themes").delete().eq("id", themeId);
  revalidatePath("/dashboard/themes");
  revalidatePath("/store", "layout");
  redirect("/dashboard/themes");
}
