import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/lib/auth/actions";

export default async function Forgot({searchParams}:{searchParams:Promise<{error?:string}>}){
  const q=await searchParams;
  return <>
    <h1 className="text-2xl font-semibold">Reset password</h1>
    <p className="mb-6 mt-2 text-sm text-sc-secondary">We’ll send a secure reset link.</p>
    {q.error==="invalid_or_expired"&&<div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">That reset link is invalid or expired. Send yourself a new one below.</div>}
    <AuthForm mode="forgot" action={forgotPasswordAction}/>
  </>;
}
