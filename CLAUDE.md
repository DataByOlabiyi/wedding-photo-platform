# CLAUDE.md — Wedding Photo Platform

## Branch model

| Branch | Purpose | Status |
|--------|---------|--------|
| `saas` | Active development — multi-tenant SaaS rebuild | **Work here** |
| `main` | Frozen production snapshot — single-tenant original | **Do not develop here** |

Hotfixes go to `saas` first, then cherry-pick to `main`. The workflow below does not apply to `main`.
`saas` is the staging environment until it is promoted to replace `main`.

---

## Real stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.9 |
| Runtime | React | 19.2.4 |
| Language | TypeScript (strict mode) | 5.7.3 |
| Database + Auth | Supabase (SSR cookie auth) | supabase-js 2.108.2, ssr 0.9.0 |
| Payments | Stripe | 22.2.1 (API: 2026-05-27.dahlia) |
| Rate limiting | Upstash Redis | ratelimit 1.2.0, redis 1.34.0 |
| Email | Resend | 3.0.0 |
| Error tracking | Sentry | 10.58.0 |
| Styling | Tailwind CSS + Radix UI + shadcn/ui | Tailwind 4.2.0 |
| Unit tests | Vitest | 4.1.9 |
| E2E tests | Playwright (Chromium only) | 1.61.0 |
| CI | GitHub Actions — lint + build only | Node 20 |

---

## Hard rules — preserve these, do not introduce alternatives

### Naming
- Files: `kebab-case.tsx` — `event-upload-form.tsx`, `admin-delete.ts`
- React components: `PascalCase` — `EventUploadForm`, `MediaGrid`
- Functions: `camelCase` — `requireOrg()`, `hashPin()`, `deleteAccount()`
- Constants: `UPPER_CASE` — `PLANS`, `PLAN_LIMITS`, `GUEST_TAGS`
- DB columns and SQL functions: `snake_case` — `organization_id`, `get_my_org_id()`
- Route folders: `kebab-case` — `/e/[slug]/`, `/dashboard/events/[eventId]/`
- SQL migrations: `NNN_description.sql`, sequentially numbered starting from where the last one left off

### Auth and data access — the most important rules in this file
Every server action that touches org-owned data **must** start with:
```ts
const { membership } = await requireOrg()
const orgId = membership.organization_id
```
Then scope every query: `.eq('organization_id', orgId)`

`createAdminClient()` (bypasses RLS) is only called **after** org membership is confirmed in the action. Never call it from a route handler without an org scope check first.

Never add a new server action or API route that writes to or reads from `events`, `media`, `featured_media`, or `guests` without this pattern. RLS is the safety net, not the primary guard.

### TypeScript
- Strict mode is on — no `any`, no `as unknown as X` without a comment explaining why
- All new types go in `lib/types.ts` unless they are tightly coupled to a single file
- Zod schemas for all external inputs — see `lib/validation-schemas.ts` for existing patterns

### Components
- UI primitives live in `components/ui/` (shadcn/Radix wrappers) — do not put business logic there
- Feature components live in `components/` — do not import one feature component from another without good reason
- Server components are the default; add `"use client"` only when interactivity requires it

### State and data
- No direct Supabase client calls from browser components to protected data — go through server actions
- Server actions in `app/actions/` for mutations; API routes in `app/api/` for requests that need HTTP semantics (webhooks, rate-limit checks, file validation)
- No new ORM or data-fetching library — the project uses Supabase client directly

### Migrations
- SQL migrations are numbered `NNN_description.sql` in `scripts/`
- **The 007 prefix is duplicated** (`007_add_events_table.sql` and `007_soft_delete_and_rls.sql`) — the next migration must start at `016_`
- Never rename or renumber existing migrations — they represent applied history
- Every new migration must be safe to run on the existing schema (idempotent where possible)

### Testing
- Unit tests in `__tests__/` — Vitest, node environment
- E2E tests in `tests/` — Playwright, require a running server + `TEST_*` env vars
- CI runs lint + build only — E2E is manual or pre-deploy
- The cross-tenant isolation test (`__tests__/cross-tenant-isolation.test.ts`) must pass before any change that touches RLS, org scoping, or auth guards

### Comments
- Write no comments by default
- Only add a comment when the WHY is non-obvious: a hidden constraint, a workaround, a subtle invariant
- No multi-line comment blocks, no docstrings that describe what the code already says

---

## Risk areas — tread carefully

| Area | Risk | Notes |
|------|------|-------|
| Stripe webhook (`app/api/stripe/webhook/route.ts`) | Plan changes don't land if webhook isn't registered in Stripe dashboard | No test coverage in CI |
| Plan limit enforcement (`app/actions/event-management.ts`) | Race condition — count-then-insert is not atomic; concurrent requests can bypass Starter's 1-event cap | Needs a DB-level unique constraint or advisory lock |
| PIN rate limiting (`lib/rate-limit.ts`) | Falls back to in-memory if Upstash is down — per-instance counter, bypassable on multi-instance deployments | Upload + admin limits are fail-closed in prod; PIN is not |
| Storage quotas | Not enforced at all — an org can upload unlimited data | Noted in README as a known gap |
| `proxy.ts` auth middleware | Runs in Node.js runtime, not at the edge — session refresh on every request is slower than true Next.js middleware | Low urgency but worth revisiting |
| Audit logs | Deletion action succeeds even if audit log insertion fails (fire-and-forget `.then(() => {}, () => {})`) | Compliance gap |
| Migration 007 duplicate | Two files share the `007_` prefix — running both against a fresh DB could conflict | Next migration starts at 016 |
| Supabase service role key | README notes it was previously exposed and needs rotation | Verify this was done before scaling |
| Storage bucket RLS | No bucket-level RLS in Supabase Storage — all access control is application-level | Defense is entirely in server actions |

---

## Definition of done

A change is done when all of the following are true:
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`) — especially `cross-tenant-isolation.test.ts` for any auth/RLS/org change
- [ ] The cross-tenant invariant is preserved: no query can return data from a different org than the authenticated user's org
- [ ] No new `any` types introduced without a justified comment
- [ ] No new server action or API route bypasses the `requireOrg()` + org scoping pattern
- [ ] If a new SQL migration was added: it is numbered `016_` or higher, it is safe to run on the existing schema, and it has been manually verified against the Supabase dashboard
- [ ] If Stripe is touched: webhook events for the affected flow have been manually verified in Stripe's test dashboard
- [ ] The change has been reviewed by the Reviewer agent against this file

---

## Default workflow

**For any non-trivial change, run `/feature` before writing code.** You do not need to invoke this manually — it is the default. The only exceptions are:
- Single-line typo or label fixes
- When you explicitly say "skip the workflow"

"Non-trivial" means: anything that touches auth, payments, RLS, migrations, new routes, new components, or changes existing API contracts.

The workflow is: **PM → Planner → Designer → Engineer → Tester → Reviewer**
Each agent stays in its lane. See `.claude/commands/feature.md` for the full orchestration.

---

## What not to do

- Do not create new planning or audit `.md` files in the project root — there are already 15+ historical ones. Use the conversation instead.
- Do not add error handling for scenarios that cannot happen — trust `requireOrg()` and the type system
- Do not add backwards-compatibility shims for removed code — delete it cleanly
- Do not introduce new styling libraries, state managers, or data-fetching abstractions
- Do not develop on `main`
