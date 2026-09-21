-- Atlas Investor Protocol — architectural foundation
--
-- This migration is data-model-only. Atlas is currently founder-funded and
-- single-user; no outside investors are being onboarded. Nothing here
-- creates a solicitation, offering, or execution workflow — it exists so
-- the founder can record investor relationships and internally model
-- possible investment configurations, all gated behind
-- feature_flags.investor_protocol_enabled (default false) and none of it
-- legally binding until reviewed by qualified counsel.

-- ---------------------------------------------------------------------
-- feature_flags — generic, reusable for future toggles beyond this one
-- ---------------------------------------------------------------------
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.feature_flags (key, enabled, description) values
  ('investor_protocol_enabled', false,
   'Enables the internal Investor Protocol module (investor profiles, investment mandates, approved structures). Founder-only record-keeping and internal modeling — not an onboarding, solicitation, or document-execution system.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- assets — minimal object, same "object only" treatment as businesses.
-- Added because the investor protocol needs a target beyond
-- opportunity/project/business (an asset or asset-owning entity).
-- ---------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active','dormant','sold','retired')),
  business_id uuid references public.businesses (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at before update on public.assets
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- investor_profiles — the persistent relationship between a person/entity
-- and Atlas. Persists across multiple investment mandates.
-- ---------------------------------------------------------------------
create table if not exists public.investor_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity_type text not null default 'individual'
    check (entity_type in ('individual','entity')),
  contact_email text,
  contact_phone text,
  relationship_status text not null default 'prospective'
    check (relationship_status in ('prospective','active','inactive','declined')),
  preferred_involvement_level text
    check (preferred_involvement_level in ('financial','informed','advisory','operating','strategic_partner')),
  preferred_reporting_frequency text,
  preferred_investment_horizon text,
  investment_interests text,
  capabilities_contributions text,
  atlas_network_preferences text,
  qualification_status text not null default 'unverified'
    check (qualification_status in ('unverified','self_attested','professionally_verified','not_applicable')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

drop trigger if exists investor_profiles_set_updated_at on public.investor_profiles;
create trigger investor_profiles_set_updated_at before update on public.investor_profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- approved_structures — an internal library of pre-approved investment
-- structures. The app never invents or drafts these; a founder (and
-- eventually counsel) authors them, and this table only records them.
-- ---------------------------------------------------------------------
create table if not exists public.approved_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  permitted_configurations jsonb not null default '{}'::jsonb,
  required_fields text[] not null default '{}',
  prohibited_combinations text,
  document_templates jsonb not null default '[]'::jsonb,
  review_status text not null default 'draft'
    check (review_status in ('draft','internally_designed','professional_review','approved','active','retired')),
  version text not null default '0.1',
  effective_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

drop trigger if exists approved_structures_set_updated_at on public.approved_structures;
create trigger approved_structures_set_updated_at before update on public.approved_structures
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- professional_reviews — records of a qualified professional's review of
-- an approved structure. No structure is "Approved" merely because a
-- founder created it; this table is where that gate is evidenced.
-- ---------------------------------------------------------------------
create table if not exists public.professional_reviews (
  id uuid primary key default gen_random_uuid(),
  approved_structure_id uuid not null references public.approved_structures (id) on delete cascade,
  reviewer_name text not null,
  professional_type text not null default 'other'
    check (professional_type in ('attorney','accountant','tax_advisor','other')),
  review_date date not null default current_date,
  document_reference text,
  comments text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected','needs_revision')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists professional_reviews_structure_idx on public.professional_reviews (approved_structure_id);

-- ---------------------------------------------------------------------
-- investment_mandates — a specific investment relationship. An investor
-- can have many mandates against different targets. `target_type` +
-- `target_id` is an unenforced polymorphic reference (same pattern as
-- public.relationships), because the target can be Atlas itself (no row
-- to point to) or any of several tables.
--
-- `rights` captures the independently-configurable dimensions from the
-- addendum (economics, control, involvement, liquidity, information,
-- atlas_access) as one structured document rather than six more tables —
-- consistent with "capture cheaply, don't over-normalize before it's
-- justified." Shape is documented in src/lib/types.ts, not enforced here.
-- None of this is a legal promise; it's an internal modeling tool.
-- ---------------------------------------------------------------------
create table if not exists public.investment_mandates (
  id uuid primary key default gen_random_uuid(),
  investor_profile_id uuid not null references public.investor_profiles (id) on delete cascade,
  target_type text not null default 'atlas'
    check (target_type in ('atlas','opportunity','project','business','asset','other')),
  target_id uuid,
  target_note text,
  investment_amount numeric(14,2),
  investment_type text,
  contribution_types text[] not null default '{}'
    check (contribution_types <@ array[
      'cash','debt_capacity','business','real_estate','equipment',
      'customers_distribution','expertise','labor','relationships',
      'intellectual_property','other','combination'
    ]::text[]),
  contribution_notes text,
  rights jsonb not null default '{}'::jsonb,
  term text,
  special_conditions text,
  liquidity_note text,
  status text not null default 'draft'
    check (status in ('draft','proposed','under_review','active','completed','terminated')),
  approved_structure_id uuid references public.approved_structures (id) on delete set null,
  documents_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint investment_mandates_target_id_required check (
    (target_type in ('atlas','other') and target_id is null)
    or (target_type not in ('atlas','other') and target_id is not null)
  )
);

create index if not exists investment_mandates_investor_idx on public.investment_mandates (investor_profile_id);
create index if not exists investment_mandates_target_idx on public.investment_mandates (target_type, target_id);
create index if not exists investment_mandates_structure_idx on public.investment_mandates (approved_structure_id);

drop trigger if exists investment_mandates_set_updated_at on public.investment_mandates;
create trigger investment_mandates_set_updated_at before update on public.investment_mandates
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- extend notes / decisions so investor relationship history and mandate
-- discussion land in the same institutional-memory tables everything
-- else uses, rather than a parallel system.
-- ---------------------------------------------------------------------
alter table public.notes add column if not exists investor_profile_id uuid references public.investor_profiles (id) on delete cascade;
alter table public.notes add column if not exists investment_mandate_id uuid references public.investment_mandates (id) on delete cascade;

alter table public.notes drop constraint if exists notes_one_parent;
alter table public.notes add constraint notes_one_parent check (
  (case when opportunity_id is not null then 1 else 0 end
 + case when project_id is not null then 1 else 0 end
 + case when business_id is not null then 1 else 0 end
 + case when investor_profile_id is not null then 1 else 0 end
 + case when investment_mandate_id is not null then 1 else 0 end) = 1
);

create index if not exists notes_investor_profile_idx on public.notes (investor_profile_id);
create index if not exists notes_investment_mandate_idx on public.notes (investment_mandate_id);

alter table public.decisions add column if not exists investor_profile_id uuid references public.investor_profiles (id) on delete set null;
alter table public.decisions add column if not exists investment_mandate_id uuid references public.investment_mandates (id) on delete set null;

create index if not exists decisions_investor_profile_idx on public.decisions (investor_profile_id);
create index if not exists decisions_investment_mandate_idx on public.decisions (investment_mandate_id);

-- ---------------------------------------------------------------------
-- RLS — same single-founder "any authenticated user" policy as the rest
-- of V0.1. created_by is recorded on every row for a future multi-user
-- tightening, same as elsewhere.
-- ---------------------------------------------------------------------
alter table public.feature_flags enable row level security;
alter table public.assets enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.investment_mandates enable row level security;
alter table public.approved_structures enable row level security;
alter table public.professional_reviews enable row level security;

create policy "feature_flags_authenticated_read" on public.feature_flags
  for select using (auth.role() = 'authenticated');
create policy "feature_flags_authenticated_write" on public.feature_flags
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "assets_authenticated_all" on public.assets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "investor_profiles_authenticated_all" on public.investor_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "investment_mandates_authenticated_all" on public.investment_mandates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "approved_structures_authenticated_all" on public.approved_structures
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "professional_reviews_authenticated_all" on public.professional_reviews
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
