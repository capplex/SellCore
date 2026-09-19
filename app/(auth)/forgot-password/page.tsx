import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/lib/auth/actions";
export default function Forgot(){return <><h1 className="text-2xl font-semibold">Reset password</h1><p className="mb-6 mt-2 text-sm text-sc-secondary">We’ll send a secure reset link.</p><AuthForm mode="forgot" action={async (_s,f)=>forgotPasswordAction(f)}/></>}
