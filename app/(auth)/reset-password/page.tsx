import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const dynamic="force-dynamic";

export default function Reset(){
  return <>
    <h1 className="text-2xl font-semibold">Choose a new password</h1>
    <p className="mb-6 mt-2 text-sm text-sc-secondary">Use at least 8 characters.</p>
    <PasswordRecoveryForm/>
  </>;
}
