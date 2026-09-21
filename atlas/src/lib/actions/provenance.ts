"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DiligenceItemStatus, DiligenceItemType, DiscoveryChannel, InformationTier } from "@/lib/types";

export async function upsertOpportunityProvenance(opportunityId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("opportunity_provenance")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  const payload = {
    opportunity_id: opportunityId,
    discovery_channel: (String(formData.get("discovery_channel") ?? "founder") as DiscoveryChannel) || "founder",
    information_tier: (String(formData.get("information_tier") ?? "discovery") as InformationTier) || "discovery",
    still_available: formData.get("still_available") === "on",
    source_url: String(formData.get("source_url") ?? "") || null,
    source_reference: String(formData.get("source_reference") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    last_observed_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("opportunity_provenance").update(payload).eq("id", existing.id)
    : await supabase.from("opportunity_provenance").insert({ ...payload, created_by: user?.id ?? null });

  if (error) throw new Error(error.message);
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function addDiligenceItem(opportunityId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("diligence_items").insert({
    opportunity_id: opportunityId,
    item_type: String(formData.get("item_type") ?? "other") as DiligenceItemType,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function setDiligenceItemStatus(id: string, opportunityId: string, status: DiligenceItemStatus) {
  const supabase = createClient();
  const update: { status: DiligenceItemStatus; received_at?: string } = { status };
  if (status === "received") update.received_at = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("diligence_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/opportunities/${opportunityId}`);
}
