import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hostOnly(host:string){return host.split(",")[0].trim().toLowerCase().split(":")[0];}
export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(url&&anon){const supabase=createServerClient(url,anon,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});const {data:{user}}=await supabase.auth.getUser();const protectedPath=request.nextUrl.pathname.startsWith("/dashboard")||request.nextUrl.pathname.startsWith("/admin")||request.nextUrl.pathname.startsWith("/onboarding")||request.nextUrl.pathname.startsWith("/account");if(protectedPath&&!user){const login=request.nextUrl.clone();login.pathname="/login";login.searchParams.set("next",request.nextUrl.pathname+request.nextUrl.search);return NextResponse.redirect(login);}}
  const path=request.nextUrl.pathname;if(path.startsWith("/_next")||path.startsWith("/api")||path.startsWith("/assets")||path.includes("."))return response;
  const rawHost=request.headers.get("host")||"";const hostname=hostOnly(rawHost);const configured=(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN||"").split(":")[0].toLowerCase();if(!configured)return response;
  const mainHosts=new Set([configured,`www.${configured}`,`app.${configured}`]);if(mainHosts.has(hostname))return response;
  if(hostname.endsWith(`.${configured}`)){const slug=hostname.slice(0,-1*(configured.length+1)).split(".")[0];if(slug&&slug!=="www"&&slug!=="app"){if(["/account","/login","/register","/forgot-password","/reset-password"].some((prefix)=>path===prefix||path.startsWith(prefix+"/"))){const target=new URL(path+request.nextUrl.search,process.env.NEXT_PUBLIC_APP_URL||`https://${configured}`);return NextResponse.redirect(target);}const rewrite=request.nextUrl.clone();rewrite.pathname=`/store/${encodeURIComponent(slug)}${path==="/"?"":path}`;return NextResponse.rewrite(rewrite);}}
  if(hostname!=="localhost"&&hostname!=="127.0.0.1"){const rewrite=request.nextUrl.clone();rewrite.pathname=`/domain/${encodeURIComponent(hostname)}${path==="/"?"":path}`;return NextResponse.rewrite(rewrite);}
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|assets/).*)"]};
