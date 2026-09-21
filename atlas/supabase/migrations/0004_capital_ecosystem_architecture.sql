-- Atlas Capital & Opportunity Matching — architecture implementation
--
-- New forward migration rather than edits to 0001-0003: we have no way to
-- confirm those haven't already been applied to a real Supabase project
-- from this sandbox, so editing them in place would be unsafe if they
-- have been. If they have NOT been applied yet, these can be folded back
-- into 0001-0003 before first deployment — see README.
--
-- This migration implements (not just documents) the three-layer Atlas
-- architecture: Opportunity Layer (existing), Capital Layer (existing
-- Investor Protocol + new Capital Need/Source/Availability), and a new
-- Ecosystem Layer (typed relationships, AI discovery, capital/ecosystem
-- utility assessment). It also adds a general-purpose AI prediction
-- lifecycle and the provenance/diligence foundation for external
-- opportunity acquisition.
--
-- Everything here is data model + minimal review workflow. Nothing here
-- executes anything: no money moves, no autonomous approval, no
-- automatic matching decision. See README "Capital & Ecosystem
-- architecture" section for the full design rationale and the red-team
-- notes this migration resolves.

-- =======================================================================
-- Ontology: Business vs Asset vs Property, ownership vs use
-- =======================================================================
-- A business can use an asset (lease it, operate out of it) without
-- being it, and without Atlas owning it. `ownership_type` makes that
-- explicit rather than letting "business or asset" blur together: a
-- leased building a business merely operates out of should be entered
-- with ownership_type='leased' precisely so financing/valuation/capital-
-- utility tooling elsewhere can treat it differently from something
-- Atlas actually owns free and clear.
alter table public.assets add column if not exists asset_type text not null default 'other'
  check (asset_type in ('real_estate','equipment','intellectual_property','other'));
alter table public.assets add column if not exists ownership_type text not null default 'owned'
  check (ownership_type in ('owned','leased','licensed','other'));

-- =======================================================================
-- Asset valuations — the "unlevered economic position" ledger.
-- Append-only, exactly like ai_analyses/decisions: a valuation is never
-- overwritten, only superseded by a newer row. Financing events (below)
-- never touch this table — that separation is the entire point of §5 of
-- the architecture discussion.
-- =======================================================================
create table if not exists public.asset_valuations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  value numeric(14,2) not null,
  as_of_date date not null default current_date,
  basis text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint asset_valuations_one_subject check (
    (case when asset_id is not null then 1 else 0 end
   + case when business_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists asset_valuations_asset_idx on public.asset_valuations (asset_id, as_of_date desc);
create index if not exists asset_valuations_business_idx on public.asset_valuations (business_id, as_of_date desc);

-- =======================================================================
-- Financing positions + events — the financing ledger.
--
-- A Financing Position is one named debt/financing instrument against an
-- asset or business (e.g. "the mortgage on Building X"). Financing
-- Events are the individual transactions against it (draw, principal
-- payment, refinance, payoff, modification). The CURRENT balance of a
-- position is derived by summing its events' signed effect — never
-- stored as a separately-maintained running balance. A mutable balance
-- column is exactly the kind of thing that silently drifts from reality
-- after one missed entry; nothing else in this schema works that way
-- (decisions, notes, ai_analyses are all append-only for the same
-- reason), and financing shouldn't be the exception.
--
-- Refinance convention (documented, not enforced by a trigger — keeping
-- this simple rather than building automation for a two-step action):
-- record a 'payoff'-style 'refinance' event (direction='decrease') on
-- the OLD position to close it out (status -> 'refinanced_out'), and a
-- 'draw' event (direction='increase') on a NEW financing_positions row
-- for the new principal. Two rows, two events, linked only by both
-- referencing the same asset/business and by date proximity — no new
-- schema needed for that link.
-- =======================================================================
create table if not exists public.financing_positions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  position_type text not null default 'other'
    check (position_type in ('mortgage','loan','line_of_credit','seller_note','other')),
  status text not null default 'active'
    check (status in ('active','paid_off','refinanced_out')),
  lender text,
  opened_at date,
  closed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint financing_positions_one_subject check (
    (case when asset_id is not null then 1 else 0 end
   + case when business_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists financing_positions_asset_idx on public.financing_positions (asset_id);
create index if not exists financing_positions_business_idx on public.financing_positions (business_id);

drop trigger if exists financing_positions_set_updated_at on public.financing_positions;
create trigger financing_positions_set_updated_at before update on public.financing_positions
  for each row execute procedure public.set_updated_at();

create table if not exists public.financing_events (
  id uuid primary key default gen_random_uuid(),
  financing_position_id uuid not null references public.financing_positions (id) on delete cascade,
  event_type text not null default 'other'
    check (event_type in ('draw','principal_payment','refinance','payoff','modification','other')),
  direction text not null
    check (direction in ('increase','decrease','neutral')),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  event_date date not null default current_date,
  -- What the drawn capital was actually used for. One financing position
  -- can fund several different things over time (a HELOC drawn down
  -- across multiple unrelated purchases) — that's why destination lives
  -- on the event, not the position.
  destination_type text check (destination_type in ('opportunity','project','business','asset','capital_need','general','other')),
  destination_id uuid,
  terms jsonb not null default '{}'::jsonb,
  decision_id uuid references public.decisions (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists financing_events_position_idx on public.financing_events (financing_position_id);
create index if not exists financing_events_destination_idx on public.financing_events (destination_type, destination_id);

-- =======================================================================
-- Capital Need — what an opportunity/project/business/asset requires to
-- proceed. Core normalized columns are only what's likely to be filtered
-- on; everything else (preferred/acceptable capital types, collateral
-- requirements, ownership/control implications, repayment
-- characteristics, geography, other constraints) goes in `requirements`
-- jsonb — the same "structured JSONB, not a guessed column list" pattern
-- already proven by investment_mandates.rights. `existing committed
-- capital` / `remaining requirement` are deliberately NOT stored columns
-- here: they're derived from accepted match_candidates, for the same
-- drift reason financing balances are derived rather than stored.
-- =======================================================================
create table if not exists public.capital_needs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('opportunity','project','business','asset')),
  target_id uuid not null,
  amount numeric(14,2),
  purpose text,
  timing text,
  status text not null default 'open'
    check (status in ('draft','open','partially_met','met','withdrawn')),
  requirements jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists capital_needs_target_idx on public.capital_needs (target_type, target_id);
create index if not exists capital_needs_status_idx on public.capital_needs (status);

drop trigger if exists capital_needs_set_updated_at on public.capital_needs;
create trigger capital_needs_set_updated_at before update on public.capital_needs
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Capital Source — the broader abstraction. An outside investor
-- (investment_mandates, unchanged and untouched) is exactly one kind of
-- capital source among several; this table wraps it for matching
-- purposes without altering or duplicating anything on
-- investment_mandates itself. Other source types (seller financing,
-- bank/SBA/equipment debt, an existing Atlas business's cash flow, an
-- existing Atlas asset's borrowing capacity, a strategic partner,
-- customer prepayment, contributed resources) get a comparable row
-- without being forced through investor-specific fields that don't
-- apply to them (qualification status, relationship history, etc.).
-- =======================================================================
create table if not exists public.capital_sources (
  id uuid primary key default gen_random_uuid(),
  capital_source_type text not null
    check (capital_source_type in (
      'atlas_equity','investor_mandate','seller_financing','bank_debt','sba_debt',
      'equipment_financing','internal_cashflow','atlas_business','atlas_asset',
      'strategic_partner','customer_prepayment','contributed_resources','other'
    )),
  investment_mandate_id uuid references public.investment_mandates (id) on delete set null,
  source_business_id uuid references public.businesses (id) on delete set null,
  source_asset_id uuid references public.assets (id) on delete set null,
  name text,
  terms jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','inactive','exhausted')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists capital_sources_type_idx on public.capital_sources (capital_source_type);
create index if not exists capital_sources_mandate_idx on public.capital_sources (investment_mandate_id);

drop trigger if exists capital_sources_set_updated_at on public.capital_sources;
create trigger capital_sources_set_updated_at before update on public.capital_sources
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Capital Availability — what could ACTUALLY be mobilized right now,
-- distinct from the Capital Source's identity. Append-only, same reason
-- as asset_valuations: "how much is available" changes over time and a
-- mutable single field would go stale silently. Current availability is
-- just the latest row for a source.
-- =======================================================================
create table if not exists public.capital_availability (
  id uuid primary key default gen_random_uuid(),
  capital_source_id uuid not null references public.capital_sources (id) on delete cascade,
  amount_available numeric(14,2),
  as_of_date date not null default current_date,
  conditions jsonb not null default '{}'::jsonb,
  assessed_by text not null default 'founder' check (assessed_by in ('founder','ai')),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists capital_availability_source_idx on public.capital_availability (capital_source_id, as_of_date desc);

-- =======================================================================
-- External entities — lightweight, deliberately not a CRM. Exists so
-- "Restaurant X" can be one row referenced from many ecosystem
-- relationships (as customer, supplier, acquisition target, competitor,
-- referral partner) instead of the same name retyped as unrelated free
-- text in every row it appears in.
-- =======================================================================
create table if not exists public.external_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity_type text not null default 'company'
    check (entity_type in ('company','individual','marketplace','broker','other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

drop trigger if exists external_entities_set_updated_at on public.external_entities;
create trigger external_entities_set_updated_at before update on public.external_entities
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Ecosystem relationships — the Ecosystem Layer's core table. One shape
-- serves founder-entered facts ("my brewery sells to my bar", source
-- default 'founder', validation_status effectively pre-confirmed by the
-- founder entering it) AND AI-discovered hypotheses (source
-- 'ai_discovered', validation_status starts 'proposed' until the founder
-- confirms/rejects/ignores it) AND negative-space observations (an edge
-- to an external_entity of type 'external_dependency'). Deliberately a
-- SEPARATE table from the existing generic `relationships` table, which
-- keeps doing its current job (simple symmetric "related items" links in
-- the UI) — this one is typed, directed, evidence-bearing, and carries
-- an AI-discovery/validation workflow that the generic table was never
-- designed for.
-- =======================================================================
create table if not exists public.ecosystem_relationships (
  id uuid primary key default gen_random_uuid(),
  from_type text not null check (from_type in ('opportunity','project','business','asset','capital_need')),
  from_id uuid not null,
  to_type text not null check (to_type in ('opportunity','project','business','asset','capital_need','external_entity')),
  to_id uuid not null,
  relationship_type text not null check (relationship_type in (
    'supplier','customer','distributor','shared_equipment','shared_facility','shared_labor',
    'lead_generation','cross_sell','capacity_utilization','byproduct_utilization',
    'procurement_aggregation','geographic_cluster','complementary_service','financing',
    'collateral','strategic_dependency','potential_conflict','competitive',
    'replacement_opportunity','external_dependency','other'
  )),
  direction text not null default 'directed' check (direction in ('directed','mutual')),
  source text not null default 'founder' check (source in ('founder','ai_discovered')),
  confidence text check (confidence in ('low','medium','high')),
  potential_effect text,
  evidence text,
  assumptions text,
  unknowns text,
  validation_status text not null default 'proposed'
    check (validation_status in ('proposed','confirmed','rejected','ignored')),
  validated_by uuid references public.profiles (id),
  validated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists ecosystem_relationships_from_idx on public.ecosystem_relationships (from_type, from_id);
create index if not exists ecosystem_relationships_to_idx on public.ecosystem_relationships (to_type, to_id);
create index if not exists ecosystem_relationships_validation_idx on public.ecosystem_relationships (validation_status);

drop trigger if exists ecosystem_relationships_set_updated_at on public.ecosystem_relationships;
create trigger ecosystem_relationships_set_updated_at before update on public.ecosystem_relationships
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Capital utility assessments — analytical profile of a business/asset's
-- financing capacity (borrowing capacity, collateral quality, lending
-- accessibility, liquidity, cash-flow capacity, equity-generation
-- potential, ability to support another Atlas business, encumbrance
-- tolerance, strategic importance, saleability). Explicitly NOT a
-- financing guarantee and NOT the same thing as asset_valuations' dollar
-- figure — this is a labeled, qualitative "assessment" record, append-
-- only like every other AI/founder judgment in this schema.
-- =======================================================================
create table if not exists public.capital_utility_assessments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('business','asset')),
  target_id uuid not null,
  assessed_by text not null default 'founder' check (assessed_by in ('founder','ai')),
  assessment jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists capital_utility_assessments_target_idx on public.capital_utility_assessments (target_type, target_id);

-- =======================================================================
-- Match candidates — Capital Need <-> Capital Source compatibility
-- analysis. Never an approval: status only ever reaches
-- 'founder_reviewed' or 'dismissed' here. Actual approval happens
-- through the existing Decision -> Approved Structure -> Professional
-- Review pipeline, unchanged and unreferenced by this table's status.
-- =======================================================================
create table if not exists public.match_candidates (
  id uuid primary key default gen_random_uuid(),
  capital_need_id uuid not null references public.capital_needs (id) on delete cascade,
  capital_source_id uuid not null references public.capital_sources (id) on delete cascade,
  compatible_dimensions jsonb not null default '[]'::jsonb,
  conflicting_dimensions jsonb not null default '[]'::jsonb,
  unknown_dimensions jsonb not null default '[]'::jsonb,
  questions_for_founder text,
  potential_structure_id uuid references public.approved_structures (id) on delete set null,
  provenance text not null default 'founder' check (provenance in ('founder','ai')),
  status text not null default 'proposed' check (status in ('proposed','founder_reviewed','dismissed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists match_candidates_need_idx on public.match_candidates (capital_need_id);
create index if not exists match_candidates_source_idx on public.match_candidates (capital_source_id);

drop trigger if exists match_candidates_set_updated_at on public.match_candidates;
create trigger match_candidates_set_updated_at before update on public.match_candidates
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Predictions — the general-purpose AI hypothesis/evaluation lifecycle.
-- One shared table for every kind of "Atlas predicted X, here's whether
-- it turned out to be true" — ecosystem relationship effects, match
-- compatibility, capital utility estimates, business plan projections,
-- opportunity analysis claims — rather than bolting a duplicate
-- evaluation-tracking shape onto each of those tables individually.
-- "Hasn't happened yet" is not failure: `expired` and
-- `unable_to_evaluate` are distinct from `contradicted`.
-- =======================================================================
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in (
    'ecosystem_relationship','match_candidate','capital_utility_assessment',
    'ai_analysis','business_plan_analysis','opportunity','other'
  )),
  subject_id uuid,
  category text not null default 'other' check (category in (
    'relationship_discovery','financial_estimation','acquisition_screening','benchmarking',
    'operational_prediction','capital_analysis','ecosystem_opportunity_discovery','other'
  )),
  prediction_summary text not null,
  expected_outcome text,
  predicted_at timestamptz not null default now(),
  economic_clock_at date,
  evaluation_clock_at date,
  status text not null default 'proposed' check (status in (
    'proposed','under_evaluation','developing','validated','contradicted','expired','unable_to_evaluate'
  )),
  observed_outcome text,
  variance text,
  variance_reason text check (variance_reason in ('execution','market','data_quality','reasoning_error','other')),
  evaluated_at timestamptz,
  evaluated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists predictions_subject_idx on public.predictions (subject_type, subject_id);
create index if not exists predictions_status_idx on public.predictions (status);
create index if not exists predictions_category_idx on public.predictions (category);

drop trigger if exists predictions_set_updated_at on public.predictions;
create trigger predictions_set_updated_at before update on public.predictions
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Opportunity Acquisition Layer: provenance + diligence.
--
-- A 1:1 companion to `opportunities`, populated only for externally-
-- sourced ones — keeps the core opportunities table (and V0.1's simple
-- capture workflow) completely unchanged. Answers the provenance
-- questions the architecture requires: where this came from, when
-- discovered, what source, when last observed, what information tier
-- Atlas currently has. `information_tier` is also the field that makes
-- future benchmarking segmentation possible without building a
-- benchmarking engine now.
-- =======================================================================
create table if not exists public.opportunity_provenance (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null unique references public.opportunities (id) on delete cascade,
  external_entity_id uuid references public.external_entities (id) on delete set null,
  discovery_channel text not null default 'founder' check (discovery_channel in (
    'marketplace','broker','public_web','direct_submission','referral','public_records',
    'founder','ai_ecosystem_discovery','other'
  )),
  information_tier text not null default 'discovery' check (information_tier in ('discovery','screening','diligence')),
  first_discovered_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  still_available boolean,
  source_url text,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

drop trigger if exists opportunity_provenance_set_updated_at on public.opportunity_provenance;
create trigger opportunity_provenance_set_updated_at before update on public.opportunity_provenance
  for each row execute procedure public.set_updated_at();

-- Tracks WHAT diligence items exist/are needed/received for an
-- opportunity, not the documents themselves — no file storage in this
-- phase (see README). A checklist with status + notes is enough to
-- support the discovery -> screening -> diligence progression without
-- building a document management system prematurely.
create table if not exists public.diligence_items (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  item_type text not null check (item_type in (
    'pnl','balance_sheet','tax_return','lease','customer_concentration','equipment_list',
    'payroll','debt_schedule','contracts','inventory','seller_disclosure','other'
  )),
  status text not null default 'requested' check (status in ('requested','received','reviewed','not_applicable')),
  received_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists diligence_items_opportunity_idx on public.diligence_items (opportunity_id);

drop trigger if exists diligence_items_set_updated_at on public.diligence_items;
create trigger diligence_items_set_updated_at before update on public.diligence_items
  for each row execute procedure public.set_updated_at();

-- =======================================================================
-- Business plan analyses — deliberately a separate table from
-- ai_analyses rather than widening AnalysisResult's shape. The generic
-- "Analyze with Atlas" action (ai_analyses) stays exactly as it is for
-- every opportunity; this is a distinct, richer analysis specific to
-- business-plan-shaped input (business model, revenue model, cost
-- structure, capital requirements, ecosystem fit, etc.), invoked as a
-- separate founder action. Same append-only, never-overwritten,
-- provider/model-labeled history pattern as ai_analyses.
-- =======================================================================
create table if not exists public.business_plan_analyses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  provider text not null,
  model text,
  input_context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists business_plan_analyses_opportunity_idx on public.business_plan_analyses (opportunity_id);

-- =======================================================================
-- Decisions: additive provenance links, non-breaking. Lets a financing
-- decision, a capital-need-driven decision, or an ecosystem-relationship
-- decision point back to its cause the same way decisions already link
-- to opportunities/projects/businesses.
-- =======================================================================
alter table public.decisions add column if not exists financing_event_id uuid references public.financing_events (id) on delete set null;
alter table public.decisions add column if not exists capital_need_id uuid references public.capital_needs (id) on delete set null;
alter table public.decisions add column if not exists ecosystem_relationship_id uuid references public.ecosystem_relationships (id) on delete set null;

-- =======================================================================
-- RLS — same founder-only policy as everything else in this schema
-- (is_founder(), not merely "authenticated"; see 0001_init.sql and the
-- Phase 1 hardening pass). No exceptions for any table added here.
-- =======================================================================
alter table public.asset_valuations enable row level security;
alter table public.financing_positions enable row level security;
alter table public.financing_events enable row level security;
alter table public.capital_needs enable row level security;
alter table public.capital_sources enable row level security;
alter table public.capital_availability enable row level security;
alter table public.external_entities enable row level security;
alter table public.ecosystem_relationships enable row level security;
alter table public.capital_utility_assessments enable row level security;
alter table public.match_candidates enable row level security;
alter table public.predictions enable row level security;
alter table public.opportunity_provenance enable row level security;
alter table public.diligence_items enable row level security;
alter table public.business_plan_analyses enable row level security;

create policy "asset_valuations_founder_all" on public.asset_valuations
  for all using (public.is_founder()) with check (public.is_founder());
create policy "financing_positions_founder_all" on public.financing_positions
  for all using (public.is_founder()) with check (public.is_founder());
create policy "financing_events_founder_all" on public.financing_events
  for all using (public.is_founder()) with check (public.is_founder());
create policy "capital_needs_founder_all" on public.capital_needs
  for all using (public.is_founder()) with check (public.is_founder());
create policy "capital_sources_founder_all" on public.capital_sources
  for all using (public.is_founder()) with check (public.is_founder());
create policy "capital_availability_founder_all" on public.capital_availability
  for all using (public.is_founder()) with check (public.is_founder());
create policy "external_entities_founder_all" on public.external_entities
  for all using (public.is_founder()) with check (public.is_founder());
create policy "ecosystem_relationships_founder_all" on public.ecosystem_relationships
  for all using (public.is_founder()) with check (public.is_founder());
create policy "capital_utility_assessments_founder_all" on public.capital_utility_assessments
  for all using (public.is_founder()) with check (public.is_founder());
create policy "match_candidates_founder_all" on public.match_candidates
  for all using (public.is_founder()) with check (public.is_founder());
create policy "predictions_founder_all" on public.predictions
  for all using (public.is_founder()) with check (public.is_founder());
create policy "opportunity_provenance_founder_all" on public.opportunity_provenance
  for all using (public.is_founder()) with check (public.is_founder());
create policy "diligence_items_founder_all" on public.diligence_items
  for all using (public.is_founder()) with check (public.is_founder());
create policy "business_plan_analyses_founder_all" on public.business_plan_analyses
  for all using (public.is_founder()) with check (public.is_founder());

-- =======================================================================
-- Feature flag — same pattern as investor_protocol_enabled: off by
-- default, one founder toggle, gates the Business/Asset/Financing/
-- Capital Need & Source/Ecosystem/Intelligence UI, not the underlying
-- data (RLS above already restricts everything to the founder
-- regardless of this flag). Business plan analysis and opportunity
-- provenance/diligence stay ungated on the opportunity detail page —
-- they're core to the first usable milestone, not part of this deferred
-- module.
-- =======================================================================
insert into public.feature_flags (key, enabled, description) values
  ('capital_ecosystem_enabled', false,
   'Enables the internal Capital & Ecosystem module (businesses/assets financial profile, capital needs/sources, ecosystem relationships, match candidates, intelligence reports). Founder-only internal modeling — see README.')
on conflict (key) do nothing;
