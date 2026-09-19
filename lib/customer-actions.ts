"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/payments/stripe";

async function ownedSubscription(id:string,userId:string){const db=createSupabaseAdminClient();const {data:s}=await db.from("subscriptions").select("*,order_items!inner(orders!inner(customer_id,customers!inner(auth_user_id)))").eq("id",id).eq("order_items.orders.customers.auth_user_id",userId).maybeSingle();if(!s)throw new Error("FORBIDDEN");const {data:a}=await db.from("payment_accounts").select("provider_account_id").eq("store_id",s.store_id).eq("provider","stripe").single();if(!a)throw new Error("PAYMENT_ACCOUNT_NOT_FOUND");return {db,s,accountId:a.provider_account_id};}
export async function cancelCustomerSubscriptionAction(formData:FormData){const user=await requireUser("/account");const id=String(formData.get("subscriptionId"));const {db,s,accountId}=await ownedSubscription(id,user.id);await getStripe().subscriptions.update(s.provider_subscription_id,{cancel_at_period_end:true},{stripeAccount:accountId});await db.from("subscriptions").update({cancel_at_period_end:true}).eq("id",id);revalidatePath("/account");}
export async function reactivateCustomerSubscriptionAction(formData:FormData){const user=await requireUser("/account");const id=String(formData.get("subscriptionId"));const {db,s,accountId}=await ownedSubscription(id,user.id);await getStripe().subscriptions.update(s.provider_subscription_id,{cancel_at_period_end:false},{stripeAccount:accountId});await db.from("subscriptions").update({cancel_at_period_end:false}).eq("id",id);revalidatePath("/account");}
