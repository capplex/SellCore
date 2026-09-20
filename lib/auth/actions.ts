"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const authSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

type AuthState = { error?: string; success?: string } | undefined;

export async function loginAction(_state: AuthState, formData: FormData) {
  const parsed = authSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  const next = String(formData.get("next") || "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function registerAction(_state: AuthState, formData: FormData) {
  const parsed = authSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  const requestedNext = String(formData.get("next") || "/onboarding");
  const next = requestedNext.startsWith("/") ? requestedNext : "/onboarding";
  const supabase = await createSupabaseServerClient();
  const callbackNext = next.startsWith("/subscribe/") ? `/onboarding?next=${encodeURIComponent(next)}` : next;
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(callbackNext)}` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(callbackNext);
  return { success: "Check your email to verify your account." };
}

export async function forgotPasswordAction(_state: AuthState, formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });
  return error ? { error: error.message } : { success: "Password reset email sent." };
}

export async function resetPasswordAction(_state: AuthState, formData: FormData) {
  const password = z.string().min(8).max(128).safeParse(formData.get("password"));
  if (!password.success) return { error: "Password must be at least 8 characters." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
