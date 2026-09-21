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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
