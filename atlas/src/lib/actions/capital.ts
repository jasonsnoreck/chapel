"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CapitalNeedRequirements,
  CapitalNeedStatus,
  CapitalNeedTargetType,
  CapitalSourceStatus,
  CapitalSourceType,
  CapitalUtilityAssessmentDetail,
  CapitalUtilityTargetType,
  Confidence,
} from "@/lib/types";

export async function createCapitalNeed(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetRaw = String(formData.get("target") ?? "");
  const [targetType, targetId] = targetRaw.split(":") as [CapitalNeedTargetType, string];
  if (!targetType || !targetId) throw new Error("A capital need must have a target");

  const requirements: CapitalNeedRequirements = {};
  const collateral = String(formData.get("collateral_requirements") ?? "");
  const ownership = String(formData.get("ownership_implications") ?? "");
  const control = String(formData.get("control_implications") ?? "");
  const repayment = String(formData.get("repayment_characteristics") ?? "");
  const geography = String(formData.get("geography") ?? "");
  const other = String(formData.get("other_constraints") ?? "");
  if (collateral) requirements.collateral_requirements = collateral;
  if (ownership) requirements.ownership_implications = ownership;
  if (control) requirements.control_implications = control;
  if (repayment) requirements.repayment_characteristics = repayment;
  if (geography) requirements.geography = geography;
  if (other) requirements.other_constraints = other;

  const { error } = await supabase.from("capital_needs").insert({
    target_type: targetType,
    target_id: targetId,
    amount: formData.get("amount") ? Number(formData.get("amount")) : null,
    purpose: String(formData.get("purpose") ?? "") || null,
    timing: String(formData.get("timing") ?? "") || null,
    requirements,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}

export async function setCapitalNeedStatus(id: string, status: CapitalNeedStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("capital_needs").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}

export async function createCapitalSource(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sourceRaw = String(formData.get("linked_source") ?? "");
  const [linkedType, linkedId] = sourceRaw.includes(":") ? sourceRaw.split(":") : [null, null];

  const { data, error } = await supabase
    .from("capital_sources")
    .insert({
      capital_source_type: String(formData.get("capital_source_type") ?? "other") as CapitalSourceType,
      investment_mandate_id: linkedType === "investment_mandate" ? linkedId : null,
      source_business_id: linkedType === "business" ? linkedId : null,
      source_asset_id: linkedType === "asset" ? linkedId : null,
      name: String(formData.get("name") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const amountAvailable = formData.get("amount_available");
  if (amountAvailable) {
    await supabase.from("capital_availability").insert({
      capital_source_id: data.id,
      amount_available: Number(amountAvailable),
      assessed_by: "founder",
      created_by: user?.id ?? null,
    });
  }

  revalidatePath("/capital");
}

export async function setCapitalSourceStatus(id: string, status: CapitalSourceStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("capital_sources").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}

export async function recordCapitalAvailability(capitalSourceId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("capital_availability").insert({
    capital_source_id: capitalSourceId,
    amount_available: formData.get("amount_available") ? Number(formData.get("amount_available")) : null,
    as_of_date: String(formData.get("as_of_date") ?? "") || new Date().toISOString().slice(0, 10),
    notes: String(formData.get("notes") ?? "") || null,
    assessed_by: "founder",
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/capital");
}

const CAPITAL_UTILITY_DIMENSIONS: (keyof CapitalUtilityAssessmentDetail)[] = [
  "borrowing_capacity",
  "collateral_quality",
  "lending_accessibility",
  "liquidity",
  "cash_flow_capacity",
  "equity_generation_potential",
  "ability_to_support_other_atlas_business",
  "encumbrance_tolerance",
  "strategic_importance",
  "saleability",
];

// Analytical labels only (low/medium/high), never a promise of
// financing — see README. Recorded by the founder here; an AI-produced
// version would use the same shape with assessed_by='ai'.
export async function recordCapitalUtilityAssessment(
  targetType: CapitalUtilityTargetType,
  targetId: string,
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const assessment: CapitalUtilityAssessmentDetail = {};
  for (const dim of CAPITAL_UTILITY_DIMENSIONS) {
    const value = String(formData.get(dim) ?? "") as Confidence | "";
    if (value) assessment[dim] = value;
  }

  const { error } = await supabase.from("capital_utility_assessments").insert({
    target_type: targetType,
    target_id: targetId,
    assessed_by: "founder",
    assessment,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/${targetType === "asset" ? "assets" : "businesses"}/${targetId}`);
}
