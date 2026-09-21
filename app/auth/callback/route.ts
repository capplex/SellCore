import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const flowId=url.searchParams.get("sb_flow_id");
  const requestedNext=url.searchParams.get("next")||"/dashboard";
  const next=requestedNext.startsWith("/")?requestedNext:"/dashboard";

  if(!code){
    const target=new URL("/forgot-password",url.origin);
    target.searchParams.set("error","invalid_or_expired");
    return NextResponse.redirect(target);
  }

  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.auth.exchangeCodeForSession(
    code,
    flowId?{flowId}:undefined,
  );

  if(error){
    const target=new URL("/forgot-password",url.origin);
    target.searchParams.set("error","invalid_or_expired");
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL(next,url.origin));
}
