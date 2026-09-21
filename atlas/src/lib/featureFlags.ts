import { redirect } from "next/navigation";
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

// Single choke point for every /investors* page. Call this first, before
// any other data fetch, so a new page under that route can't ship without
// the gate the way `/investors/new` originally did — the mistake this
// helper exists to make structurally impossible.
export async function requireInvestorProtocolEnabled() {
  const enabled = await isFeatureEnabled("investor_protocol_enabled");
  if (!enabled) redirect("/investors");
}

// Same choke-point pattern for the Capital & Ecosystem module
// (businesses/assets financial profile, capital needs/sources, ecosystem
// relationships, match candidates, intelligence reports). Business plan
// analysis and opportunity provenance/diligence are NOT behind this flag
// — they live on the always-visible opportunity detail page.
export async function requireCapitalEcosystemEnabled() {
  const enabled = await isFeatureEnabled("capital_ecosystem_enabled");
  if (!enabled) redirect("/capital-ecosystem");
}
