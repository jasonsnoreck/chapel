import type { AnalysisResult } from "@/lib/types";
import type { AIProvider, AnalysisContext } from "../types";

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
}
