"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { getAssets, getBusinesses, getNotesFor, getOpportunity, getPrinciples } from "@/lib/queries";

// Deliberately separate from analyzeOpportunity (src/lib/actions/ai.ts):
// this is the richer, business-plan-specific analysis — see
// src/lib/types.ts BusinessPlanAnalysisResult and the migration comment
// on business_plan_analyses for why it's not just a wider AnalysisResult.
export async function analyzeBusinessPlan(opportunityId: string) {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found");

  const planText = opportunity.full_description || opportunity.short_description || "";
  if (!planText.trim()) {
    throw new Error("This opportunity has no description text to analyze as a business plan yet.");
  }

  const [notes, principles, existingBusinesses, existingAssets] = await Promise.all([
    getNotesFor("opportunity", opportunityId),
    getPrinciples(false),
    getBusinesses(),
    getAssets(),
  ]);

  const provider = getAIProvider();
  const result = await provider.analyzeBusinessPlan({
    opportunity,
    planText,
    notes,
    principles,
    existingBusinesses,
    existingAssets,
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("business_plan_analyses").insert({
    opportunity_id: opportunityId,
    provider: provider.name,
    model: provider.model,
    input_context: { notes_count: notes.length, plan_length: planText.length },
    result,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${opportunityId}`);
}
