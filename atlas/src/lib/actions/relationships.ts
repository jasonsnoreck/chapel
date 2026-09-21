"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RelatableType } from "@/lib/types";

export async function linkItems(
  fromType: RelatableType,
  fromId: string,
  toType: RelatableType,
  toId: string,
  revalidate: string
) {
  if (fromType === toType && fromId === toId) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("relationships")
    .upsert(
      { from_type: fromType, from_id: fromId, to_type: toType, to_id: toId, created_by: user?.id ?? null },
      { onConflict: "from_type,from_id,to_type,to_id", ignoreDuplicates: true }
    );

  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
}

// Used directly from a <form>: the target (type + id) is chosen at submit
// time via a select, so it arrives through formData rather than a bound arg.
export async function createRelationshipFromForm(
  fromType: RelatableType,
  fromId: string,
  revalidate: string,
  formData: FormData
) {
  const target = String(formData.get("target") ?? "");
  const [toType, toId] = target.split(":") as [RelatableType, string];
  if (!toType || !toId) return;
  await linkItems(fromType, fromId, toType, toId, revalidate);
}

export async function unlinkItems(relationshipId: string, revalidate: string) {
  const supabase = createClient();
  const { error } = await supabase.from("relationships").delete().eq("id", relationshipId);
  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
}
