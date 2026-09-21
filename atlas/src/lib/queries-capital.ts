import { createClient } from "@/lib/supabase/server";
import type {
  AssetValuation,
  BusinessPlanAnalysis,
  CapitalAvailability,
  CapitalNeed,
  CapitalNeedTargetType,
  CapitalSource,
  CapitalUtilityAssessment,
  CapitalUtilityTargetType,
  DiligenceItem,
  EcosystemNodeType,
  EcosystemRelationship,
  ExternalEntity,
  FinancingEvent,
  FinancingPosition,
  MatchCandidate,
  OpportunityProvenance,
  Prediction,
  PredictionStatus,
  PredictionSubjectType,
  ValidationStatus,
} from "@/lib/types";

// --- Asset valuations (unlevered economic position, append-only) ---

export async function getValuationsFor(targetType: "asset" | "business", targetId: string) {
  const supabase = createClient();
  const column = `${targetType}_id`;
  const { data, error } = await supabase
    .from("asset_valuations")
    .select("*")
    .eq(column, targetId)
    .order("as_of_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AssetValuation[];
}

export function latestValuation(valuations: AssetValuation[]): AssetValuation | null {
  return valuations[0] ?? null;
}

// --- Financing positions + events (financing ledger, derived balance) ---

export async function getFinancingPositionsFor(targetType: "asset" | "business", targetId: string) {
  const supabase = createClient();
  const column = `${targetType}_id`;
  const { data, error } = await supabase
    .from("financing_positions")
    .select("*")
    .eq(column, targetId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FinancingPosition[];
}

export async function getFinancingEventsFor(financingPositionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("financing_events")
    .select("*")
    .eq("financing_position_id", financingPositionId)
    .order("event_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FinancingEvent[];
}

// Current balance is always derived from the event ledger, never stored —
// see the migration comment. Increase events add, decrease events
// subtract, neutral events (e.g. a rate modification) don't move it.
export function derivedBalance(events: FinancingEvent[]): number {
  return events.reduce((total, e) => {
    if (e.direction === "increase") return total + e.amount;
    if (e.direction === "decrease") return total - e.amount;
    return total;
  }, 0);
}

// --- Capital needs ---

export async function getCapitalNeedsFor(targetType: CapitalNeedTargetType, targetId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capital_needs")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CapitalNeed[];
}

export async function getAllCapitalNeeds() {
  const supabase = createClient();
  const { data, error } = await supabase.from("capital_needs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CapitalNeed[];
}

export async function getCapitalNeed(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("capital_needs").select("*").eq("id", id).single();
  if (error) return null;
  return data as CapitalNeed;
}

// --- Capital sources + availability ---

export async function getCapitalSources() {
  const supabase = createClient();
  const { data, error } = await supabase.from("capital_sources").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CapitalSource[];
}

export async function getCapitalSource(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("capital_sources").select("*").eq("id", id).single();
  if (error) return null;
  return data as CapitalSource;
}

export async function getAvailabilityFor(capitalSourceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capital_availability")
    .select("*")
    .eq("capital_source_id", capitalSourceId)
    .order("as_of_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CapitalAvailability[];
}

export function latestAvailability(rows: CapitalAvailability[]): CapitalAvailability | null {
  return rows[0] ?? null;
}

// --- External entities ---

export async function getExternalEntities() {
  const supabase = createClient();
  const { data, error } = await supabase.from("external_entities").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExternalEntity[];
}

export async function getExternalEntity(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("external_entities").select("*").eq("id", id).single();
  if (error) return null;
  return data as ExternalEntity;
}

// --- Ecosystem relationships ---

export async function getEcosystemRelationshipsFor(nodeType: EcosystemNodeType, nodeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ecosystem_relationships")
    .select("*")
    .or(`and(from_type.eq.${nodeType},from_id.eq.${nodeId}),and(to_type.eq.${nodeType},to_id.eq.${nodeId})`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EcosystemRelationship[];
}

export async function getAllEcosystemRelationships(validationStatus?: ValidationStatus) {
  const supabase = createClient();
  let query = supabase.from("ecosystem_relationships").select("*").order("created_at", { ascending: false });
  if (validationStatus) query = query.eq("validation_status", validationStatus);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as EcosystemRelationship[];
}

// --- Capital utility assessments (analytical, never a financing guarantee) ---

export async function getCapitalUtilityAssessmentsFor(targetType: CapitalUtilityTargetType, targetId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capital_utility_assessments")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CapitalUtilityAssessment[];
}

// --- Match candidates (Capital Need <-> Capital Source, never an approval) ---

export async function getMatchCandidatesForNeed(capitalNeedId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("match_candidates")
    .select("*")
    .eq("capital_need_id", capitalNeedId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MatchCandidate[];
}

export async function getAllMatchCandidates() {
  const supabase = createClient();
  const { data, error } = await supabase.from("match_candidates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MatchCandidate[];
}

// --- Predictions (AI hypothesis / evaluation lifecycle) ---

export async function getPredictionsFor(subjectType: PredictionSubjectType, subjectId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("predicted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Prediction[];
}

export async function getAllPredictions(status?: PredictionStatus) {
  const supabase = createClient();
  let query = supabase.from("predictions").select("*").order("predicted_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Prediction[];
}

// --- Opportunity provenance + diligence (Opportunity Acquisition Layer) ---

export async function getProvenanceFor(opportunityId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("opportunity_provenance").select("*").eq("opportunity_id", opportunityId).maybeSingle();
  return (data as OpportunityProvenance | null) ?? null;
}

export async function getDiligenceItemsFor(opportunityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diligence_items")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DiligenceItem[];
}

// --- Business plan analyses (distinct from the generic ai_analyses) ---

export async function getBusinessPlanAnalysesFor(opportunityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_plan_analyses")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessPlanAnalysis[];
}
