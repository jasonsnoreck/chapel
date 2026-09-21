"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ContributionType,
  InformationAccessLevel,
  InvestmentTargetType,
  InvolvementLevel,
  MandateStatus,
  RightsConfiguration,
  StructureReviewStatus,
} from "@/lib/types";

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_by: user?.id ?? null })
    .eq("key", key);

  if (error) throw new Error(error.message);
  revalidatePath("/investors");
  revalidatePath("/");
}

export async function createInvestorProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("investor_profiles")
    .insert({
      name: String(formData.get("name") ?? ""),
      entity_type: (String(formData.get("entity_type") ?? "individual") as "individual" | "entity") || "individual",
      contact_email: String(formData.get("contact_email") ?? "") || null,
      contact_phone: String(formData.get("contact_phone") ?? "") || null,
      preferred_involvement_level: (String(formData.get("preferred_involvement_level") ?? "") as InvolvementLevel) || null,
      preferred_reporting_frequency: String(formData.get("preferred_reporting_frequency") ?? "") || null,
      preferred_investment_horizon: String(formData.get("preferred_investment_horizon") ?? "") || null,
      investment_interests: String(formData.get("investment_interests") ?? "") || null,
      capabilities_contributions: String(formData.get("capabilities_contributions") ?? "") || null,
      atlas_network_preferences: String(formData.get("atlas_network_preferences") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/investors");
  redirect(`/investors/${data.id}`);
}

export async function updateInvestorProfile(id: string, formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase
    .from("investor_profiles")
    .update({
      name: String(formData.get("name") ?? ""),
      entity_type: (String(formData.get("entity_type") ?? "individual") as "individual" | "entity") || "individual",
      contact_email: String(formData.get("contact_email") ?? "") || null,
      contact_phone: String(formData.get("contact_phone") ?? "") || null,
      relationship_status: String(formData.get("relationship_status") ?? "prospective") as
        | "prospective"
        | "active"
        | "inactive"
        | "declined",
      preferred_involvement_level: (String(formData.get("preferred_involvement_level") ?? "") as InvolvementLevel) || null,
      preferred_reporting_frequency: String(formData.get("preferred_reporting_frequency") ?? "") || null,
      preferred_investment_horizon: String(formData.get("preferred_investment_horizon") ?? "") || null,
      investment_interests: String(formData.get("investment_interests") ?? "") || null,
      capabilities_contributions: String(formData.get("capabilities_contributions") ?? "") || null,
      atlas_network_preferences: String(formData.get("atlas_network_preferences") ?? "") || null,
      qualification_status: String(formData.get("qualification_status") ?? "unverified") as
        | "unverified"
        | "self_attested"
        | "professionally_verified"
        | "not_applicable",
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/investors/${id}`);
  revalidatePath("/investors");
}

function readRightsConfiguration(formData: FormData): RightsConfiguration {
  const flag = (name: string) => formData.get(name) === "on";

  return {
    economics: {
      equity: flag("economics_equity"),
      preferred_economics: flag("economics_preferred_economics"),
      revenue_participation: flag("economics_revenue_participation"),
      profit_participation: flag("economics_profit_participation"),
      debt: flag("economics_debt"),
      hybrid: flag("economics_hybrid"),
      other: flag("economics_other"),
    },
    control: {
      management: flag("control_management"),
      major_event_approval: flag("control_major_event_approval"),
      ordinary_voting: flag("control_ordinary_voting"),
      board_seat: flag("control_board_seat"),
      governance_rights: flag("control_governance_rights"),
    },
    involvement: (String(formData.get("involvement") ?? "") as InvolvementLevel) || undefined,
    liquidity: {
      fixed_maturity: flag("liquidity_fixed_maturity"),
      company_buyback: flag("liquidity_company_buyback"),
      atlas_buyback: flag("liquidity_atlas_buyback"),
      underlying_sale: flag("liquidity_underlying_sale"),
      asset_sale: flag("liquidity_asset_sale"),
      refinancing: flag("liquidity_refinancing"),
      secondary_transfer: flag("liquidity_secondary_transfer"),
      distribution: flag("liquidity_distribution"),
      negotiated_exit: flag("liquidity_negotiated_exit"),
      no_defined_liquidity: flag("liquidity_no_defined_liquidity"),
    },
    information: (String(formData.get("information") ?? "") as InformationAccessLevel) || undefined,
    atlas_access: {
      partner_network: flag("atlas_access_partner_network"),
      office: flag("atlas_access_office"),
      meetings: flag("atlas_access_meetings"),
      events: flag("atlas_access_events"),
      introductions: flag("atlas_access_introductions"),
      educational_sessions: flag("atlas_access_educational_sessions"),
      deal_discussions: flag("atlas_access_deal_discussions"),
      shared_resources: flag("atlas_access_shared_resources"),
      other: flag("atlas_access_other"),
    },
  };
}

export async function createMandate(investorProfileId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `target` arrives as "type:id" (e.g. "project:1234-..."), or bare
  // "atlas"/"other" with no id — same combined-select pattern as
  // src/lib/actions/relationships.ts.
  const targetRaw = String(formData.get("target") ?? "atlas");
  const [targetTypeRaw, targetId] = targetRaw.includes(":") ? targetRaw.split(":") : [targetRaw, null];
  const targetType = (targetTypeRaw as InvestmentTargetType) || "atlas";
  const contributionTypes = formData.getAll("contribution_types").map(String) as ContributionType[];
  const amountRaw = formData.get("investment_amount");
  const approvedStructureId = String(formData.get("approved_structure_id") ?? "") || null;

  const { error } = await supabase.from("investment_mandates").insert({
    investor_profile_id: investorProfileId,
    target_type: targetType,
    target_id: targetType === "atlas" || targetType === "other" ? null : targetId,
    target_note: String(formData.get("target_note") ?? "") || null,
    investment_amount: amountRaw ? Number(amountRaw) : null,
    investment_type: String(formData.get("investment_type") ?? "") || null,
    contribution_types: contributionTypes,
    contribution_notes: String(formData.get("contribution_notes") ?? "") || null,
    rights: readRightsConfiguration(formData),
    term: String(formData.get("term") ?? "") || null,
    special_conditions: String(formData.get("special_conditions") ?? "") || null,
    liquidity_note: String(formData.get("liquidity_note") ?? "") || null,
    approved_structure_id: approvedStructureId,
    documents_note: String(formData.get("documents_note") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/investors/${investorProfileId}`);
}

export async function updateMandateStatus(id: string, investorProfileId: string, status: MandateStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("investment_mandates").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investors/${investorProfileId}`);
}

export async function createApprovedStructure(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiredFieldsRaw = String(formData.get("required_fields") ?? "");
  const requiredFields = requiredFieldsRaw.split(",").map((f) => f.trim()).filter(Boolean);

  const { error } = await supabase.from("approved_structures").insert({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    required_fields: requiredFields,
    prohibited_combinations: String(formData.get("prohibited_combinations") ?? "") || null,
    version: String(formData.get("version") ?? "0.1") || "0.1",
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/investors/structures");
}

// "Approved"/"active" here means the founder has recorded that a
// qualified professional reviewed this structure and approved it — never
// that Atlas (the app, or the founder alone) is granting legal approval.
// Enforced server-side, not just suggested by the UI's ordering: without
// at least one professional_reviews row with approval_status='approved',
// the transition is rejected outright.
const STATUSES_REQUIRING_APPROVED_REVIEW: StructureReviewStatus[] = ["approved", "active"];

export async function setStructureReviewStatus(id: string, review_status: StructureReviewStatus) {
  const supabase = createClient();

  if (STATUSES_REQUIRING_APPROVED_REVIEW.includes(review_status)) {
    const { data: approvedReview, error: reviewError } = await supabase
      .from("professional_reviews")
      .select("id")
      .eq("approved_structure_id", id)
      .eq("approval_status", "approved")
      .limit(1)
      .maybeSingle();
    if (reviewError) throw new Error(reviewError.message);
    if (!approvedReview) {
      throw new Error(
        `Cannot mark this structure "${review_status}" without a professional review recorded with approval status "approved" first. Record that review below, then try again.`
      );
    }
  }

  const { error } = await supabase.from("approved_structures").update({ review_status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investors/structures");
}

export async function createProfessionalReview(approvedStructureId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("professional_reviews").insert({
    approved_structure_id: approvedStructureId,
    reviewer_name: String(formData.get("reviewer_name") ?? ""),
    professional_type: (String(formData.get("professional_type") ?? "other") as
      | "attorney"
      | "accountant"
      | "tax_advisor"
      | "other") || "other",
    review_date: String(formData.get("review_date") ?? "") || new Date().toISOString().slice(0, 10),
    document_reference: String(formData.get("document_reference") ?? "") || null,
    comments: String(formData.get("comments") ?? "") || null,
    approval_status: (String(formData.get("approval_status") ?? "pending") as
      | "pending"
      | "approved"
      | "rejected"
      | "needs_revision") || "pending",
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/investors/structures");
}
