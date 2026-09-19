"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function switchStoreAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const storeId = String(formData.get("storeId") || "");
  const db = createSupabaseAdminClient();
  const { data } = await db.from("stores").select("id").eq("id", storeId).eq("merchant_id", merchantId).maybeSingle();
  if (!data) throw new Error("FORBIDDEN");
  (await cookies()).set("sc_store", storeId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/dashboard");
}
