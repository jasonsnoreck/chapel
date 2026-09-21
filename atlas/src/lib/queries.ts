import { createClient } from "@/lib/supabase/server";
import type {
  AiAnalysis,
  ApprovedStructure,
  Asset,
  AttentionState,
  Business,
  Decision,
  Experiment,
  InvestmentMandate,
  InvestorProfile,
  NotableParentType,
  Note,
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
  Principle,
  ProfessionalReview,
  Project,
  RelatableType,
  Relationship,
} from "@/lib/types";

// PostgREST's .or()/.and() combinators join their sub-filters on literal
// commas in one query-string value, so a raw user search term containing
// `,` `.` `(` `)` could otherwise inject extra column.operator.value
// clauses into the expression, not just widen what substring it matches.
// Wrapping the value in double quotes makes PostgREST treat the whole
// thing as one literal string; `\` and `"` inside it must themselves be
// escaped so they can't end the quoted value early. This only changes
// how the term is delimited — the existing `%term%` substring-match
// behavior is unchanged. Only needed for .or() calls — see the plain
// .ilike() call in searchAll() below, which has no comma-joined clause
// list to break out of in the first place.
function toIlikePattern(term: string): string {
  const escaped = term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

export async function getDashboardData() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: opportunities }, { data: projects }, { data: decisions }, { data: dueDecisions }] =
    await Promise.all([
      supabase.from("opportunities").select("*").order("updated_at", { ascending: false }),
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("decisions").select("*").order("decided_at", { ascending: false }).limit(8),
      supabase
        .from("decisions")
        .select("*")
        .not("review_date", "is", null)
        .lte("review_date", today)
        .order("review_date", { ascending: true }),
    ]);

  return {
    opportunities: (opportunities ?? []) as Opportunity[],
    projects: (projects ?? []) as Project[],
    recentDecisions: (decisions ?? []) as Decision[],
    decisionsAwaitingReview: (dueDecisions ?? []) as Decision[],
  };
}

export interface OpportunityFilters {
  status?: OpportunityStatus;
  attention?: AttentionState;
  category?: OpportunityCategory;
  q?: string;
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const supabase = createClient();
  let query = supabase.from("opportunities").select("*").order("captured_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.attention) query = query.eq("attention", filters.attention);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.q) {
    const pattern = toIlikePattern(filters.q);
    query = query.or(`title.ilike.${pattern},short_description.ilike.${pattern},full_description.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Opportunity[];
}

export async function getOpportunity(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("opportunities").select("*").eq("id", id).single();
  if (error) return null;
  return data as Opportunity;
}

export async function getNotesFor(parent: NotableParentType, id: string) {
  const supabase = createClient();
  const column = `${parent}_id`;
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq(column, id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

export async function getDecisionsFor(parent: "opportunity" | "project" | "business", id: string) {
  const supabase = createClient();
  const column = `${parent}_id`;
  const { data, error } = await supabase
    .from("decisions")
    .select("*")
    .eq(column, id)
    .order("decided_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Decision[];
}

export async function getAnalysesFor(opportunityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AiAnalysis[];
}

export async function getProjectByOpportunity(opportunityId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("projects").select("*").eq("opportunity_id", opportunityId).maybeSingle();
  return (data as Project | null) ?? null;
}

export async function getProjects() {
  const supabase = createClient();
  const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function getProject(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) return null;
  return data as Project;
}

export async function getExperimentsFor(projectId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("experiments")
    .select("*")
    .eq("project_id", projectId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Experiment[];
}

export async function getDecisions() {
  const supabase = createClient();
  const { data, error } = await supabase.from("decisions").select("*").order("decided_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Decision[];
}

export async function getPrinciples(includeInactive = true) {
  const supabase = createClient();
  let query = supabase.from("principles").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Principle[];
}

export async function getBusinesses() {
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Business[];
}

export async function getBusiness(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single();
  if (error) return null;
  return data as Business;
}

export interface RelatedItem {
  relationshipId: string;
  type: RelatableType;
  id: string;
  title: string;
  status: string;
}

export async function getRelatedItems(type: RelatableType, id: string): Promise<RelatedItem[]> {
  const supabase = createClient();
  const { data: rels, error } = await supabase
    .from("relationships")
    .select("*")
    .or(`and(from_type.eq.${type},from_id.eq.${id}),and(to_type.eq.${type},to_id.eq.${id})`);
  if (error) throw new Error(error.message);

  const targets = (rels ?? []).map((r: Relationship) => {
    const isFrom = r.from_type === type && r.from_id === id;
    return { relationshipId: r.id, type: isFrom ? r.to_type : r.from_type, id: isFrom ? r.to_id : r.from_id };
  });

  const results: RelatedItem[] = [];
  for (const t of targets) {
    if (t.type === "opportunity") {
      const { data } = await supabase.from("opportunities").select("id,title,status").eq("id", t.id).maybeSingle();
      if (data) results.push({ relationshipId: t.relationshipId, type: "opportunity", id: data.id, title: data.title, status: data.status });
    } else if (t.type === "project") {
      const { data } = await supabase.from("projects").select("id,name,status").eq("id", t.id).maybeSingle();
      if (data) results.push({ relationshipId: t.relationshipId, type: "project", id: data.id, title: data.name, status: data.status });
    } else if (t.type === "business") {
      const { data } = await supabase.from("businesses").select("id,name,status").eq("id", t.id).maybeSingle();
      if (data) results.push({ relationshipId: t.relationshipId, type: "business", id: data.id, title: data.name, status: data.status });
    }
  }
  return results;
}

export interface SearchResult {
  type: "opportunity" | "project" | "business" | "decision" | "principle" | "note";
  id: string;
  title: string;
  snippet: string;
  href: string;
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const supabase = createClient();
  // Only the .or() calls below need escaping: PostgREST joins their
  // sub-filters on literal commas, which is exactly what let a search
  // term restructure the filter. The standalone .ilike() call on notes
  // is a single scalar parameter with no comma-joined clause list to
  // break out of, so it's left as a plain substring pattern rather than
  // risk changing its (already safe) behavior for no reason.
  const pattern = toIlikePattern(q);
  const plainPattern = `%${q}%`;

  const [opps, projects, businesses, decisions, principles, notes] = await Promise.all([
    supabase.from("opportunities").select("id,title,short_description").or(`title.ilike.${pattern},short_description.ilike.${pattern},full_description.ilike.${pattern}`).limit(10),
    supabase.from("projects").select("id,name,objective").or(`name.ilike.${pattern},objective.ilike.${pattern}`).limit(10),
    supabase.from("businesses").select("id,name,description").or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(10),
    supabase.from("decisions").select("id,subject,decision").or(`subject.ilike.${pattern},decision.ilike.${pattern},reasoning.ilike.${pattern}`).limit(10),
    supabase.from("principles").select("id,title,description").or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(10),
    supabase
      .from("notes")
      .select("id,body,opportunity_id,project_id,business_id,investor_profile_id")
      .ilike("body", plainPattern)
      .limit(10),
  ]);

  const results: SearchResult[] = [];

  for (const o of opps.data ?? [])
    results.push({ type: "opportunity", id: o.id, title: o.title, snippet: o.short_description ?? "", href: `/opportunities/${o.id}` });
  for (const p of projects.data ?? [])
    results.push({ type: "project", id: p.id, title: p.name, snippet: p.objective ?? "", href: `/projects/${p.id}` });
  for (const b of businesses.data ?? [])
    results.push({ type: "business", id: b.id, title: b.name, snippet: b.description ?? "", href: `/opportunities` });
  for (const d of decisions.data ?? [])
    results.push({ type: "decision", id: d.id, title: d.subject, snippet: d.decision, href: `/decisions` });
  for (const pr of principles.data ?? [])
    results.push({ type: "principle", id: pr.id, title: pr.title, snippet: pr.description ?? "", href: `/principles` });
  for (const n of notes.data ?? []) {
    const href = n.opportunity_id
      ? `/opportunities/${n.opportunity_id}`
      : n.project_id
        ? `/projects/${n.project_id}`
        : n.investor_profile_id
          ? `/investors/${n.investor_profile_id}`
          : "/";
    results.push({ type: "note", id: n.id, title: "Note", snippet: n.body.slice(0, 140), href });
  }

  return results;
}

// --- Investor Protocol reads (see src/lib/featureFlags.ts — everything
// here is inert/hidden from the UI unless investor_protocol_enabled) ---

export async function getInvestorProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("investor_profiles").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvestorProfile[];
}

export async function getInvestorProfile(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("investor_profiles").select("*").eq("id", id).single();
  if (error) return null;
  return data as InvestorProfile;
}

export async function getMandatesFor(investorProfileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment_mandates")
    .select("*")
    .eq("investor_profile_id", investorProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvestmentMandate[];
}

export async function getMandate(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("investment_mandates").select("*").eq("id", id).single();
  if (error) return null;
  return data as InvestmentMandate;
}

export async function getApprovedStructures() {
  const supabase = createClient();
  const { data, error } = await supabase.from("approved_structures").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ApprovedStructure[];
}

export async function getApprovedStructure(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("approved_structures").select("*").eq("id", id).single();
  if (error) return null;
  return data as ApprovedStructure;
}

export async function getProfessionalReviewsFor(approvedStructureId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("professional_reviews")
    .select("*")
    .eq("approved_structure_id", approvedStructureId)
    .order("review_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfessionalReview[];
}

export async function getAssets() {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Asset[];
}

export async function getAsset(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").select("*").eq("id", id).single();
  if (error) return null;
  return data as Asset;
}
