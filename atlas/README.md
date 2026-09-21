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
   default.
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
website, property analysis, full accounting, banking/payroll
integrations, CRM, complex portfolio management, automated investment
decisions, acquisition transaction management, mobile app. The schema
(`businesses` table, `created_by` on every row) leaves room for these
without a rewrite, but none of it is implemented now — including
multi-user: V0.1 is hard-scoped to exactly one founder account, see
**Security model** below.

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

## Future capability: Atlas Capital & Opportunity Matching (not built)

This section documents a **future architectural direction only**. Nothing
in this section is implemented, scheduled, or scaffolded — there is no
`capital_needs` table, no matching engine, no new UI, and nothing here
changes any behavior described elsewhere in this README. It exists so the
Investor Protocol's data model isn't accidentally designed into a corner
that would need a rewrite to support this later.

**The concept.** Atlas eventually has two pipelines that today are
tracked separately and never compared:

- **Opportunity Pipeline** — "What should Atlas build, acquire, or own?"
  (opportunities, projects, businesses, and assets already in this
  schema, plus future opportunity types: acquisitions, real estate,
  equipment, IP, strategic partnerships, other durable assets.)
- **Capital Pipeline** — "Who or what can provide the resources required
  to make it happen?" (the existing `investor_profiles` +
  `investment_mandates` from the Investor Protocol.)

Eventually, Atlas should be able to identify potential matches between
the two — not execute them.

**Capital Need (future concept, no table exists yet).** An opportunity
may eventually produce one or more Capital Needs describing what it
requires to proceed: the related opportunity/project/business/asset, an
amount, capital type, timing, purpose, required contribution type,
desired investor/involvement characteristics, preferred or permitted
structures, existing committed capital, remaining requirement,
risk/constraint information, status, notes, and related decisions. A
Capital Need must **not** automatically imply outside investment is
needed — it may just as well be satisfied by Atlas's own capital, debt,
seller financing, internal cash flow, equipment, labor, customers/
distribution, a strategic partnership, or some other resource.

**Investor Profile + Investment Mandate remain the foundation, unchanged
and uncollapsed.** The matching system, when it exists, would read from
the same separation already built: Investor Profile describes the
participant; Investment Mandate describes what they're willing to do in
a specific context, and one investor can have many mandates. This
addendum does not merge them into one object, and nothing here proposes
to.

**Matching Engine (future, not built).** Eventually Atlas should be able
to compare a Capital Need against an Investment Mandate across dimensions
like capital amount, capital type, timing, industry, geography, target
type, involvement, economic configuration, control configuration,
information requirements, liquidity preferences, Atlas/network
relationship, and risk/constraint compatibility — and produce a **Match
Candidate**: which dimensions look compatible, which conflict, what's
unknown, and what questions need a human to confirm. Not an automatic
investment decision.

**Governance rule that any future matching engine must preserve.** A
match is not an approval. The pipeline stays: Discovery → Analysis →
Potential Match → Founder Review → Approved Structure → Professional
Review (where required) → Documentation → Execution. AI agents may
identify and analyze potential matches. They must never: approve
investments, promise returns, negotiate legal investment terms
autonomously, determine securities-law status, determine investor
qualification, execute investments, move money, or create legal
documents outside an approved human/professional workflow. This is the
same founder-control boundary the rest of Atlas already enforces (see
**Founder control** above and the Investor Protocol's guardrails) —
matching does not get an exception to it.

**Ecosystem matching (future).** The same system should eventually be
able to notice relationships *between* Atlas's own holdings — e.g. an
Atlas-owned business, an acquisition candidate, an existing customer
base, available capital, and a prospective operator might collectively
represent an opportunity that isn't visible evaluating any one of them
alone. Atlas should eventually evaluate opportunities in the context of
the whole ecosystem it already holds, not only individually.

**Private network, not a public marketplace.** This is not, now or as
envisioned, a public investment marketplace or a solicitation surface.
It's a private system that knows what Atlas owns, what it's building,
what it wants to acquire, what opportunities require, what capital and
resources are available, what participants have expressed interest in,
what structures are permitted, and what's happened historically — and
uses that to find intelligent matches within the Atlas ecosystem itself,
for the founder to review. The more businesses, assets, investors,
operators, transactions, opportunities, and historical decisions Atlas
accumulates, the more useful this eventually becomes — which is the
actual argument for capturing all of it carefully now, per the rest of
this README, even though none of the matching itself exists yet.

**Explicitly not part of this or any current phase:** the matching
engine itself, investor solicitation, a public investor marketplace,
any investor-facing functionality, any change to the current Investor
Protocol guardrails (see above — they stand as written), and any
autonomous investment authority for the AI. This section is a note for
future architecture, not a roadmap commitment or a scope expansion of
V0.1.

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
- `src/lib/actions/*.ts` — `"use server"` mutations (create/update/status
  transitions), one file per concern.
- `src/lib/ai/` — provider interface (`types.ts`), shared prompt builder
  (`prompt.ts`), `providers/mock.ts` and `providers/anthropic.ts`, and a
  factory (`index.ts`) that reads `AI_PROVIDER` from the environment. This
  is the whole surface area a future provider swap touches.
- RLS policies grant access via `is_founder()`, not merely to anyone
  `authenticated` (see **Security model** below). `created_by` is
  recorded on every row so a future multi-user version can tighten
  policies further without a schema change.

## Security model

V0.1 is single-user by design, and that's enforced at the database layer,
not just the UI:

- **The founder is whoever's profile was created first.** No email or
  UUID is hard-coded anywhere in source. `public.founder_exists()` and
  `public.is_founder()` (both defined in `0001_init.sql`) are the only
  source of truth: `is_founder()` is true only for the `auth.uid()` that
  matches the earliest-created row in `public.profiles`.
- **Every RLS policy across both migrations checks `is_founder()`**, not
  `auth.role() = 'authenticated'`. Being logged in is not, by itself,
  enough to read or write anything — a second account (however it gets
  created) gets zero rows back and every write it attempts is rejected by
  Postgres, not just hidden by the app. This applies identically to the
  original V0.1 tables and to every Investor Protocol table.
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
