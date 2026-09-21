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
