import { AuthForm } from "@/components/auth/auth-form";
import { magicLinkAction } from "@/lib/auth/actions";

export default async function MagicLink({searchParams}:{searchParams:Promise<{next?:string}>}){
  const q=await searchParams;
  return <>
    <h1 className="text-2xl font-semibold">Sign in by email</h1>
    <p className="mb-6 mt-2 text-sm text-sc-secondary">Enter your email and we’ll send you a one-time magic link. No password reset needed.</p>
    <AuthForm mode="magic" next={q.next} action={magicLinkAction}/>
  </>;
}
