"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createDecision(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const opportunity_id = String(formData.get("opportunity_id") ?? "") || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const business_id = String(formData.get("business_id") ?? "") || null;

  const { error } = await supabase.from("decisions").insert({
    subject: String(formData.get("subject") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    reasoning: String(formData.get("reasoning") ?? "") || null,
    decided_at: String(formData.get("decided_at") ?? "") || new Date().toISOString().slice(0, 10),
    review_date: String(formData.get("review_date") ?? "") || null,
    opportunity_id,
    project_id,
    business_id,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/decisions");
  revalidatePath("/");
  if (opportunity_id) revalidatePath(`/opportunities/${opportunity_id}`);
  if (project_id) revalidatePath(`/projects/${project_id}`);

  const returnTo = String(formData.get("return_to") ?? "/decisions");
  redirect(returnTo);
}
