import type { AIProvider } from "./types";
import { MockAIProvider } from "./providers/mock";
import { AnthropicAIProvider } from "./providers/anthropic";

export type { AIProvider, AnalysisContext } from "./types";

// Single place the rest of the app depends on. Swapping providers is an
// env var change, never a code change in callers.
export function getAIProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER || "mock").toLowerCase();

  if (configured === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set; falling back to mock provider.");
      return new MockAIProvider();
    }
    return new AnthropicAIProvider(apiKey, process.env.ANTHROPIC_MODEL || "claude-sonnet-5");
  }

  return new MockAIProvider();
}
