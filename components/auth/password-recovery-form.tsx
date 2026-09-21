"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoveryState = "loading" | "ready" | "invalid" | "saving";

export function PasswordRecoveryForm(){
  const [state,setState]=useState<RecoveryState>("loading");
  const [error,setError]=useState("");
  const [password,setPassword]=useState("");

  useEffect(()=>{
    let cancelled=false;
    const supabase=createSupabaseBrowserClient();

    async function establishRecoverySession(){
      try{
        const current=await supabase.auth.getSession();
        if(current.data.session){
          if(!cancelled)setState("ready");
          return;
        }

        const url=new URL(window.location.href);
        const code=url.searchParams.get("code");
        if(code){
          const exchanged=await supabase.auth.exchangeCodeForSession(code);
          if(exchanged.error)throw exchanged.error;
          window.history.replaceState({},document.title,"/reset-password");
          if(!cancelled)setState("ready");
          return;
        }

        const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
        const accessToken=hash.get("access_token");
        const refreshToken=hash.get("refresh_token");
        const hashError=hash.get("error_description");
        if(hashError)throw new Error(decodeURIComponent(hashError));

        if(accessToken&&refreshToken){
          const session=await supabase.auth.setSession({
            access_token:accessToken,
            refresh_token:refreshToken,
          });
          if(session.error)throw session.error;
          window.history.replaceState({},document.title,"/reset-password");
          if(!cancelled)setState("ready");
          return;
        }

        if(!cancelled)setState("invalid");
      }catch(err){
        if(cancelled)return;
        setError(err instanceof Error?err.message:"This reset link is invalid or expired.");
        setState("invalid");
      }
    }

    establishRecoverySession();
    return()=>{cancelled=true;};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(password.length<8){
      setError("Password must be at least 8 characters.");
      return;
    }

    setState("saving");
    setError("");
    const supabase=createSupabaseBrowserClient();
    const {error:updateError}=await supabase.auth.updateUser({password});
    if(updateError){
      setError(updateError.message);
      setState("ready");
      return;
    }

    window.location.assign("/dashboard");
  }

  if(state==="loading")return <div className="rounded-lg border border-sc-border bg-[#111] p-4 text-sm text-sc-secondary">Verifying your reset link…</div>;

  if(state==="invalid")return <>
    <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error||"This reset link is invalid or expired."}</div>
    <Link href="/forgot-password" className="mt-4 block rounded-lg bg-sc-red px-4 py-2.5 text-center text-sm font-medium">Send a new reset link</Link>
  </>;

  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm">
      <span className="mb-1.5 block text-sc-secondary">Password</span>
      <input
        type="password"
        value={password}
        onChange={(event)=>setPassword(event.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
    </label>
    {error&&<div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
    <button disabled={state==="saving"} className="w-full rounded-lg bg-sc-red px-4 py-2.5 text-sm font-medium disabled:opacity-60">
      {state==="saving"?"Updating…":"Update password"}
    </button>
  </form>;
}
