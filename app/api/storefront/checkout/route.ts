import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getCartSnapshot,resolveStore } from "@/lib/cart";
import { createStoreCheckout } from "@/lib/payments/checkout";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const schema=z.object({storeSlug:z.string(),email:z.string().email(),name:z.string().max(100).optional(),couponCode:z.string().max(80).nullable().optional()});
export async function POST(req:NextRequest){try{const body=schema.parse(await req.json());const store=await resolveStore(body.storeSlug);const raw=req.cookies.get(`sc_cart_${store.id.slice(0,8)}`)?.value;const snap=await getCartSnapshot(store.id,raw);if(!snap?.items.length)throw new Error("CART_EMPTY");const items=snap.items.map(i=>({productId:i.product_id,variantId:i.variant_id,quantity:i.quantity}));const result=await createStoreCheckout({...body,items});await createSupabaseAdminClient().from("analytics_events").insert({store_id:store.id,event_type:"checkout_start"});const res=NextResponse.json({url:result.url});res.cookies.delete(`sc_cart_${store.id.slice(0,8)}`);return res;}catch(e){const message=e instanceof Error?e.message:"CHECKOUT_FAILED";return NextResponse.json({error:message},{status:400});}}
