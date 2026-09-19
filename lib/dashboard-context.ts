import "server-only";
import { cookies } from "next/headers";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardContext() {
  const auth = await requireMerchant();
  const db = await createSupabaseServerClient();
  const { data: stores } = await db.from("stores").select("id,name,slug,status,merchant_id").eq("merchant_id", auth.merchantId).order("created_at");
  if (!stores?.length) return { ...auth, stores: [], store: null, db };
  const cookieStore = await cookies();
  const wanted = cookieStore.get("sc_store")?.value;
  const store = stores.find((s) => s.id === wanted) ?? stores[0];
  return { ...auth, stores, store, db };
}
