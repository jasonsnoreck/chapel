import type {
  AnalysisResult,
  Asset,
  Business,
  BusinessPlanAnalysisResult,
  Confidence,
  Decision,
  EcosystemNodeType,
  EcosystemRelationship,
  EcosystemRelationshipType,
  EcosystemToType,
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

export interface BusinessPlanAnalysisContext {
  opportunity: Opportunity;
  planText: string;
  notes: Note[];
  principles: Principle[];
  existingBusinesses: Business[];
  existingAssets: Asset[];
}

// A compact catalog entry the AI can cite by id when proposing a
// relationship between two existing Atlas nodes — never asked to guess
// an id, only to pick from what it was actually given.
export interface EcosystemNodeSummary {
  type: EcosystemNodeType;
  id: string;
  name: string;
  description?: string | null;
}

export interface EcosystemDiscoveryContext {
  nodes: EcosystemNodeSummary[];
  existingRelationships: EcosystemRelationship[];
  principles: Principle[];
}

export interface DiscoveredRelationshipCandidate {
  from_type: EcosystemNodeType;
  from_id: string;
  to_type: EcosystemToType;
  // Populated when the candidate is between two existing Atlas nodes.
  to_id: string | null;
  // Populated instead of to_id when the AI is proposing a relationship
  // to something outside Atlas it doesn't have a node for yet (e.g. "an
  // external HVAC vendor") — becomes a new external_entities row only if
  // the founder confirms.
  to_external_name: string | null;
  relationship_type: EcosystemRelationshipType;
  what_it_noticed: string;
  why_atlas_noticed_it: string;
  evidence: string;
  assumptions: string;
  unknowns: string;
  potential_effect: string;
  confidence: Confidence;
  what_would_validate_it: string;
}

export interface EcosystemDiscoveryResult {
  candidates: DiscoveredRelationshipCandidate[];
  disclaimer: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string | null;
  analyzeOpportunity(context: AnalysisContext): Promise<AnalysisResult>;
  analyzeBusinessPlan(context: BusinessPlanAnalysisContext): Promise<BusinessPlanAnalysisResult>;
  discoverEcosystemRelationships(context: EcosystemDiscoveryContext): Promise<EcosystemDiscoveryResult>;
}
