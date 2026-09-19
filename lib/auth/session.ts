import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireMerchant() {
  const user = await requireUser("/dashboard");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("merchant_members")
    .select("merchant_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) redirect("/onboarding");
  return { user, merchantId: data.merchant_id as string, role: data.role as string };
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("users").select("platform_role").eq("id", user.id).single();
  if (data?.platform_role !== "admin") redirect("/dashboard");
  return user;
}
