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
   `npm run dev`, then open `/login` and use "First time? Create the
   founder account" to sign up. Supabase's default project settings
   require email confirmation — either confirm via the email Supabase
   sends, or disable email confirmation in Supabase Auth settings for
   local development.

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
(`businesses` table, `created_by` on every row, RLS scoped to
"authenticated" rather than hard-coded to one user) leaves room for these
without a rewrite, but none of it is implemented now.

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
- RLS policies currently grant full access to any `authenticated` user
  (single-founder V0.1). `created_by` is recorded on every row so a future
  multi-user version can tighten policies without a schema change.

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
