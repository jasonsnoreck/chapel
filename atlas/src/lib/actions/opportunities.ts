"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AttentionState, OpportunityCategory, OpportunityStatus } from "@/lib/types";

// Quick Capture: the founder should never have to fill out a form to get
// an idea into the system. Title + text + timestamp is enough.
export async function quickCapture(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const explicitTitle = String(formData.get("title") ?? "").trim();
  const title = explicitTitle || text.slice(0, 80);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      title,
      short_description: explicitTitle ? text.slice(0, 280) : null,
      full_description: text,
      status: "captured",
      attention: "watch",
      source: "quick_capture",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/inbox");
  revalidatePath("/opportunities");

  return data?.id as string;
}

export async function createOpportunity(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      title: String(formData.get("title") ?? ""),
      short_description: String(formData.get("short_description") ?? "") || null,
      full_description: String(formData.get("full_description") ?? "") || null,
      category: (String(formData.get("category") ?? "other") as OpportunityCategory) || "other",
      source: String(formData.get("source") ?? "") || null,
      tags,
      status: "captured",
      attention: "watch",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/opportunities");
  revalidatePath("/");
  redirect(`/opportunities/${data.id}`);
}

export async function updateOpportunity(id: string, formData: FormData) {
  const supabase = createClient();

  const category = String(formData.get("category") ?? "other") as OpportunityCategory;
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("opportunities")
    .update({
      title: String(formData.get("title") ?? ""),
      short_description: String(formData.get("short_description") ?? "") || null,
      full_description: String(formData.get("full_description") ?? "") || null,
      category,
      source: String(formData.get("source") ?? "") || null,
      tags,
      next_action: String(formData.get("next_action") ?? "") || null,
      founder_assessment: String(formData.get("founder_assessment") ?? "") || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
}

export async function setOpportunityStatus(id: string, status: OpportunityStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("opportunities").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
  revalidatePath("/inbox");
  revalidatePath("/");
}

export async function setOpportunityAttention(id: string, attention: AttentionState) {
  const supabase = createClient();
  const { error } = await supabase.from("opportunities").update({ attention }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
  revalidatePath("/");
}

// Promote to project: the one workflow that turns commitment-free capture
// into an actual commitment. Always an explicit founder action.
export async function promoteToProject(opportunityId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("title")
    .eq("id", opportunityId)
    .single();
  if (oppError) throw new Error(oppError.message);

  const name = String(formData.get("name") ?? "") || `${opportunity.title} project`;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      opportunity_id: opportunityId,
      name,
      objective: String(formData.get("objective") ?? "") || null,
      graduation_criteria: String(formData.get("graduation_criteria") ?? "") || null,
      kill_criteria: String(formData.get("kill_criteria") ?? "") || null,
      next_action: String(formData.get("next_action") ?? "") || null,
      status: "active",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("opportunities").update({ status: "active_project", attention: "now" }).eq("id", opportunityId);

  await supabase.from("decisions").insert({
    subject: opportunity.title,
    decision: `Move "${opportunity.title}" from idea to active project.`,
    reasoning: String(formData.get("reasoning") ?? "") || null,
    opportunity_id: opportunityId,
    project_id: project.id,
    created_by: user?.id ?? null,
  });

  revalidatePath("/opportunities");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}
