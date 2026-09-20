import { NextRequest,NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/session";
import { refreshStripeAccount } from "@/lib/payments/connect";

export async function GET(req:NextRequest){
  const {merchantId}=await requireMerchant();
  const store=req.nextUrl.searchParams.get("store");
  if(!store)return NextResponse.redirect(new URL("/dashboard/payments?stripe_error=connect_failed",req.url));

  try{
    await refreshStripeAccount(store,merchantId);
    return NextResponse.redirect(new URL("/dashboard/payments?connected=1",req.url));
  }catch{
    return NextResponse.redirect(new URL("/dashboard/payments?stripe_error=connect_failed",req.url));
  }
}
