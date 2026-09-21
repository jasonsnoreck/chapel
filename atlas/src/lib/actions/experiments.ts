"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExperiment(projectId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cost = formData.get("cost") ? Number(formData.get("cost")) : null;
  const timeHours = formData.get("time_hours") ? Number(formData.get("time_hours")) : null;

  const { error } = await supabase.from("experiments").insert({
    project_id: projectId,
    hypothesis: String(formData.get("hypothesis") ?? ""),
    action: String(formData.get("action") ?? "") || null,
    cost,
    time_hours: timeHours,
    expected_result: String(formData.get("expected_result") ?? "") || null,
    date: String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10),
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function recordExperimentResult(experimentId: string, projectId: string, formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase
    .from("experiments")
    .update({
      actual_result: String(formData.get("actual_result") ?? "") || null,
      learning: String(formData.get("learning") ?? "") || null,
    })
    .eq("id", experimentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}
