"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import {
  getAnalysesFor,
  getBusinesses,
  getDecisionsFor,
  getNotesFor,
  getOpportunity,
  getPrinciples,
  getProjects,
  getRelatedItems,
} from "@/lib/queries";

export async function analyzeOpportunity(opportunityId: string) {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found");

  const [notes, principles, relevantDecisions, related, allProjects, allBusinesses] = await Promise.all([
    getNotesFor("opportunity", opportunityId),
    getPrinciples(false),
    getDecisionsFor("opportunity", opportunityId),
    getRelatedItems("opportunity", opportunityId),
    getProjects(),
    getBusinesses(),
  ]);

  const relatedProjectIds = new Set(related.filter((r) => r.type === "project").map((r) => r.id));
  const relatedProjects = allProjects.filter((p) => relatedProjectIds.has(p.id));

  const relatedBusinessIds = new Set(related.filter((r) => r.type === "business").map((r) => r.id));
  const relatedBusinesses = allBusinesses.filter((b) => relatedBusinessIds.has(b.id));

  const provider = getAIProvider();
  const result = await provider.analyzeOpportunity({
    opportunity,
    notes,
    principles,
    relatedProjects,
    relatedBusinesses,
    relevantDecisions,
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("ai_analyses").insert({
    opportunity_id: opportunityId,
    provider: provider.name,
    model: provider.model,
    input_context: { notes_count: notes.length, principles_count: principles.length },
    result,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function getAnalysisHistory(opportunityId: string) {
  return getAnalysesFor(opportunityId);
}
