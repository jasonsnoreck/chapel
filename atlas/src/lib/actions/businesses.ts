"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BusinessStatus } from "@/lib/types";

export async function createBusiness(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/businesses");
  redirect(`/businesses/${data.id}`);
}

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      status: (String(formData.get("status") ?? "active") as BusinessStatus) || "active",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/businesses/${id}`);
  revalidatePath("/businesses");
}
