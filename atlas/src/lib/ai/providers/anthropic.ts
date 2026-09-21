import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/types";
import type { AIProvider, AnalysisContext } from "../types";
import { buildAnalysisPrompt } from "../prompt";

const REQUIRED_KEYS: (keyof AnalysisResult)[] = [
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

export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model = "claude-sonnet-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyzeOpportunity(ctx: AnalysisContext): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(ctx);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return parseAnalysisJson(text);
  }
}

function parseAnalysisJson(text: string): AnalysisResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain a JSON object");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      throw new Error(`AI response missing required field: ${key}`);
    }
  }

  return parsed as AnalysisResult;
}
