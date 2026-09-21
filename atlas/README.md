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
   or paste `0001_init.sql` then `0002_seed.sql` into the SQL editor.
   `0001_init.sql` creates the schema, RLS policies, and an
   `on_auth_user_created` trigger that mirrors new `auth.users` rows into
   `public.profiles`. `0002_seed.sql` seeds the founder's actual first
   Atlas principles and opportunities (soap, mushrooms, mushroom supplies,
   soy sauce, Blue Star, Chapel, and a business acquisition lead) — not
   dummy data.
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
