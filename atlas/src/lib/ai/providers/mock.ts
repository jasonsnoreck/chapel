import type { BusinessPlanAnalysisResult, AnalysisResult } from "@/lib/types";
import type {
  AIProvider,
  AnalysisContext,
  BusinessPlanAnalysisContext,
  EcosystemDiscoveryContext,
  EcosystemDiscoveryResult,
} from "../types";

// Deterministic, no-network provider. Used when AI_PROVIDER=mock or no
// provider is configured, so the app is fully usable without an API key.
// Every field is clearly labeled as a placeholder, never mistaken for a
// real recommendation.
export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly model = null;

  async analyzeOpportunity(ctx: AnalysisContext): Promise<AnalysisResult> {
    const { opportunity, principles } = ctx;

    const topPrinciples = principles.slice(0, 3).map((p) => p.title);

    const result: AnalysisResult = {
      what_is_it: `[Placeholder analysis] "${opportunity.title}" — ${
        opportunity.short_description || "no short description recorded yet"
      }.`,
      why_it_might_matter:
        "[Placeholder] Configure AI_PROVIDER=anthropic with an ANTHROPIC_API_KEY for real strategic analysis. This mock response exists so the workflow is fully testable without a key.",
      what_would_need_to_be_true: [
        "[Assumption, unverified] There is real demand for this.",
        "[Assumption, unverified] The founder can resource an initial test without meaningful disruption.",
      ],
      what_we_dont_know: [
        "[Unknown] Market size and willingness to pay.",
        "[Unknown] What the cheapest real test would cost.",
      ],
      cheapest_useful_test:
        "[Placeholder suggestion] Spend under a day of founder time turning this into a one-page test plan before committing capital.",
      potential_atlas_fit:
        topPrinciples.length > 0
          ? `[Placeholder] Consider against principles such as: ${topPrinciples.join("; ")}.`
          : "[Placeholder] No principles recorded yet — add some in Principles so future analysis can weigh this properly.",
      risks: ["[Placeholder] Real risks are not assessed by the mock provider."],
      suggested_next_step:
        "[Suggestion, not a decision] Enable a real AI provider, or have the founder do a manual first pass.",
      disclaimer:
        "This is a placeholder analysis from the mock AI provider — no real model was called. It is a suggestion, never a decision.",
    };

    return result;
  }

  async analyzeBusinessPlan(ctx: BusinessPlanAnalysisContext): Promise<BusinessPlanAnalysisResult> {
    const { opportunity, planText } = ctx;

    return {
      facts: [`[Placeholder] The supplied text is ${planText.length} characters long.`],
      assumptions: ["[Placeholder, unverified] Configure AI_PROVIDER=anthropic for a real plan analysis."],
      unknowns: ["[Unknown] Everything about this plan's economics — the mock provider does not read the text."],
      business_model: `[Placeholder] Business model for "${opportunity.title}" not analyzed by the mock provider.`,
      revenue_model: "[Placeholder] Not analyzed.",
      cost_structure: "[Placeholder] Not analyzed.",
      startup_capital_estimate: "[Placeholder estimate] Unknown — enable a real AI provider.",
      working_capital_estimate: "[Placeholder estimate] Unknown.",
      break_even_assumptions: "[Placeholder] Not analyzed.",
      operational_requirements: "[Placeholder] Not analyzed.",
      risks: ["[Placeholder] Real risks are not assessed by the mock provider."],
      missing_information: ["[Placeholder] Everything — this is a placeholder response."],
      diligence_questions: ["[Placeholder] What would you ask the founder if this were real diligence?"],
      capital_requirements: "[Placeholder] Not analyzed.",
      atlas_relationships: "[Placeholder] Not analyzed against Atlas's existing businesses/assets.",
      ecosystem_opportunities: "[Placeholder] Not analyzed.",
      ecosystem_conflicts: "[Placeholder] Not analyzed.",
      benchmark_comparisons: "[Placeholder] No benchmark data available in the mock provider.",
      disclaimer:
        "This is a placeholder business plan analysis from the mock AI provider — no real model was called. It is a suggestion, never a decision or verified diligence.",
    };
  }

  async discoverEcosystemRelationships(ctx: EcosystemDiscoveryContext): Promise<EcosystemDiscoveryResult> {
    const { nodes } = ctx;

    if (nodes.length < 2) {
      return {
        candidates: [],
        disclaimer:
          "Fewer than two Atlas nodes exist yet, so the mock provider has nothing to relate. This is a placeholder response — no real model was called.",
      };
    }

    const [a, b] = nodes;
    return {
      candidates: [
        {
          from_type: a.type,
          from_id: a.id,
          to_type: b.type,
          to_id: b.id,
          to_external_name: null,
          relationship_type: "other",
          what_it_noticed: `[Placeholder] A possible relationship between "${a.name}" and "${b.name}".`,
          why_atlas_noticed_it: "[Placeholder] The mock provider only demonstrates the response shape — it does not reason about real relationships.",
          evidence: "[Placeholder] None — enable AI_PROVIDER=anthropic for real discovery.",
          assumptions: "[Placeholder, unverified] This pairing is not a real hypothesis.",
          unknowns: "[Unknown] Everything.",
          potential_effect: "[Placeholder, hypothetical] Unknown.",
          confidence: "low",
          what_would_validate_it: "[Placeholder] Enable a real AI provider and review its actual output.",
        },
      ],
      disclaimer:
        "These are placeholder candidates from the mock AI provider — no real model was called, and none of this should be treated as a genuine discovery.",
    };
  }
}
