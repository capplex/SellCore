"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type State = { error?: string; success?: string } | undefined;
type Action = (state: State, formData: FormData) => Promise<State>;
export function AuthForm({ action, mode, next }: { action: Action; mode:"login"|"register"|"forgot"|"reset"; next?:string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return <form action={formAction} className="space-y-4">
    {next && <input type="hidden" name="next" value={next}/>} 
    {mode!=="reset" && <label className="block text-sm"><span className="mb-1.5 block text-sc-secondary">Email</span><input type="email" name="email" required autoComplete="email"/></label>}
    {mode!=="forgot" && <label className="block text-sm"><span className="mb-1.5 block text-sc-secondary">Password</span><input type="password" name="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"}/></label>}
    {state?.error && <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{state.error}</div>}
    {state?.success && <div className="rounded-lg border border-sc-border bg-[#111] p-3 text-sm text-sc-secondary">{state.success}</div>}
    <Button className="w-full" disabled={pending}>{pending?"Working…":mode==="login"?"Log in":mode==="register"?"Create account":mode==="forgot"?"Send reset link":"Update password"}</Button>
    {mode==="login" && <div className="flex justify-between text-sm text-sc-secondary"><Link href="/register">Create account</Link><Link href="/forgot-password">Forgot password?</Link></div>}
    {mode==="register" && <div className="text-center text-sm text-sc-secondary">Already have an account? <Link className="text-white" href="/login">Log in</Link></div>}
  </form>
}
