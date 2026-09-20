import { AuthForm } from "@/components/auth/auth-form";
import { registerAction } from "@/lib/auth/actions";

export default async function Register({searchParams}:{searchParams:Promise<{next?:string}>}){
  const q=await searchParams;
  return <>
    <h1 className="text-2xl font-semibold">Start selling</h1>
    <p className="mb-6 mt-2 text-sm text-sc-secondary">Create your SellCore account to continue.</p>
    <AuthForm mode="register" next={q.next} action={registerAction}/>
  </>;
}
