"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PredictionStatus, VarianceReason } from "@/lib/types";

// Evaluating a prediction: "hasn't happened yet" is not failure. Status
// transitions here are the only place expected_outcome gets compared
// against reality — see README for why expired/unable_to_evaluate are
// kept distinct from contradicted.
export async function evaluatePrediction(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const status = String(formData.get("status") ?? "") as PredictionStatus;
  if (!status) throw new Error("A status is required to evaluate a prediction");

  const isTerminal = ["validated", "contradicted", "expired", "unable_to_evaluate"].includes(status);

  const { error } = await supabase
    .from("predictions")
    .update({
      status,
      observed_outcome: String(formData.get("observed_outcome") ?? "") || null,
      variance: String(formData.get("variance") ?? "") || null,
      variance_reason: (String(formData.get("variance_reason") ?? "") as VarianceReason) || null,
      evaluated_at: isTerminal ? new Date().toISOString() : null,
      evaluated_by: isTerminal ? (user?.id ?? null) : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/intelligence");
}
