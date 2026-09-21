import type {
  AnalysisResult,
  Business,
  Decision,
  Note,
  Opportunity,
  Principle,
  Project,
} from "@/lib/types";

export interface AnalysisContext {
  opportunity: Opportunity;
  notes: Note[];
  principles: Principle[];
  relatedProjects: Project[];
  relatedBusinesses: Business[];
  relevantDecisions: Decision[];
}

export interface AIProvider {
  readonly name: string;
  readonly model: string | null;
  analyzeOpportunity(context: AnalysisContext): Promise<AnalysisResult>;
}
