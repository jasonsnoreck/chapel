"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { getAssets, getBusinesses, getPrinciples } from "@/lib/queries";
import { getAllEcosystemRelationships } from "@/lib/queries-capital";
import type {
  EcosystemNodeSummary,
} from "@/lib/ai/types";
import type { EcosystemNodeType, EcosystemRelationshipType, EcosystemToType, ExternalEntityType, ValidationStatus } from "@/lib/types";

export async function createExternalEntity(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("external_entities").insert({
    name: String(formData.get("name") ?? ""),
    entity_type: (String(formData.get("entity_type") ?? "company") as ExternalEntityType) || "company",
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/ecosystem");
}

// The "to" side of a relationship can be an existing Atlas node, an
// existing external entity, or a brand-new external entity named inline
// (created here first, then linked) — same combined-select-plus-inline-
// create pattern already used for related-items linking elsewhere.
async function insertEcosystemRelationship(fromType: EcosystemNodeType, fromId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let toType = String(formData.get("to_type") ?? "") as EcosystemToType;
  let toId = String(formData.get("to_id") ?? "");

  const newExternalName = String(formData.get("new_external_entity_name") ?? "").trim();
  if (newExternalName) {
    const { data: created, error: createError } = await supabase
      .from("external_entities")
      .insert({ name: newExternalName, entity_type: "company", created_by: user?.id ?? null })
      .select("id")
      .single();
    if (createError) throw new Error(createError.message);
    toType = "external_entity";
    toId = created.id;
  }

  if (!toType || !toId) throw new Error("A relationship must have a target");

  const { error } = await supabase.from("ecosystem_relationships").insert({
    from_type: fromType,
    from_id: fromId,
    to_type: toType,
    to_id: toId,
    relationship_type: String(formData.get("relationship_type") ?? "other") as EcosystemRelationshipType,
    direction: (String(formData.get("direction") ?? "directed") as "directed" | "mutual") || "directed",
    source: "founder",
    validation_status: "confirmed",
    potential_effect: String(formData.get("potential_effect") ?? "") || null,
    evidence: String(formData.get("evidence") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
}

// Used from a node's own detail page — from side is already known and bound.
export async function createEcosystemRelationship(
  fromType: EcosystemNodeType,
  fromId: string,
  revalidatePathTarget: string,
  formData: FormData
) {
  await insertEcosystemRelationship(fromType, fromId, formData);
  revalidatePath(revalidatePathTarget);
  revalidatePath("/ecosystem");
}

// Used from the /ecosystem hub, where the from side is picked in the form.
export async function createEcosystemRelationshipGeneric(formData: FormData) {
  const fromType = String(formData.get("from_type") ?? "") as EcosystemNodeType;
  const fromId = String(formData.get("from_id") ?? "");
  if (!fromType || !fromId) throw new Error("A relationship must have a source");
  await insertEcosystemRelationship(fromType, fromId, formData);
  revalidatePath("/ecosystem");
}

// Founder confirming/rejecting/ignoring an AI-discovered relationship.
// `ignored` and `rejected` are kept distinct on purpose: only a
// `rejected` or `confirmed` decision is a real signal worth feeding back
// into future AI context; `ignored` just means nobody looked at it yet.
export async function setEcosystemRelationshipValidation(id: string, validationStatus: ValidationStatus) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("ecosystem_relationships")
    .update({
      validation_status: validationStatus,
      validated_by: user?.id ?? null,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ecosystem");
}

// Runs AI discovery over Atlas's current businesses/assets and inserts
// each candidate as a `proposed` ecosystem_relationships row — never
// `confirmed`. The founder validates/rejects each one separately via
// setEcosystemRelationshipValidation.
export async function discoverEcosystemRelationships() {
  const [businesses, assets, principles, existingRelationships] = await Promise.all([
    getBusinesses(),
    getAssets(),
    getPrinciples(false),
    getAllEcosystemRelationships(),
  ]);

  const nodes: EcosystemNodeSummary[] = [
    ...businesses.map((b) => ({ type: "business" as const, id: b.id, name: b.name, description: b.description })),
    ...assets.map((a) => ({ type: "asset" as const, id: a.id, name: a.name, description: a.description })),
  ];

  const provider = getAIProvider();
  const result = await provider.discoverEcosystemRelationships({ nodes, existingRelationships, principles });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let inserted = 0;
  for (const candidate of result.candidates) {
    let toType: EcosystemToType = candidate.to_type;
    let toId = candidate.to_id;

    if (!toId && candidate.to_external_name) {
      const { data: created, error: createError } = await supabase
        .from("external_entities")
        .insert({ name: candidate.to_external_name, entity_type: "company", created_by: user?.id ?? null })
        .select("id")
        .single();
      if (createError) continue;
      toType = "external_entity";
      toId = created.id;
    }

    if (!toId) continue;

    const { data: relationship, error } = await supabase
      .from("ecosystem_relationships")
      .insert({
        from_type: candidate.from_type,
        from_id: candidate.from_id,
        to_type: toType,
        to_id: toId,
        relationship_type: candidate.relationship_type,
        source: "ai_discovered",
        validation_status: "proposed",
        confidence: candidate.confidence,
        potential_effect: candidate.potential_effect,
        evidence: candidate.evidence,
        assumptions: candidate.assumptions,
        unknowns: candidate.unknowns,
        notes: `What it noticed: ${candidate.what_it_noticed}\nWhy Atlas noticed it: ${candidate.why_atlas_noticed_it}\nWhat would validate it: ${candidate.what_would_validate_it}`,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    if (error || !relationship) continue;
    inserted += 1;

    // Every discovered relationship with a stated potential effect is a
    // trackable hypothesis — record it so /intelligence can eventually
    // show whether Atlas's relationship-discovery guesses tend to hold up.
    if (candidate.potential_effect) {
      await supabase.from("predictions").insert({
        subject_type: "ecosystem_relationship",
        subject_id: relationship.id,
        category: "relationship_discovery",
        prediction_summary: candidate.what_it_noticed,
        expected_outcome: candidate.potential_effect,
        created_by: user?.id ?? null,
      });
    }
  }

  revalidatePath("/ecosystem");
  revalidatePath("/intelligence");
  return { proposed: inserted, disclaimer: result.disclaimer };
}
