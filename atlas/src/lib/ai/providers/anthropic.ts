import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, BusinessPlanAnalysisResult } from "@/lib/types";
import type {
  AIProvider,
  AnalysisContext,
  BusinessPlanAnalysisContext,
  EcosystemDiscoveryContext,
  EcosystemDiscoveryResult,
} from "../types";
import { buildAnalysisPrompt, buildBusinessPlanPrompt, buildEcosystemDiscoveryPrompt } from "../prompt";

const ANALYSIS_REQUIRED_KEYS: (keyof AnalysisResult)[] = [
  "what_is_it",
  "why_it_might_matter",
  "what_would_need_to_be_true",
  "what_we_dont_know",
  "cheapest_useful_test",
  "potential_atlas_fit",
  "risks",
  "suggested_next_step",
  "disclaimer",
];

const BUSINESS_PLAN_REQUIRED_KEYS: (keyof BusinessPlanAnalysisResult)[] = [
  "facts",
  "assumptions",
  "unknowns",
  "business_model",
  "revenue_model",
  "cost_structure",
  "startup_capital_estimate",
  "working_capital_estimate",
  "break_even_assumptions",
  "operational_requirements",
  "risks",
  "missing_information",
  "diligence_questions",
  "capital_requirements",
  "atlas_relationships",
  "ecosystem_opportunities",
  "ecosystem_conflicts",
  "benchmark_comparisons",
  "disclaimer",
];

export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model = "claude-sonnet-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async complete(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  async analyzeOpportunity(ctx: AnalysisContext): Promise<AnalysisResult> {
    const text = await this.complete(buildAnalysisPrompt(ctx), 1500);
    return parseJsonResponse<AnalysisResult>(text, ANALYSIS_REQUIRED_KEYS);
  }

  async analyzeBusinessPlan(ctx: BusinessPlanAnalysisContext): Promise<BusinessPlanAnalysisResult> {
    const text = await this.complete(buildBusinessPlanPrompt(ctx), 3000);
    return parseJsonResponse<BusinessPlanAnalysisResult>(text, BUSINESS_PLAN_REQUIRED_KEYS);
  }

  async discoverEcosystemRelationships(ctx: EcosystemDiscoveryContext): Promise<EcosystemDiscoveryResult> {
    const text = await this.complete(buildEcosystemDiscoveryPrompt(ctx), 3000);
    const result = parseJsonResponse<EcosystemDiscoveryResult>(text, ["candidates", "disclaimer"]);

    // Defensive validation: never trust an AI-cited id without checking
    // it against the actual catalog we gave it. A hallucinated id here
    // would otherwise become a foreign-key error or, worse, silently
    // reference the wrong node.
    const knownIds = new Set(ctx.nodes.map((n) => n.id));
    result.candidates = result.candidates.filter((c) => {
      if (!knownIds.has(c.from_id)) return false;
      if (c.to_id && !knownIds.has(c.to_id)) return false;
      return true;
    });

    return result;
  }
}

function parseJsonResponse<T>(text: string, requiredKeys: string[]): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain a JSON object");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  for (const key of requiredKeys) {
    if (!(key in parsed)) {
      throw new Error(`AI response missing required field: ${key}`);
    }
  }

  return parsed as T;
}
