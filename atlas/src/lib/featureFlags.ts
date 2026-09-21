import { createClient } from "@/lib/supabase/server";

// Feature flags are read from the DB (not env vars) so the founder can
// flip them at runtime without a redeploy. Unknown/missing keys default
// to disabled — a flag should never silently turn itself on.
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  return data?.enabled ?? false;
}

export async function getFeatureFlag(key: string) {
  const supabase = createClient();
  const { data } = await supabase.from("feature_flags").select("*").eq("key", key).maybeSingle();
  return data;
}
