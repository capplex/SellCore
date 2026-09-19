import { NextRequest,NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/session";
import { refreshStripeAccount } from "@/lib/payments/connect";
export async function GET(req:NextRequest){const {merchantId}=await requireMerchant();const store=req.nextUrl.searchParams.get("store");if(store)await refreshStripeAccount(store,merchantId);return NextResponse.redirect(new URL("/dashboard/payments",req.url));}
