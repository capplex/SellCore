import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createBillingCheckout } from "@/lib/payments/billing";

export const dynamic="force-dynamic";

export default async function SubscribePage({params}:{params:Promise<{plan:string}>}){
  const {plan:planSlug}=await params;
  const next="/subscribe/"+encodeURIComponent(planSlug);
  const user=await getUser();

  if(!user) redirect("/register?next="+encodeURIComponent(next));

  const authDb=await createSupabaseServerClient();
  const {data:member}=await authDb
    .from("merchant_members")
    .select("merchant_id")
    .eq("user_id",user.id)
    .limit(1)
    .maybeSingle();

  if(!member?.merchant_id) redirect("/onboarding?next="+encodeURIComponent(next));

  const db=createSupabaseAdminClient();
  const {data:plan}=await db
    .from("platform_plans")
    .select("id,slug,is_free,is_active")
    .eq("slug",planSlug)
    .eq("is_active",true)
    .maybeSingle();

  if(!plan||plan.is_free) redirect("/pricing");

  const url=await createBillingCheckout(member.merchant_id,plan.id,"monthly");
  redirect(url);
}
