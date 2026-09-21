"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next || "/");
}

// Atlas V0.1 is single-founder: signup is a one-time bootstrap, not an
// open door. `founder_exists()` (see supabase/migrations/0001_init.sql)
// is the source of truth — RLS enforces the same boundary independently,
// so this check is a clean error message, not the actual security
// mechanism. Even if this check were bypassed entirely, a second account
// still couldn't read or write any Atlas data.
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();

  const { data: founderAlreadyExists, error: checkError } = await supabase.rpc("founder_exists");
  if (checkError) {
    redirect(`/login?error=${encodeURIComponent(checkError.message)}`);
  }
  if (founderAlreadyExists) {
    redirect(
      `/login?error=${encodeURIComponent("Atlas already has a founder account. Sign in above, or contact the founder for access.")}`
    );
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?notice=Check%20your%20email%20to%20confirm%2C%20then%20sign%20in.");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
