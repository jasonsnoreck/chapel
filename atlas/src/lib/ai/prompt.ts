import type { AnalysisContext, BusinessPlanAnalysisContext, EcosystemDiscoveryContext } from "./types";

// Shared context builder so every provider sees the same facts in the
// same shape — only how it's turned into a model call differs.
export function buildAnalysisPrompt(ctx: AnalysisContext): string {
  const { opportunity, notes, principles, relatedProjects, relatedBusinesses, relevantDecisions } = ctx;

  const lines: string[] = [];
  lines.push(
    "You are Atlas, an internal idea/project/decision operating system helping a founder evaluate an opportunity.",
    "You analyze; you do not decide. Only the founder can approve capital, promote, kill, or change strategy.",
    "",
    "## Atlas principles (founder-authored, must inform your analysis)",
  );
  if (principles.length === 0) {
    lines.push("(none recorded yet)");
  } else {
    for (const p of principles) {
      lines.push(`- ${p.title}${p.description ? `: ${p.description}` : ""}`);
    }
  }

  lines.push("", "## Opportunity");
  lines.push(`Title: ${opportunity.title}`);
  lines.push(`Category: ${opportunity.category}`);
  lines.push(`Status: ${opportunity.status}`);
  if (opportunity.short_description) lines.push(`Short description: ${opportunity.short_description}`);
  if (opportunity.full_description) lines.push(`Full description: ${opportunity.full_description}`);
  if (opportunity.tags.length) lines.push(`Tags: ${opportunity.tags.join(", ")}`);
  if (opportunity.source) lines.push(`Source: ${opportunity.source}`);
  if (opportunity.founder_assessment) lines.push(`Founder assessment so far: ${opportunity.founder_assessment}`);

  lines.push("", "## Notes & research");
  if (notes.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const n of notes) lines.push(`- [${n.kind}] ${n.body}`);
  }

  lines.push("", "## Related projects");
  if (relatedProjects.length === 0) {
    lines.push("(none)");
  } else {
    for (const p of relatedProjects) lines.push(`- ${p.name} (${p.status}): ${p.objective ?? ""}`);
  }

  lines.push("", "## Related businesses");
  if (relatedBusinesses.length === 0) {
    lines.push("(none)");
  } else {
    for (const b of relatedBusinesses) lines.push(`- ${b.name} (${b.status}): ${b.description ?? ""}`);
  }

  lines.push("", "## Relevant prior decisions");
  if (relevantDecisions.length === 0) {
    lines.push("(none)");
  } else {
    for (const d of relevantDecisions) {
      lines.push(`- [${d.decided_at}] ${d.subject}: ${d.decision}${d.reasoning ? ` — ${d.reasoning}` : ""}`);
    }
  }

  lines.push(
    "",
    "## Task",
    "Return a structured analysis as JSON with exactly these keys:",
    "- what_is_it (string): a short, neutral restatement of the idea",
    "- why_it_might_matter (string): potential strategic value",
    "- what_would_need_to_be_true (string[]): key assumptions that must hold, clearly labeled as assumptions not facts",
    "- what_we_dont_know (string[]): open unknowns worth resolving",
    "- cheapest_useful_test (string): the smallest experiment that could meaningfully reduce uncertainty",
    "- potential_atlas_fit (string): how this could eventually fit into the Atlas ecosystem",
    "- risks (string[]): major known risks",
    "- suggested_next_step (string): one concrete next action — a suggestion, not a decision",
    "- disclaimer (string): one sentence reminding the founder this is AI-assisted analysis, not a decision",
    "",
    "Respond with ONLY the JSON object, no surrounding prose."
  );

  return lines.join("\n");
}

// Deliberately a separate prompt from buildAnalysisPrompt: a business
// plan needs a much richer, plan-shaped breakdown than the generic
// opportunity analysis, and forcing the two into one shape would either
// bloat the common case or lose structure here.
export function buildBusinessPlanPrompt(ctx: BusinessPlanAnalysisContext): string {
  const { opportunity, planText, notes, principles, existingBusinesses, existingAssets } = ctx;

  const lines: string[] = [];
  lines.push(
    "You are Atlas, analyzing a business plan the founder is considering. You analyze; you do not decide.",
    "Only the founder can commit capital, promote this, or change Atlas strategy.",
    "",
    "## Atlas principles (founder-authored, must inform your analysis)"
  );
  if (principles.length === 0) {
    lines.push("(none recorded yet)");
  } else {
    for (const p of principles) lines.push(`- ${p.title}${p.description ? `: ${p.description}` : ""}`);
  }

  lines.push("", "## Opportunity record", `Title: ${opportunity.title}`);
  if (opportunity.short_description) lines.push(`Short description: ${opportunity.short_description}`);

  lines.push("", "## Business plan text (as supplied by the founder — treat as the primary source)", planText);

  if (notes.length > 0) {
    lines.push("", "## Additional notes");
    for (const n of notes) lines.push(`- [${n.kind}] ${n.body}`);
  }

  lines.push("", "## Atlas's existing businesses (for ecosystem fit/conflict analysis)");
  if (existingBusinesses.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const b of existingBusinesses) lines.push(`- ${b.name} (${b.status}): ${b.description ?? ""}`);
  }

  lines.push("", "## Atlas's existing assets");
  if (existingAssets.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const a of existingAssets) lines.push(`- ${a.name} (${a.asset_type}, ${a.ownership_type}): ${a.description ?? ""}`);
  }

  lines.push(
    "",
    "## Task",
    "Analyze this as a business plan, not a generic idea. Distinguish facts (stated in the supplied text),",
    "assumptions (implied or typical but not demonstrated), and unknowns (needed to evaluate this but not",
    "available) throughout — do not blend them. Do not reduce this to \"good business / bad business\"; the",
    "founder decides. Return a structured analysis as JSON with exactly these keys:",
    "- facts (string[]): what the supplied text actually states",
    "- assumptions (string[]): what is assumed rather than demonstrated",
    "- unknowns (string[]): information needed to evaluate this that isn't available",
    "- business_model (string)",
    "- revenue_model (string)",
    "- cost_structure (string)",
    "- startup_capital_estimate (string): rough estimate with basis, labeled as an estimate",
    "- working_capital_estimate (string)",
    "- break_even_assumptions (string)",
    "- operational_requirements (string)",
    "- risks (string[])",
    "- missing_information (string[])",
    "- diligence_questions (string[]): what to ask/verify before committing further",
    "- capital_requirements (string): what capital this would need, referencing Atlas's Capital Need concept loosely, not inventing exact figures without basis",
    "- atlas_relationships (string): how this could relate to Atlas's existing businesses/assets listed above, if at all",
    "- ecosystem_opportunities (string): positive relationships this could create with existing Atlas holdings — label as hypotheses",
    "- ecosystem_conflicts (string): potential conflicts/cannibalization with existing Atlas holdings, if any",
    "- benchmark_comparisons (string): only include comparisons you have real basis for; otherwise state that no benchmark data is available",
    "- disclaimer (string): one sentence reminding the founder this is AI-assisted analysis of supplied text, not verified diligence",
    "",
    "Respond with ONLY the JSON object, no surrounding prose."
  );

  return lines.join("\n");
}

// AI-discovered relationships must cite real node ids from the catalog
// given below — never invent one. When proposing a relationship to
// something outside Atlas, it names it in to_external_name instead of
// guessing an id.
export function buildEcosystemDiscoveryPrompt(ctx: EcosystemDiscoveryContext): string {
  const { nodes, existingRelationships, principles } = ctx;

  const lines: string[] = [];
  lines.push(
    "You are Atlas, looking for economically relevant relationships between the businesses and assets Atlas",
    "already owns or is building — relationships the founder has not necessarily typed in explicitly. You",
    "discover and explain; you do not decide, and you never turn an unverified relationship into a realized",
    "financial benefit. Look for both positive relationships (supplier/customer, shared capacity, cross-sell,",
    "etc.) and negative ones (conflicts, competition, strategic dependencies) — do not assume \"synergy\" by default.",
    "",
    "## Atlas principles"
  );
  if (principles.length === 0) {
    lines.push("(none recorded yet)");
  } else {
    for (const p of principles) lines.push(`- ${p.title}${p.description ? `: ${p.description}` : ""}`);
  }

  lines.push("", "## Atlas nodes you may reference by id (cite these ids exactly — never invent one)");
  if (nodes.length === 0) {
    lines.push("(none yet — nothing to relate)");
  } else {
    for (const n of nodes) lines.push(`- id=${n.id} type=${n.type} name="${n.name}"${n.description ? `: ${n.description}` : ""}`);
  }

  lines.push("", "## Relationships already recorded (do not repeat these)");
  if (existingRelationships.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const r of existingRelationships) {
      lines.push(`- ${r.from_type}:${r.from_id} -> ${r.relationship_type} -> ${r.to_type}:${r.to_id} (${r.validation_status})`);
    }
  }

  lines.push(
    "",
    "## Task",
    "Propose up to 5 candidate relationships not already recorded above. For each, return an object with",
    "exactly these keys:",
    "- from_type, from_id: must match a node id from the catalog above exactly",
    "- to_type: 'opportunity'|'project'|'business'|'asset'|'capital_need'|'external_entity'",
    "- to_id: a node id from the catalog above if the target is an existing Atlas node, otherwise null",
    "- to_external_name: a short name for something outside Atlas (e.g. \"a regional HVAC vendor\") if to_id is",
    "  null, otherwise null — do not set both to_id and to_external_name",
    "- relationship_type: one of supplier, customer, distributor, shared_equipment, shared_facility,",
    "  shared_labor, lead_generation, cross_sell, capacity_utilization, byproduct_utilization,",
    "  procurement_aggregation, geographic_cluster, complementary_service, financing, collateral,",
    "  strategic_dependency, potential_conflict, competitive, replacement_opportunity, external_dependency, other",
    "- what_it_noticed (string): the relationship itself, plainly stated",
    "- why_atlas_noticed_it (string): the observable/structural basis — what about the two nodes made this",
    "  worth flagging (e.g. product-category overlap, shared geography) — not just the conclusion",
    "- evidence (string): supporting facts from the data given above",
    "- assumptions (string): what you're assuming rather than what's demonstrated",
    "- unknowns (string): what's unknown that would matter",
    "- potential_effect (string): the hypothesized effect, clearly labeled as hypothetical, never a dollar",
    "  figure presented as fact",
    "- confidence: 'low'|'medium'|'high' — a qualitative judgment, never a numeric score",
    "- what_would_validate_it (string): what evidence would confirm or disconfirm this",
    "",
    "Return a JSON object with exactly these keys:",
    "- candidates (array of the objects described above, up to 5, empty array if you find nothing worth flagging)",
    "- disclaimer (string): one sentence stating these are unvalidated hypotheses for founder review",
    "",
    "Respond with ONLY the JSON object, no surrounding prose."
  );

  return lines.join("\n");
}
