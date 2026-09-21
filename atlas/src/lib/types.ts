// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Kept in sync manually for V0.1; a generated-types step can replace this
// later without changing how the rest of the app imports these names.
//
// These are declared with `type`, not `interface`: TS only infers an
// implicit index signature for object type aliases, which the Database
// type below needs to satisfy supabase-js's `Record<string, unknown>`
// constraint on Row/Insert/Update. An `interface` here silently makes
// every `.insert()`/`.update()` call resolve to `never`.

export type OpportunityCategory =
  | "business_idea"
  | "acquisition"
  | "product"
  | "service"
  | "asset"
  | "technology"
  | "partnership"
  | "investment"
  | "other";

export type OpportunityStatus =
  | "captured"
  | "evaluating"
  | "approved"
  | "active_project"
  | "graduated"
  | "killed"
  | "archived";

export type AttentionState = "now" | "later" | "watch" | "archived";

export type ProjectStatus = "active" | "paused" | "graduated" | "killed";

export type BusinessStatus = "active" | "dormant" | "sold" | "closed";

export type NoteKind = "note" | "research";

export type RelatableType = "opportunity" | "project" | "business";

// Notes/decisions can attach to a couple of parent kinds relationships
// can't (investor_profile/investment_mandate) — kept as a separate union
// since the `relationships` table's CHECK constraint still only allows
// RelatableType.
export type NotableParentType = RelatableType | "investor_profile" | "investment_mandate";

export type AssetStatus = "active" | "dormant" | "sold" | "retired";

// A business can use an asset (lease it, operate out of it) without
// being it and without Atlas owning it — ownership_type makes that
// explicit rather than letting "business or asset" blur together.
export type AssetType = "real_estate" | "equipment" | "intellectual_property" | "other";
export type OwnershipType = "owned" | "leased" | "licensed" | "other";

// --- Investor Protocol (architectural foundation, not an active
// onboarding/solicitation system — see supabase/migrations/0003_investor_protocol.sql) ---

export type InvestorEntityType = "individual" | "entity";

export type InvestorRelationshipStatus = "prospective" | "active" | "inactive" | "declined";

// Relationship classifications, NOT legal classifications.
export type InvolvementLevel = "financial" | "informed" | "advisory" | "operating" | "strategic_partner";

export type QualificationStatus = "unverified" | "self_attested" | "professionally_verified" | "not_applicable";

export type ContributionType =
  | "cash"
  | "debt_capacity"
  | "business"
  | "real_estate"
  | "equipment"
  | "customers_distribution"
  | "expertise"
  | "labor"
  | "relationships"
  | "intellectual_property"
  | "other"
  | "combination";

export type InvestmentTargetType = "atlas" | "opportunity" | "project" | "business" | "asset" | "other";

export type MandateStatus = "draft" | "proposed" | "under_review" | "active" | "completed" | "terminated";

export type StructureReviewStatus =
  | "draft"
  | "internally_designed"
  | "professional_review"
  | "approved"
  | "active"
  | "retired";

export type ProfessionalType = "attorney" | "accountant" | "tax_advisor" | "other";

export type ReviewApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision";

export type InformationAccessLevel = "standard" | "enhanced" | "strategic" | "deal_specific" | "atlas_partner";

// Mirrors the "investor switchboard" concept from the addendum: one
// structured document per mandate rather than six more tables. Every
// field here is an internal configuration toggle, never a legal promise.
export type RightsConfiguration = {
  economics?: {
    equity?: boolean;
    preferred_economics?: boolean;
    revenue_participation?: boolean;
    profit_participation?: boolean;
    debt?: boolean;
    hybrid?: boolean;
    other?: boolean;
  };
  control?: {
    management?: boolean;
    major_event_approval?: boolean;
    ordinary_voting?: boolean;
    board_seat?: boolean;
    governance_rights?: boolean;
  };
  involvement?: InvolvementLevel;
  liquidity?: {
    fixed_maturity?: boolean;
    company_buyback?: boolean;
    atlas_buyback?: boolean;
    underlying_sale?: boolean;
    asset_sale?: boolean;
    refinancing?: boolean;
    secondary_transfer?: boolean;
    distribution?: boolean;
    negotiated_exit?: boolean;
    no_defined_liquidity?: boolean;
  };
  information?: InformationAccessLevel;
  atlas_access?: {
    partner_network?: boolean;
    office?: boolean;
    meetings?: boolean;
    events?: boolean;
    introductions?: boolean;
    educational_sessions?: boolean;
    deal_discussions?: boolean;
    shared_resources?: boolean;
    other?: boolean;
  };
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  category: OpportunityCategory;
  status: OpportunityStatus;
  attention: AttentionState;
  source: string | null;
  tags: string[];
  next_action: string | null;
  founder_assessment: string | null;
  captured_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Project = {
  id: string;
  opportunity_id: string | null;
  name: string;
  objective: string | null;
  status: ProjectStatus;
  start_date: string;
  target_review_date: string | null;
  capital_invested: number;
  time_invested_hours: number;
  graduation_criteria: string | null;
  kill_criteria: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Business = {
  id: string;
  name: string;
  description: string | null;
  status: BusinessStatus;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Decision = {
  id: string;
  subject: string;
  decision: string;
  reasoning: string | null;
  decided_at: string;
  review_date: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  business_id: string | null;
  investor_profile_id: string | null;
  investment_mandate_id: string | null;
  financing_event_id: string | null;
  capital_need_id: string | null;
  ecosystem_relationship_id: string | null;
  created_at: string;
  created_by: string | null;
};

export type Principle = {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Note = {
  id: string;
  body: string;
  kind: NoteKind;
  opportunity_id: string | null;
  project_id: string | null;
  business_id: string | null;
  investor_profile_id: string | null;
  investment_mandate_id: string | null;
  created_at: string;
  created_by: string | null;
};

export type Experiment = {
  id: string;
  project_id: string;
  hypothesis: string;
  action: string | null;
  cost: number | null;
  time_hours: number | null;
  expected_result: string | null;
  actual_result: string | null;
  learning: string | null;
  date: string;
  decision_id: string | null;
  created_at: string;
  created_by: string | null;
};

export type Relationship = {
  id: string;
  from_type: RelatableType;
  from_id: string;
  to_type: RelatableType;
  to_id: string;
  created_at: string;
  created_by: string | null;
};

export type AnalysisResult = {
  what_is_it: string;
  why_it_might_matter: string;
  what_would_need_to_be_true: string[];
  what_we_dont_know: string[];
  cheapest_useful_test: string;
  potential_atlas_fit: string;
  risks: string[];
  suggested_next_step: string;
  disclaimer: string;
};

export type AiAnalysis = {
  id: string;
  opportunity_id: string;
  provider: string;
  model: string | null;
  input_context: Record<string, unknown>;
  result: AnalysisResult;
  created_at: string;
  created_by: string | null;
};

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type Asset = {
  id: string;
  name: string;
  description: string | null;
  status: AssetStatus;
  asset_type: AssetType;
  ownership_type: OwnershipType;
  business_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type InvestorProfile = {
  id: string;
  name: string;
  entity_type: InvestorEntityType;
  contact_email: string | null;
  contact_phone: string | null;
  relationship_status: InvestorRelationshipStatus;
  preferred_involvement_level: InvolvementLevel | null;
  preferred_reporting_frequency: string | null;
  preferred_investment_horizon: string | null;
  investment_interests: string | null;
  capabilities_contributions: string | null;
  atlas_network_preferences: string | null;
  qualification_status: QualificationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ApprovedStructure = {
  id: string;
  name: string;
  description: string | null;
  permitted_configurations: Record<string, unknown>;
  required_fields: string[];
  prohibited_combinations: string | null;
  document_templates: unknown[];
  review_status: StructureReviewStatus;
  version: string;
  effective_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ProfessionalReview = {
  id: string;
  approved_structure_id: string;
  reviewer_name: string;
  professional_type: ProfessionalType;
  review_date: string;
  document_reference: string | null;
  comments: string | null;
  approval_status: ReviewApprovalStatus;
  created_at: string;
  created_by: string | null;
};

export type InvestmentMandate = {
  id: string;
  investor_profile_id: string;
  target_type: InvestmentTargetType;
  target_id: string | null;
  target_note: string | null;
  investment_amount: number | null;
  investment_type: string | null;
  contribution_types: ContributionType[];
  contribution_notes: string | null;
  rights: RightsConfiguration;
  term: string | null;
  special_conditions: string | null;
  liquidity_note: string | null;
  status: MandateStatus;
  approved_structure_id: string | null;
  documents_note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

// --- Capital & Ecosystem architecture (see supabase/migrations/0004_capital_ecosystem_architecture.sql
// and README "Capital & Ecosystem architecture" for the design rationale) ---

export type FinancingPositionType = "mortgage" | "loan" | "line_of_credit" | "seller_note" | "other";
export type FinancingPositionStatus = "active" | "paid_off" | "refinanced_out";
export type FinancingEventType = "draw" | "principal_payment" | "refinance" | "payoff" | "modification" | "other";
export type FinancingEventDirection = "increase" | "decrease" | "neutral";
export type FinancingDestinationType = "opportunity" | "project" | "business" | "asset" | "capital_need" | "general" | "other";

export type CapitalNeedTargetType = "opportunity" | "project" | "business" | "asset";
export type CapitalNeedStatus = "draft" | "open" | "partially_met" | "met" | "withdrawn";

export type CapitalSourceType =
  | "atlas_equity"
  | "investor_mandate"
  | "seller_financing"
  | "bank_debt"
  | "sba_debt"
  | "equipment_financing"
  | "internal_cashflow"
  | "atlas_business"
  | "atlas_asset"
  | "strategic_partner"
  | "customer_prepayment"
  | "contributed_resources"
  | "other";
export type CapitalSourceStatus = "active" | "inactive" | "exhausted";
export type AssessedBy = "founder" | "ai";

export type ExternalEntityType = "company" | "individual" | "marketplace" | "broker" | "other";

// Deliberately separate from RelatableType/Relationship — that table
// keeps doing its existing job (simple symmetric "related items" links
// in the UI); this is a typed, directed, evidence-bearing edge for the
// Ecosystem Layer, including AI-discovery/validation.
export type EcosystemNodeType = "opportunity" | "project" | "business" | "asset" | "capital_need";
export type EcosystemToType = EcosystemNodeType | "external_entity";
export type EcosystemRelationshipType =
  | "supplier"
  | "customer"
  | "distributor"
  | "shared_equipment"
  | "shared_facility"
  | "shared_labor"
  | "lead_generation"
  | "cross_sell"
  | "capacity_utilization"
  | "byproduct_utilization"
  | "procurement_aggregation"
  | "geographic_cluster"
  | "complementary_service"
  | "financing"
  | "collateral"
  | "strategic_dependency"
  | "potential_conflict"
  | "competitive"
  | "replacement_opportunity"
  | "external_dependency"
  | "other";
export type EcosystemRelationshipDirection = "directed" | "mutual";
export type EcosystemRelationshipSource = "founder" | "ai_discovered";
export type Confidence = "low" | "medium" | "high";
export type ValidationStatus = "proposed" | "confirmed" | "rejected" | "ignored";

export type CapitalUtilityTargetType = "business" | "asset";

export type MatchCandidateProvenance = "founder" | "ai";
export type MatchCandidateStatus = "proposed" | "founder_reviewed" | "dismissed";

export type PredictionSubjectType =
  | "ecosystem_relationship"
  | "match_candidate"
  | "capital_utility_assessment"
  | "ai_analysis"
  | "business_plan_analysis"
  | "opportunity"
  | "other";
export type PredictionCategory =
  | "relationship_discovery"
  | "financial_estimation"
  | "acquisition_screening"
  | "benchmarking"
  | "operational_prediction"
  | "capital_analysis"
  | "ecosystem_opportunity_discovery"
  | "other";
export type PredictionStatus =
  | "proposed"
  | "under_evaluation"
  | "developing"
  | "validated"
  | "contradicted"
  | "expired"
  | "unable_to_evaluate";
export type VarianceReason = "execution" | "market" | "data_quality" | "reasoning_error" | "other";

export type DiscoveryChannel =
  | "marketplace"
  | "broker"
  | "public_web"
  | "direct_submission"
  | "referral"
  | "public_records"
  | "founder"
  | "ai_ecosystem_discovery"
  | "other";
export type InformationTier = "discovery" | "screening" | "diligence";

export type DiligenceItemType =
  | "pnl"
  | "balance_sheet"
  | "tax_return"
  | "lease"
  | "customer_concentration"
  | "equipment_list"
  | "payroll"
  | "debt_schedule"
  | "contracts"
  | "inventory"
  | "seller_disclosure"
  | "other";
export type DiligenceItemStatus = "requested" | "received" | "reviewed" | "not_applicable";

export type AssetValuation = {
  id: string;
  asset_id: string | null;
  business_id: string | null;
  value: number;
  as_of_date: string;
  basis: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type FinancingPosition = {
  id: string;
  asset_id: string | null;
  business_id: string | null;
  position_type: FinancingPositionType;
  status: FinancingPositionStatus;
  lender: string | null;
  opened_at: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type FinancingEvent = {
  id: string;
  financing_position_id: string;
  event_type: FinancingEventType;
  direction: FinancingEventDirection;
  amount: number;
  event_date: string;
  destination_type: FinancingDestinationType | null;
  destination_id: string | null;
  terms: Record<string, unknown>;
  decision_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type CapitalNeedRequirements = {
  preferred_capital_types?: CapitalSourceType[];
  acceptable_capital_types?: CapitalSourceType[];
  collateral_requirements?: string;
  ownership_implications?: string;
  control_implications?: string;
  repayment_characteristics?: string;
  geography?: string;
  other_constraints?: string;
};

export type CapitalNeed = {
  id: string;
  target_type: CapitalNeedTargetType;
  target_id: string;
  amount: number | null;
  purpose: string | null;
  timing: string | null;
  status: CapitalNeedStatus;
  requirements: CapitalNeedRequirements;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type CapitalSource = {
  id: string;
  capital_source_type: CapitalSourceType;
  investment_mandate_id: string | null;
  source_business_id: string | null;
  source_asset_id: string | null;
  name: string | null;
  terms: Record<string, unknown>;
  status: CapitalSourceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type CapitalAvailability = {
  id: string;
  capital_source_id: string;
  amount_available: number | null;
  as_of_date: string;
  conditions: Record<string, unknown>;
  assessed_by: AssessedBy;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type ExternalEntity = {
  id: string;
  name: string;
  entity_type: ExternalEntityType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type EcosystemRelationship = {
  id: string;
  from_type: EcosystemNodeType;
  from_id: string;
  to_type: EcosystemToType;
  to_id: string;
  relationship_type: EcosystemRelationshipType;
  direction: EcosystemRelationshipDirection;
  source: EcosystemRelationshipSource;
  confidence: Confidence | null;
  potential_effect: string | null;
  evidence: string | null;
  assumptions: string | null;
  unknowns: string | null;
  validation_status: ValidationStatus;
  validated_by: string | null;
  validated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

// Structured, but every field is a label/estimate, never a financing
// guarantee — see README.
export type CapitalUtilityAssessmentDetail = {
  borrowing_capacity?: Confidence;
  collateral_quality?: Confidence;
  lending_accessibility?: Confidence;
  liquidity?: Confidence;
  cash_flow_capacity?: Confidence;
  equity_generation_potential?: Confidence;
  ability_to_support_other_atlas_business?: Confidence;
  encumbrance_tolerance?: Confidence;
  strategic_importance?: Confidence;
  saleability?: Confidence;
};

export type CapitalUtilityAssessment = {
  id: string;
  target_type: CapitalUtilityTargetType;
  target_id: string;
  assessed_by: AssessedBy;
  assessment: CapitalUtilityAssessmentDetail;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type MatchCandidate = {
  id: string;
  capital_need_id: string;
  capital_source_id: string;
  compatible_dimensions: string[];
  conflicting_dimensions: string[];
  unknown_dimensions: string[];
  questions_for_founder: string | null;
  potential_structure_id: string | null;
  provenance: MatchCandidateProvenance;
  status: MatchCandidateStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Prediction = {
  id: string;
  subject_type: PredictionSubjectType;
  subject_id: string | null;
  category: PredictionCategory;
  prediction_summary: string;
  expected_outcome: string | null;
  predicted_at: string;
  economic_clock_at: string | null;
  evaluation_clock_at: string | null;
  status: PredictionStatus;
  observed_outcome: string | null;
  variance: string | null;
  variance_reason: VarianceReason | null;
  evaluated_at: string | null;
  evaluated_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type OpportunityProvenance = {
  id: string;
  opportunity_id: string;
  external_entity_id: string | null;
  discovery_channel: DiscoveryChannel;
  information_tier: InformationTier;
  first_discovered_at: string;
  last_observed_at: string;
  still_available: boolean | null;
  source_url: string | null;
  source_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type DiligenceItem = {
  id: string;
  opportunity_id: string;
  item_type: DiligenceItemType;
  status: DiligenceItemStatus;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

// Deliberately separate from AnalysisResult/ai_analyses — the generic
// "Analyze with Atlas" action is unchanged; this is a distinct, richer
// analysis specific to business-plan-shaped input. Same
// facts/assumptions/unknowns discipline as AnalysisResult.
export type BusinessPlanAnalysisResult = {
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  business_model: string;
  revenue_model: string;
  cost_structure: string;
  startup_capital_estimate: string;
  working_capital_estimate: string;
  break_even_assumptions: string;
  operational_requirements: string;
  risks: string[];
  missing_information: string[];
  diligence_questions: string[];
  capital_requirements: string;
  atlas_relationships: string;
  ecosystem_opportunities: string;
  ecosystem_conflicts: string;
  benchmark_comparisons: string;
  disclaimer: string;
};

export type BusinessPlanAnalysis = {
  id: string;
  opportunity_id: string;
  provider: string;
  model: string | null;
  input_context: Record<string, unknown>;
  result: BusinessPlanAnalysisResult;
  created_at: string;
  created_by: string | null;
};

// Minimal Database shape so @supabase/ssr generics resolve. Only the
// columns above are typed strictly; Insert/Update relax required fields
// that have DB defaults. `Relationships: []` and the empty Views/Functions
// maps are required by supabase-js's GenericSchema constraint even though
// V0.1 doesn't use foreign-table embeds or RPC calls.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity> & { title: string };
        Update: Partial<Opportunity>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { name: string };
        Update: Partial<Project>;
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: Partial<Business> & { name: string };
        Update: Partial<Business>;
        Relationships: [];
      };
      decisions: {
        Row: Decision;
        Insert: Partial<Decision> & { subject: string; decision: string };
        Update: Partial<Decision>;
        Relationships: [];
      };
      principles: {
        Row: Principle;
        Insert: Partial<Principle> & { title: string };
        Update: Partial<Principle>;
        Relationships: [];
      };
      notes: {
        Row: Note;
        Insert: Partial<Note> & { body: string; kind: NoteKind };
        Update: Partial<Note>;
        Relationships: [];
      };
      experiments: {
        Row: Experiment;
        Insert: Partial<Experiment> & { project_id: string; hypothesis: string };
        Update: Partial<Experiment>;
        Relationships: [];
      };
      relationships: {
        Row: Relationship;
        Insert: Partial<Relationship> & {
          from_type: RelatableType;
          from_id: string;
          to_type: RelatableType;
          to_id: string;
        };
        Update: Partial<Relationship>;
        Relationships: [];
      };
      ai_analyses: {
        Row: AiAnalysis;
        Insert: Partial<AiAnalysis> & { opportunity_id: string; provider: string; result: AnalysisResult };
        Update: Partial<AiAnalysis>;
        Relationships: [];
      };
      feature_flags: {
        Row: FeatureFlag;
        Insert: Partial<FeatureFlag> & { key: string };
        Update: Partial<FeatureFlag>;
        Relationships: [];
      };
      assets: {
        Row: Asset;
        Insert: Partial<Asset> & { name: string };
        Update: Partial<Asset>;
        Relationships: [];
      };
      investor_profiles: {
        Row: InvestorProfile;
        Insert: Partial<InvestorProfile> & { name: string };
        Update: Partial<InvestorProfile>;
        Relationships: [];
      };
      approved_structures: {
        Row: ApprovedStructure;
        Insert: Partial<ApprovedStructure> & { name: string };
        Update: Partial<ApprovedStructure>;
        Relationships: [];
      };
      professional_reviews: {
        Row: ProfessionalReview;
        Insert: Partial<ProfessionalReview> & { approved_structure_id: string; reviewer_name: string };
        Update: Partial<ProfessionalReview>;
        Relationships: [];
      };
      investment_mandates: {
        Row: InvestmentMandate;
        Insert: Partial<InvestmentMandate> & { investor_profile_id: string };
        Update: Partial<InvestmentMandate>;
        Relationships: [];
      };
      asset_valuations: {
        Row: AssetValuation;
        Insert: Partial<AssetValuation> & { value: number };
        Update: Partial<AssetValuation>;
        Relationships: [];
      };
      financing_positions: {
        Row: FinancingPosition;
        Insert: Partial<FinancingPosition>;
        Update: Partial<FinancingPosition>;
        Relationships: [];
      };
      financing_events: {
        Row: FinancingEvent;
        Insert: Partial<FinancingEvent> & { financing_position_id: string; direction: FinancingEventDirection };
        Update: Partial<FinancingEvent>;
        Relationships: [];
      };
      capital_needs: {
        Row: CapitalNeed;
        Insert: Partial<CapitalNeed> & { target_type: CapitalNeedTargetType; target_id: string };
        Update: Partial<CapitalNeed>;
        Relationships: [];
      };
      capital_sources: {
        Row: CapitalSource;
        Insert: Partial<CapitalSource> & { capital_source_type: CapitalSourceType };
        Update: Partial<CapitalSource>;
        Relationships: [];
      };
      capital_availability: {
        Row: CapitalAvailability;
        Insert: Partial<CapitalAvailability> & { capital_source_id: string };
        Update: Partial<CapitalAvailability>;
        Relationships: [];
      };
      external_entities: {
        Row: ExternalEntity;
        Insert: Partial<ExternalEntity> & { name: string };
        Update: Partial<ExternalEntity>;
        Relationships: [];
      };
      ecosystem_relationships: {
        Row: EcosystemRelationship;
        Insert: Partial<EcosystemRelationship> & {
          from_type: EcosystemNodeType;
          from_id: string;
          to_type: EcosystemToType;
          to_id: string;
          relationship_type: EcosystemRelationshipType;
        };
        Update: Partial<EcosystemRelationship>;
        Relationships: [];
      };
      capital_utility_assessments: {
        Row: CapitalUtilityAssessment;
        Insert: Partial<CapitalUtilityAssessment> & { target_type: CapitalUtilityTargetType; target_id: string };
        Update: Partial<CapitalUtilityAssessment>;
        Relationships: [];
      };
      match_candidates: {
        Row: MatchCandidate;
        Insert: Partial<MatchCandidate> & { capital_need_id: string; capital_source_id: string };
        Update: Partial<MatchCandidate>;
        Relationships: [];
      };
      predictions: {
        Row: Prediction;
        Insert: Partial<Prediction> & { subject_type: PredictionSubjectType; prediction_summary: string };
        Update: Partial<Prediction>;
        Relationships: [];
      };
      opportunity_provenance: {
        Row: OpportunityProvenance;
        Insert: Partial<OpportunityProvenance> & { opportunity_id: string };
        Update: Partial<OpportunityProvenance>;
        Relationships: [];
      };
      diligence_items: {
        Row: DiligenceItem;
        Insert: Partial<DiligenceItem> & { opportunity_id: string; item_type: DiligenceItemType };
        Update: Partial<DiligenceItem>;
        Relationships: [];
      };
      business_plan_analyses: {
        Row: BusinessPlanAnalysis;
        Insert: Partial<BusinessPlanAnalysis> & { opportunity_id: string; provider: string; result: BusinessPlanAnalysisResult };
        Update: Partial<BusinessPlanAnalysis>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      founder_exists: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_founder: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
