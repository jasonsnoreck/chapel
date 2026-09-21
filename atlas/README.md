# Atlas OS — V0.1

Internal idea, project & decision operating system. See the V0.1 spec this
was built against for the full product context; this README covers what's
here and how to run it.

Atlas lives in this `atlas/` subdirectory so it doesn't touch the existing
Chapel PWA (`index.html`, `supply.html`, `sw.js`, `pocketbase/`) at the repo
root — Chapel is itself one of Atlas's own seed projects.

## Stack

- Next.js 14 (App Router) + React + TypeScript
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Tailwind CSS
- A provider-agnostic AI abstraction (`src/lib/ai`) — defaults to a
  no-network mock provider; set `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`
  for real analysis via the Claude API. Swapping providers never touches
  calling code.

## Setup

1. **Create a Supabase project** (or use an existing one for local dev).
2. **Run the migrations** in `supabase/migrations/` in order, either via
   the Supabase SQL editor or the Supabase CLI:
   ```
   supabase db push
   ```
   or paste each migration file, in order, into the SQL editor:
   `0001_init.sql` creates the schema, RLS policies, and an
   `on_auth_user_created` trigger that mirrors new `auth.users` rows into
   `public.profiles`. `0002_seed.sql` seeds the founder's actual first
   Atlas principles and opportunities (soap, mushrooms, mushroom supplies,
   soy sauce, Blue Star, Chapel, and a business acquisition lead) — not
   dummy data. `0003_investor_protocol.sql` adds the Investor Protocol
   architectural foundation (see below) — data model only, disabled by
   default. `0004_capital_ecosystem_architecture.sql` adds the Capital &
   Ecosystem architecture (see below) — new tables and RLS only, gated by
   its own feature flag, disabled by default. This is a **new forward
   migration**, not an edit to 0001–0003: this sandbox has no way to
   confirm whether an earlier migration has already been applied to a
   real Supabase project, so the safe assumption was made that it might
   have been — see **Known limitations**.
3. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from
     Supabase project settings → API.
   - `AI_PROVIDER=mock` to start (no key needed), or `anthropic` +
     `ANTHROPIC_API_KEY` for real AI analysis.
4. **Create the founder account.** V0.1 is single-user: run `npm install`,
   `npm run dev`, then open `/login`. Until a founder account exists, the
   page shows only a one-time setup form; submit it once and Atlas is
   permanently single-user from then on (see **Security model** below —
   this isn't just a UI restriction, it's enforced by the database).
   Supabase's default project settings require email confirmation —
   either confirm via the email Supabase sends, or disable email
   confirmation in Supabase Auth settings for local development.
5. **Recommended (out-of-band, not app code):** once the founder account
   is created, disable "Allow new user signups" in the Supabase project's
   Auth settings. The app already refuses to create a second account and
   RLS already denies a second account any data access even if one is
   somehow created — this is an extra belt-and-suspenders step at the
   platform level, not something the app can do for you from code.

```
npm install
npm run dev
```

## What's implemented (V0.1 scope)

- **Quick Capture** — a single textarea on the dashboard; an opportunity
  record is created immediately, no required fields beyond the text.
- **Inbox** — review queue for newly captured opportunities: move to
  evaluating, defer, watch, archive, or kill.
- **Opportunities** — list with status/attention/category filters and
  keyword search, detail page with editable fields, notes & research,
  AI analysis, related items, and a "Promote to project" action that also
  records the promotion as a Decision.
- **Projects** — objective, status, capital/time invested (manual entry),
  graduation/kill criteria, next action, and **Experiments** (hypothesis →
  action → cost/time → expected vs. actual result → learning).
- **Decisions** — subject, decision, reasoning, review date, linked to an
  opportunity/project/business. Institutional memory, never overwritten.
- **Principles** — editable records (not hard-coded prompts), seeded with
  the founder's initial Atlas principles, visible to the AI during
  analysis.
- **AI analysis** ("Analyze with Atlas") — sends the opportunity, its
  notes, active principles, related projects, and relevant prior decisions
  to the configured AI provider. Returns structured, clearly-labeled
  output: what it is, why it might matter, assumptions, unknowns, the
  cheapest useful test, potential Atlas fit, risks, and a suggested next
  step — explicitly a suggestion, never a decision. Every run is saved to
  history, never overwrites a prior analysis.
- **Relationships** — a simple "Related Atlas items" list + link picker on
  opportunities and projects. No graph visualization, per spec.
- **Global search** — across opportunities, projects, businesses,
  decisions, principles, and notes.
- **Dashboard** — Attention (active projects / ideas awaiting review /
  decisions awaiting review / upcoming project reviews), Pipeline
  (captured / evaluating / active / later / watch), current projects,
  recent decisions, and Quick Capture. No financial dashboard.
- **Founder control** — the AI never writes a status change, promotion,
  kill decision, or principle edit; every state transition is an explicit
  founder action (a form submit), and promoting an opportunity to a
  project always creates a paired Decision record.

Not built, per spec: investor portal, multi-user permissions, public
website, full accounting, banking/payroll integrations, CRM, automated
investment decisions, acquisition transaction management, mobile app.
The schema (`businesses` table, `created_by` on every row) leaves room
for these without a rewrite, but none of it is implemented now —
including multi-user: V0.1 is hard-scoped to exactly one founder account,
see **Security model** below. Asset/property tracking, capital-need
modeling, and a matching foundation are now implemented — see
**Capital & Ecosystem Architecture** below.

## Investor Protocol (architectural foundation only)

Per the Investor Architecture Addendum: Atlas is currently founder-funded
and single-user, and this is **not** an active investor onboarding,
solicitation, or document-execution system — it's the data model and a
minimal internal record-keeping UI so the founder can start capturing
real investor relationships without a later rewrite.

- **Gated by `feature_flags.investor_protocol_enabled`** (default
  `false`, seeded in `0003_investor_protocol.sql`). Visiting `/investors`
  while disabled shows a one-paragraph explanation and a single toggle —
  no investor-facing UI exists anywhere in this app, only this founder
  toggle. Flipping it only reveals founder-only CRUD; it flips nothing
  else and sends nothing to anyone.
- **One investor, many mandates.** `investor_profiles` is the persistent
  relationship (identity, preferences, qualification status, relationship
  history via the same `notes` table everything else uses).
  `investment_mandates` is the specific investment — an investor can have
  several, each against a different target (`target_type`/`target_id`
  polymorphically points at Atlas itself, an opportunity, project,
  business, asset, or an unmodeled future vehicle — same unenforced
  polymorphic pattern as `public.relationships`).
- **Rights are one structured document per mandate** (`investment_mandates.rights`,
  typed as `RightsConfiguration` in `src/lib/types.ts`), not six more
  tables — economics, control, involvement, liquidity, information access,
  and Atlas network privileges, mirroring the addendum's "investor
  switchboard" mockup. None of it is a legal promise; it's internal
  modeling.
- **Approved structures are authored by humans, never generated.**
  `approved_structures` is a library the founder (eventually with
  counsel) maintains; the app only stores and selects them. No structure
  is "Approved" merely by being created here — `professional_reviews`
  records who reviewed it, in what capacity, and their verdict, which is
  what actually gates `approved_structures.review_status`.
- **New `assets` table** (object-only, same minimal treatment as
  `businesses`) exists because the addendum lists "asset" and
  "asset-owning entity" as investment targets the original V0.1 schema
  had no table for.
- Explicitly **not** built, per the addendum: onboarding UI, investor
  portal, solicitation, securities documents, subscription agreements,
  actual investment acceptance, payment processing, KYC/AML, investor
  qualification determinations, automated legal/tax decisions.

## Capital & Ecosystem Architecture (implemented, internal-only)

This module — previously documented only as a future direction — is now
**implemented**: real tables, RLS, queries, server actions, and UI, gated
end-to-end behind `feature_flags.capital_ecosystem_enabled` (default
`false`, seeded in `0004_capital_ecosystem_architecture.sql`). Visiting
`/capital-ecosystem` while disabled shows a one-paragraph explanation and
a single founder toggle, same pattern as the Investor Protocol. Two
pieces — Business Plan Analysis and Opportunity provenance/diligence —
are deliberately **not** behind this flag; they live on the always-visible
opportunity detail page (see **First usable milestone** below).

The datasets here start empty on a fresh install. That's intentional, not
a placeholder: the schema was built to be ready to accumulate real
businesses, assets, capital needs, capital sources, and ecosystem
relationships from day one, not sized to "what V0.1 already has."

### Ontology (deliberately distinct concepts)

- **Business** vs **Asset** vs **Project** vs **Opportunity**: a Business
  is an operating entity; an Asset is a discrete piece of property
  (`asset_type`: real estate / equipment / IP / other); a Project is
  V0.1's existing execution unit; an Opportunity is anything not yet
  committed to. None of these tables were merged.
- **Ownership type matters.** `assets.ownership_type` (owned / leased /
  licensed / other) exists specifically so a **leased property is never
  represented as an owned asset** — the asset detail page shows an
  explicit warning banner when `ownership_type !== "owned"`, since
  valuation/financing recorded there describes Atlas's actual interest,
  not the underlying property.
- **Financing Position vs Financing Event.** `financing_positions` is the
  actual tracked instrument (a loan, a line of credit, seller financing —
  `position_type`); `financing_events` is its append-only ledger
  (draw/paydown/refinance/etc., each with an explicit `direction`:
  increase / decrease / neutral, not inferred from event type). **The
  current balance is never stored** — `derivedBalance()` in
  `src/lib/queries-capital.ts` reduces the event ledger at read time, so
  the balance can't silently drift from its history. An asset's
  unlevered valuation (`asset_valuations`) is recorded completely
  separately from its financing — paying down or refinancing debt never
  changes recorded valuation, and valuation and financing are shown in
  separate sections on the Business/Asset detail pages.
- **Capital Need vs Capital Source vs Capital Availability.** A Capital
  Need (`capital_needs`) is a first-class, richly attributed record
  (purpose, amount, target via `target_type`/`target_id`, status) — not
  just a number. Capital Source (`capital_sources`) is the broad
  abstraction; an Investment Mandate from the Investor Protocol is one
  possible `linked_source` a Capital Source can point at, not the only
  kind. Capital Availability (`capital_availability`) is separate from
  Capital Source on purpose — a source's *capacity* is point-in-time and
  changes, so it's modeled as its own append-only series rather than a
  mutable field on the source.
- **Investor Profile / Investment Mandate are untouched.** Nothing in
  this migration modifies those tables; Capital Source references them
  only through the polymorphic `linked_source` pattern already used
  elsewhere in this schema.

### Matching foundation (Discovery only — never an approval)

`match_candidates` links a Capital Need to a Capital Source and records
compatible dimensions, conflicting dimensions, open questions, and
possible structures as text — **there is no numeric score anywhere in
this schema**, on purpose. `match_candidates.status` only ever reaches
`proposed` or `founder_reviewed` from app code; nothing in this codebase
can move it further. The governance path this preserves, unchanged from
the Investor Protocol: Discovery → Analysis → Potential Match → Founder
Review → Approved Structure → Professional Review → Documentation →
Execution. Atlas does not move money, autonomously execute or negotiate
investments, or determine legal/securities status — those still require
the human/professional workflow the Investor Protocol already gates.

### Ecosystem relationships (founder-entered and AI-discovered, side by side)

`ecosystem_relationships` is a typed, directed edge between two nodes
(`business`/`asset`/`external_entity` on either side) carrying
`relationship_type`, `source` (`founder` or `ai_discovered`),
`confidence`, `evidence`, `assumptions`, `unknowns`, `potential_effect`,
and a `validation_status` lifecycle (`proposed` → `confirmed` /
`rejected` / `ignored`). It's intentionally a separate table from the
pre-existing generic `relationships` table (simple "related items" links
on opportunities/projects) — merging them would either bloat the simple
case or lose structure in the rich one.

The `/ecosystem` page's "Discover relationships" button runs
`discoverEcosystemRelationships` (`src/lib/actions/ecosystem.ts`), which
hands the AI provider a catalog of Atlas's real businesses/assets/
external entities (with real ids) and asks it to find relationships the
founder hasn't entered — including negative/conflicting ones, not just
synergy. Every candidate comes back with what it noticed, *why* Atlas
noticed it (the observable basis), evidence, assumptions, unknowns, and
what would validate it — and is inserted as `source: "ai_discovered"`,
`validation_status: "proposed"`, **never** `confirmed`. The founder
confirms, rejects, or ignores each one from the `/ecosystem` review
queue. `anthropic.ts` also drops any candidate referencing an id that
isn't in the catalog it was given, as a defense against hallucinated
references.

Standalone economics, capital utility, and ecosystem utility are kept as
separate concepts on purpose: `capital_utility_assessments` records
analytical dimensions (borrowing capacity, collateral quality, lending
accessibility, liquidity, cash-flow capacity, equity-generation
potential, ability to support another Atlas business, encumbrance
tolerance, strategic importance, saleability) as an assessment, never a
financing guarantee. A relationship's `potential_effect` is a hypothesis,
not a valuation input — nothing in this schema lets a hypothesized
synergy feed back into recorded valuation just because Atlas generated
it, which is what would create circular valuation logic.

### Prediction / evaluation lifecycle (not an AI score)

`predictions` gives every trackable AI hypothesis a lifecycle:
`proposed` → `under_evaluation` → `developing` → one of `validated` /
`contradicted` / `expired` / `unable_to_evaluate`. **"Hasn't happened
yet" is explicitly not failure** — `expired` and `unable_to_evaluate` are
kept out of the accuracy calculation entirely, and `/intelligence`
computes accuracy only over predictions that actually reached
`validated`/`contradicted`. Evaluating a prediction also records
`observed_outcome`, `variance`, and a `variance_reason`
(execution/market/data_quality/reasoning_error/other) — a single
inaccurate prediction is a data point, not proof the underlying
relationship was wrong, which the variance-reason breakdown is there to
help distinguish. Right now, predictions are created automatically for
every AI-discovered ecosystem relationship that states a
`potential_effect`; other AI analyses producing predictions is future
work (see **Deferred**).

### Opportunity Acquisition Layer

`opportunity_provenance` (one row per opportunity) tracks where it came
from (`discovery_channel`, including `ai_ecosystem_discovery`), its
current `information_tier` (discovery / screening / diligence),
`still_available`, and `last_observed_at` — so every opportunity can
answer where it came from, what's known, and when it was last checked.
`diligence_items` tracks specific documents (P&L, lease, tax return,
equipment list, etc.) through requested → received → reviewed. Both are
edited directly on the opportunity detail page, not a separate flag-gated
surface. Nothing in this codebase scrapes, authenticates against, or
automates interaction with any marketplace or listing site — provenance
fields are for the founder (or a future admin, manually) to record what
they already have; no NDA or legal workflow is automated here.

### First usable milestone: Business Plan Analysis

The milestone this phase was built around: open Atlas, enter a real
business plan (via Quick Capture, then filling in the opportunity's full
description), and get a structured, saved analysis back —
`analyzeBusinessPlan` (`src/lib/actions/business-plan.ts`), surfaced as
the "Business plan analysis" panel on every opportunity's detail page,
**not** gated by `capital_ecosystem_enabled`. It reads the opportunity's
description as plan text and returns facts, assumptions, unknowns,
business model, revenue/cost structure, startup/working capital
estimates, break-even assumptions, risks, missing information, diligence
questions, fit with existing Atlas businesses/assets, ecosystem
opportunities/conflicts, and benchmark comparisons — saved to
`business_plan_analyses`, append-only like every other AI analysis in
this app. It deliberately never reduces to a "good/bad business"
verdict.

### Deferred (intentionally, not oversights)

- A **sophisticated statistical benchmarking engine** — `benchmark_comparisons`
  is captured as free text per analysis today; the schema doesn't yet
  need a normalized benchmark dataset, so one wasn't built.
- **Predictions from AI analyses other than ecosystem-relationship
  discovery** (e.g. a business-plan analysis's own estimates becoming
  trackable predictions) — the lifecycle exists and is ready, just not
  wired to every producer yet.
- Any **matching engine logic** beyond the founder manually creating a
  `match_candidates` row from the `/capital` hub and describing
  compatible/conflicting dimensions themselves — an AI-assisted match
  *suggestion* (as opposed to AI-assisted relationship *discovery*,
  which is built) is future work.
- **External entity deduplication/enrichment** — `external_entities` is
  intentionally lightweight (not a CRM); nothing here merges
  near-duplicate names or enriches records automatically.
- Everything already listed as deferred under **Investor Protocol**
  above still stands unchanged — this phase didn't touch that boundary.

**Explicitly not part of this or any phase:** investor solicitation, a
public investment marketplace, any investor-facing functionality,
autonomous execution of financings or acquisitions, and anything that
would move money or bind Atlas without an explicit founder action.

## Architecture notes

- `src/lib/types.ts` — hand-written types mirroring the schema, plus the
  `Database` type consumed by `@supabase/ssr`/`supabase-js` generics. Kept
  as `type` aliases rather than `interface`s deliberately: TypeScript only
  infers an implicit index signature for object type aliases, which
  `Database` needs to satisfy supabase-js's internal
  `Record<string, unknown>` constraint on `Row`/`Insert`/`Update` — an
  `interface` here silently makes every `.insert()`/`.update()` call
  resolve to `never` with no runtime error.
- `src/lib/queries.ts` — read queries used by server components.
- `src/lib/queries-capital.ts` — read queries for the Capital & Ecosystem
  module, kept in its own file rather than growing `queries.ts`
  indefinitely. Includes `derivedBalance()`, which reduces a
  `financing_events` ledger into a current balance at read time rather
  than trusting a stored running total.
- `src/lib/actions/*.ts` — `"use server"` mutations (create/update/status
  transitions), one file per concern — `businesses.ts`, `assets.ts`,
  `financing.ts`, `capital.ts`, `ecosystem.ts`, `match.ts`,
  `predictions.ts`, `provenance.ts`, and `business-plan.ts` are this
  phase's additions.
- `src/lib/ai/` — provider interface (`types.ts`), shared prompt builder
  (`prompt.ts`), `providers/mock.ts` and `providers/anthropic.ts`, and a
  factory (`index.ts`) that reads `AI_PROVIDER` from the environment. This
  is the whole surface area a future provider swap touches. This phase
  added `analyzeBusinessPlan` and `discoverEcosystemRelationships` to the
  provider interface, plus a shared `complete()`/`parseJsonResponse<T>()`
  pair in `anthropic.ts` that both new methods (and the original
  `analyzeOpportunity`) now use.
- RLS policies grant access via `is_founder()`, not merely to anyone
  `authenticated` (see **Security model** below). `created_by` is
  recorded on every row so a future multi-user version can tighten
  policies further without a schema change. Every table added in
  `0004_capital_ecosystem_architecture.sql` follows this same policy
  shape — no new access pattern was introduced.

## Security model

V0.1 is single-user by design, and that's enforced at the database layer,
not just the UI:

- **The founder is whoever's profile was created first.** No email or
  UUID is hard-coded anywhere in source. `public.founder_exists()` and
  `public.is_founder()` (both defined in `0001_init.sql`) are the only
  source of truth: `is_founder()` is true only for the `auth.uid()` that
  matches the earliest-created row in `public.profiles`.
- **Every RLS policy across all four migrations checks `is_founder()`**,
  not `auth.role() = 'authenticated'`. Being logged in is not, by itself,
  enough to read or write anything — a second account (however it gets
  created) gets zero rows back and every write it attempts is rejected by
  Postgres, not just hidden by the app. This applies identically to the
  original V0.1 tables, every Investor Protocol table, and every Capital
  & Ecosystem table.
- **Signup is a one-time bootstrap, not an open door.** The `signUp`
  server action (`src/lib/actions/auth.ts`) checks `founder_exists()` and
  refuses to create a second account; the `/login` page only renders the
  setup form at all when no founder exists yet. This app-level check is a
  clean error message, not the actual security boundary — RLS enforces
  the same restriction independently, so even a bypass of the Next.js
  check (a second account created directly against the Supabase Auth API,
  for instance) still can't read or write Atlas data.
- **This is deliberately not RBAC.** There is exactly one privileged
  identity, defined by "first row in `profiles`," not a role/permission
  system. That's the right amount of complexity for a single-founder
  V0.1 — a real multi-user model (`created_by`-scoped policies, roles,
  invitations) is future work, not something to half-build now.
- Recommended, but outside what app code can enforce: disable "Allow new
  user signups" in the Supabase project's Auth settings once the founder
  account exists, so the underlying Auth API itself stops issuing new
  accounts, not just this app's own signup form.

## Known limitations

- `npm audit` still flags Next.js 14.2.x for a handful of advisories
  (mostly DoS/SSRF edge cases and RSC cache-poisoning scenarios) that are
  only fixed in Next 16. This app was built and tested against 14.2.35
  because jumping to Next 16 is a much larger breaking-change surface than
  a V0.1 scaffold should absorb in one pass — worth a deliberate upgrade
  later, not a silent one here. The specific middleware auth-bypass CVE
  (GHSA-f82v-jwr5-mffw), which would have mattered most given this app
  gates every route through middleware, is already fixed as of 14.2.35.
- No automated test suite yet — verified via `tsc --noEmit`, `next build`,
  and manual `next dev` smoke tests (middleware redirect behavior, page
  rendering) against a placeholder Supabase project, since this sandbox
  has no real Supabase credentials. End-to-end verification of the actual
  data flows (capture → review → promote → decide) needs a real Supabase
  project and hasn't been run.
- **`0004_capital_ecosystem_architecture.sql` was verified against a local
  Postgres 16 instance** (schema apply, RLS behavior via a hand-rolled
  `auth.uid()`/`auth.role()` stub, and derived-balance/derived-remaining
  query logic) — the same approach used to verify 0001–0003 earlier. It
  has **not** been run against a real Supabase project, and neither has
  the rest of the UI built on top of it (Business/Asset/Capital/Ecosystem/
  Intelligence pages, Business Plan Analysis, provenance/diligence) —
  this sandbox has no live Supabase credentials or Anthropic API access
  to exercise the real AI provider end-to-end. `tsc --noEmit` and
  `next build` are clean, which catches type and compile errors but not
  feature-level UI bugs; treat this module as needing a real smoke test
  before relying on it.
- **Migration strategy judgment call:** this phase was told to check
  whether `0001`–`0003` had already been applied to a real Supabase
  project and, if not, that it was fine to edit them in place before
  first deployment. This sandbox has no way to check a real project's
  migration state, so the safe assumption was made — a new forward
  migration (`0004`) rather than editing existing ones. If `0001`–`0003`
  in fact have never been deployed anywhere, folding `0004` into them (or
  leaving it as-is) is a call the founder can make with that knowledge;
  either is safe to run today since `0004` is purely additive.
