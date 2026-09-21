"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types";

export async function updateProject(id: string, formData: FormData) {
  const supabase = createClient();

  const capital = Number(formData.get("capital_invested") ?? 0);
  const time = Number(formData.get("time_invested_hours") ?? 0);

  const { error } = await supabase
    .from("projects")
    .update({
      name: String(formData.get("name") ?? ""),
      objective: String(formData.get("objective") ?? "") || null,
      target_review_date: String(formData.get("target_review_date") ?? "") || null,
      capital_invested: Number.isFinite(capital) ? capital : 0,
      time_invested_hours: Number.isFinite(time) ? time : 0,
      graduation_criteria: String(formData.get("graduation_criteria") ?? "") || null,
      kill_criteria: String(formData.get("kill_criteria") ?? "") || null,
      next_action: String(formData.get("next_action") ?? "") || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  const { data: project } = await supabase.from("projects").select("opportunity_id").eq("id", id).single();

  if (project?.opportunity_id && (status === "graduated" || status === "killed")) {
    await supabase
      .from("opportunities")
      .update({ status: status === "graduated" ? "graduated" : "killed", attention: "archived" })
      .eq("id", project.opportunity_id);
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/");
}
