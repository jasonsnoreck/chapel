"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPrinciple(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("principles").insert({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/principles");
}

export async function updatePrinciple(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("principles")
    .update({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/principles");
}

export async function setPrincipleActive(id: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("principles").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/principles");
}
