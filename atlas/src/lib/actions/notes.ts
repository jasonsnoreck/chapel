"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NoteKind } from "@/lib/types";

export async function createNote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const opportunity_id = String(formData.get("opportunity_id") ?? "") || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const business_id = String(formData.get("business_id") ?? "") || null;
  const kind = (String(formData.get("kind") ?? "note") as NoteKind) || "note";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { error } = await supabase.from("notes").insert({
    body,
    kind,
    opportunity_id,
    project_id,
    business_id,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  if (opportunity_id) revalidatePath(`/opportunities/${opportunity_id}`);
  if (project_id) revalidatePath(`/projects/${project_id}`);
}
