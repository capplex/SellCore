import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder } from "@/lib/fulfillment";
import { enqueueWebhookEvent } from "@/lib/webhooks/outgoing";
import { getEmailProvider } from "@/lib/email";

export const runtime = "nodejs";

async function merchantForStore(storeId:string){const db=createSupabaseAdminClient();const {data}=await db.from("stores").select("merchant_id,name").eq("id",storeId).single();return data;}

export async function POST(req:Request){
  const secret=serverEnv().STRIPE_CONNECT_WEBHOOK_SECRET;
  if(!secret)return NextResponse.json({error:"Webhook not configured"},{status:503});
  const signature=req.headers.get("stripe-signature");
  if(!signature)return NextResponse.json({error:"Missing signature"},{status:400});
  let event:Stripe.Event;
  try{event=getStripe().webhooks.constructEvent(await req.text(),signature,secret);}catch{return NextResponse.json({error:"Invalid signature"},{status:400});}
  const db=createSupabaseAdminClient();
  try{
    if(event.type==="checkout.session.completed"){
      const session=event.data.object as Stripe.Checkout.Session;
      const orderId=session.metadata?.order_id;
      const storeId=session.metadata?.store_id;
      if(orderId&&storeId){
        const paymentIntent=typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id??null;
        const {data:changed}=await db.from("orders").update({payment_status:"paid",paid_at:new Date().toISOString(),payment_provider_payment_id:paymentIntent}).eq("id",orderId).eq("store_id",storeId).eq("payment_status","pending").select("id,total_minor,currency,customer_id,coupon_id").maybeSingle();
        if(changed){
          if(changed.coupon_id&&changed.customer_id)await db.from("coupon_redemptions").insert({coupon_id:changed.coupon_id,customer_id:changed.customer_id,order_id:orderId,amount_minor:0});
          const merchant=await merchantForStore(storeId);
          if(merchant){await db.rpc("increment_usage",{p_merchant:merchant.merchant_id,p_metric:"orders",p_amount:1});await db.from("notifications").insert({merchant_id:merchant.merchant_id,store_id:storeId,type:"order.paid",title:"Payment received",body:`Order ${orderId.slice(0,8)} is paid.`,data:{order_id:orderId}});await enqueueWebhookEvent(merchant.merchant_id,"order.paid",{order_id:orderId,store_id:storeId,total_minor:changed.total_minor,currency:changed.currency});}
          await db.from("analytics_events").insert({store_id:storeId,event_type:"purchase",order_id:orderId});
          if(session.subscription){const subId=typeof session.subscription==="string"?session.subscription:session.subscription.id;const {data:subItems}=await db.from("order_items").select("id").eq("order_id",orderId).eq("product_type","subscription");for(const item of subItems??[])await db.from("subscriptions").upsert({order_item_id:item.id,store_id:storeId,customer_id:changed.customer_id,provider:"stripe",provider_subscription_id:subId,status:"active",started_at:new Date().toISOString()},{onConflict:"order_item_id"});}
          await fulfillOrder(orderId);
          if(merchant)await enqueueWebhookEvent(merchant.merchant_id,"order.fulfilled",{order_id:orderId,store_id:storeId});
          const {data:customer}=changed.customer_id?await db.from("customers").select("email").eq("id",changed.customer_id).single():{data:null};
          if(customer?.email)await getEmailProvider().send({to:customer.email,subject:`Order confirmed · ${merchant?.name??"Store"}`,html:`<p>Your payment was confirmed.</p><p>Order: ${orderId}</p><p>Open your SellCore account or the secure checkout completion page to access delivery.</p>`});
        }
      }
    } else if(event.type==="checkout.session.expired"){
      const session=event.data.object as Stripe.Checkout.Session;const orderId=session.metadata?.order_id;if(orderId){await db.rpc("release_order_reservations",{p_order:orderId});await db.from("orders").update({payment_status:"failed"}).eq("id",orderId).eq("payment_status","pending");}
    } else if(event.type==="customer.subscription.updated" || event.type==="customer.subscription.deleted") {
      const sub=event.data.object as Stripe.Subscription;
      const p=sub as unknown as {current_period_end?:number;items?:{data?:{current_period_end?:number}[]}};
      const end=p.current_period_end??p.items?.data?.[0]?.current_period_end;
      await db.from("subscriptions").update({status:sub.status,current_period_end:end?new Date(end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end,canceled_at:sub.canceled_at?new Date(sub.canceled_at*1000).toISOString():null}).eq("provider_subscription_id",sub.id);
    } else if(event.type==="charge.refunded"){
      const charge=event.data.object as Stripe.Charge;const pi=typeof charge.payment_intent==="string"?charge.payment_intent:charge.payment_intent?.id;if(pi)await db.from("orders").update({payment_status:"refunded",fulfillment_status:"refunded"}).eq("payment_provider_payment_id",pi);
    } else if(event.type==="account.updated"){
      const account=event.data.object as Stripe.Account;await db.from("payment_accounts").update({charges_enabled:Boolean(account.charges_enabled),details_submitted:Boolean(account.details_submitted)}).eq("provider","stripe").eq("provider_account_id",account.id);
    }
    return NextResponse.json({received:true});
  }catch(error){console.error("Stripe merchant webhook error",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Webhook processing failed"},{status:500});}
}
