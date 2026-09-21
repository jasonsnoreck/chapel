"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MatchCandidateStatus } from "@/lib/types";

// Foundation only, per the architecture: this records a compatibility
// analysis the founder (or later, AI) has worked out — it never
// approves anything. Status only ever reaches 'founder_reviewed' or
// 'dismissed' here; real approval happens through Decision -> Approved
// Structure -> Professional Review, unchanged.
export async function createMatchCandidate(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const capitalNeedId = String(formData.get("capital_need_id") ?? "");
  const capitalSourceId = String(formData.get("capital_source_id") ?? "");
  if (!capitalNeedId) throw new Error("A match candidate needs a capital need");
  if (!capitalSourceId) throw new Error("A match candidate needs a capital source");

  const toList = (raw: FormDataEntryValue | null) =>
    String(raw ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const { error } = await supabase.from("match_candidates").insert({
    capital_need_id: capitalNeedId,
    capital_source_id: capitalSourceId,
    compatible_dimensions: toList(formData.get("compatible_dimensions")),
    conflicting_dimensions: toList(formData.get("conflicting_dimensions")),
    unknown_dimensions: toList(formData.get("unknown_dimensions")),
    questions_for_founder: String(formData.get("questions_for_founder") ?? "") || null,
    provenance: "founder",
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}

export async function setMatchCandidateStatus(id: string, status: MatchCandidateStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("match_candidates").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}
