import type { AnalysisContext } from "./types";

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
