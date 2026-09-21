-- Atlas OS V0.1 — core schema
-- Single-user (founder) system. RLS is enabled and scoped to authenticated
-- users so the architecture can grow into multi-user later without a
-- rewrite, but V0.1 does not implement per-user permissions.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: mirrors auth.users, gives us a stable FK target for
-- "created_by" style columns without depending on the auth schema shape.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- enums (kept as text + check constraints rather than pg enums so new
-- values can be added later without a blocking migration)
-- ---------------------------------------------------------------------
-- opportunity.status: captured | evaluating | approved | active_project | graduated | killed | archived
-- opportunity.attention: now | later | watch | archived
-- project.status: active | paused | graduated | killed
-- business.status: active | dormant | sold | closed
-- note.kind: note | research

-- ---------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text,
  full_description text,
  category text not null default 'other'
    check (category in ('business_idea','acquisition','product','service','asset','technology','partnership','investment','other')),
  status text not null default 'captured'
    check (status in ('captured','evaluating','approved','active_project','graduated','killed','archived')),
  attention text not null default 'watch'
    check (attention in ('now','later','watch','archived')),
  source text,
  tags text[] not null default '{}',
  next_action text,
  founder_assessment text,
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists opportunities_status_idx on public.opportunities (status);
create index if not exists opportunities_attention_idx on public.opportunities (attention);
create index if not exists opportunities_tags_idx on public.opportunities using gin (tags);
create index if not exists opportunities_search_idx on public.opportunities
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(full_description,'')));

-- ---------------------------------------------------------------------
-- projects — an opportunity the founder has committed to developing
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities (id) on delete set null,
  name text not null,
  objective text,
  status text not null default 'active'
    check (status in ('active','paused','graduated','killed')),
  start_date date not null default current_date,
  target_review_date date,
  capital_invested numeric(14,2) not null default 0,
  time_invested_hours numeric(10,1) not null default 0,
  graduation_criteria text,
  kill_criteria text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_opportunity_idx on public.projects (opportunity_id);

-- ---------------------------------------------------------------------
-- businesses — real operating businesses (object only for V0.1)
-- ---------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active','dormant','sold','closed')),
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

-- ---------------------------------------------------------------------
-- decisions — institutional memory
-- ---------------------------------------------------------------------
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  decision text not null,
  reasoning text,
  decided_at date not null default current_date,
  review_date date,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists decisions_opportunity_idx on public.decisions (opportunity_id);
create index if not exists decisions_project_idx on public.decisions (project_id);
create index if not exists decisions_review_date_idx on public.decisions (review_date);

-- ---------------------------------------------------------------------
-- principles — visible to the AI during analysis, editable, not hard-coded
-- ---------------------------------------------------------------------
create table if not exists public.principles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

-- ---------------------------------------------------------------------
-- notes — notes & research, attachable to any parent record
-- ---------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  kind text not null default 'note' check (kind in ('note','research')),
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint notes_one_parent check (
    (case when opportunity_id is not null then 1 else 0 end
   + case when project_id is not null then 1 else 0 end
   + case when business_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists notes_opportunity_idx on public.notes (opportunity_id);
create index if not exists notes_project_idx on public.notes (project_id);

-- ---------------------------------------------------------------------
-- experiments — small bets run inside a project
-- ---------------------------------------------------------------------
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  hypothesis text not null,
  action text,
  cost numeric(14,2),
  time_hours numeric(10,1),
  expected_result text,
  actual_result text,
  learning text,
  date date not null default current_date,
  decision_id uuid references public.decisions (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists experiments_project_idx on public.experiments (project_id);

-- ---------------------------------------------------------------------
-- relationships — generic "related Atlas items" linking, symmetric
-- ---------------------------------------------------------------------
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  from_type text not null check (from_type in ('opportunity','project','business')),
  from_id uuid not null,
  to_type text not null check (to_type in ('opportunity','project','business')),
  to_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  unique (from_type, from_id, to_type, to_id)
);

create index if not exists relationships_from_idx on public.relationships (from_type, from_id);
create index if not exists relationships_to_idx on public.relationships (to_type, to_id);

-- ---------------------------------------------------------------------
-- ai_analyses — full history of AI-assisted analysis, never overwrites
-- ---------------------------------------------------------------------
create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  provider text not null,
  model text,
  input_context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists ai_analyses_opportunity_idx on public.ai_analyses (opportunity_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at before update on public.opportunities
  for each row execute procedure public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute procedure public.set_updated_at();

drop trigger if exists principles_set_updated_at on public.principles;
create trigger principles_set_updated_at before update on public.principles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security — V0.1 is single-user: any authenticated user
-- (the founder) has full access. Architecture leaves room to scope by
-- created_by / org later without a schema rewrite.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.projects enable row level security;
alter table public.businesses enable row level security;
alter table public.decisions enable row level security;
alter table public.principles enable row level security;
alter table public.notes enable row level security;
alter table public.experiments enable row level security;
alter table public.relationships enable row level security;
alter table public.ai_analyses enable row level security;

create policy "profiles_self" on public.profiles
  for select using (auth.uid() = id);

create policy "opportunities_authenticated_all" on public.opportunities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "projects_authenticated_all" on public.projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "businesses_authenticated_all" on public.businesses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "decisions_authenticated_all" on public.decisions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "principles_authenticated_all" on public.principles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "notes_authenticated_all" on public.notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "experiments_authenticated_all" on public.experiments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "relationships_authenticated_all" on public.relationships
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "ai_analyses_authenticated_all" on public.ai_analyses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
