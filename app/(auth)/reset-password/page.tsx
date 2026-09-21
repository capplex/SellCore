import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/lib/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Reset(){
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    return <>
      <h1 className="text-2xl font-semibold">Reset link expired or invalid</h1>
      <p className="mt-2 text-sm leading-6 text-sc-secondary">Request a new password reset email and open the newest link.</p>
      <Link href="/forgot-password" className="mt-6 block rounded-lg bg-sc-red px-4 py-2.5 text-center text-sm font-medium">Send a new reset link</Link>
    </>;
  }

  return <>
    <h1 className="text-2xl font-semibold">Choose a new password</h1>
    <p className="mb-6 mt-2 text-sm text-sc-secondary">Use at least 8 characters.</p>
    <AuthForm mode="reset" action={resetPasswordAction}/>
  </>;
}
