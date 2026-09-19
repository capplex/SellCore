import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/lib/auth/actions";
export default function Reset(){return <><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mb-6 mt-2 text-sm text-sc-secondary">Use at least 8 characters.</p><AuthForm mode="reset" action={resetPasswordAction}/></>}