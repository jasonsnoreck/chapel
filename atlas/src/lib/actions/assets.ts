"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AssetStatus, AssetType, OwnershipType } from "@/lib/types";

export async function createAsset(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const businessId = String(formData.get("business_id") ?? "") || null;
  const projectId = String(formData.get("project_id") ?? "") || null;

  const { data, error } = await supabase
    .from("assets")
    .insert({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      asset_type: (String(formData.get("asset_type") ?? "other") as AssetType) || "other",
      ownership_type: (String(formData.get("ownership_type") ?? "owned") as OwnershipType) || "owned",
      business_id: businessId,
      project_id: projectId,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/assets");
  redirect(`/assets/${data.id}`);
}

export async function updateAsset(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("assets")
    .update({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      status: (String(formData.get("status") ?? "active") as AssetStatus) || "active",
      asset_type: (String(formData.get("asset_type") ?? "other") as AssetType) || "other",
      ownership_type: (String(formData.get("ownership_type") ?? "owned") as OwnershipType) || "owned",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/assets/${id}`);
  revalidatePath("/assets");
}
