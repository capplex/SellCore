import { AuthForm } from "@/components/auth/auth-form";
import { registerAction } from "@/lib/auth/actions";
export default function Register(){return <><h1 className="text-2xl font-semibold">Start selling</h1><p className="mb-6 mt-2 text-sm text-sc-secondary">Create an account. No platform payment method required for Free.</p><AuthForm mode="register" action={async (_s,f)=>registerAction(f)}/></>}
