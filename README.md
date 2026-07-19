# Wedding Photo Platform

A multi-tenant SaaS for wedding and event photo sharing. Couples create an account, set up an event, and share a link or QR code. Guests upload photos without an account. Couples manage and download everything from a private dashboard.

## Architecture

```
Platform Admin (superadmin)
  └── Organizations (one per couple/business)
        └── Events (one per wedding, unlimited on Pro)
              ├── Media (photos uploaded by guests)
              └── Guests (RSVP list, optional)
```

**Three roles:**

| Role | Auth | What they can do |
|------|------|-----------------|
| Admin | Supabase Auth + `platform_admins` table (admin / superadmin tiers) | Platform-wide stats, override org plans |
| Couple | Supabase Auth (email + password) | Create events, view/delete photos, download ZIP, manage settings |
| Guest | None (no account) | Upload photos to an event via a shared link |

**Tenant isolation:** Every data query is scoped to `organization_id` via the `org_members` table. Row-Level Security policies on all tables enforce this at the database layer — not just in application code.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui |
| Database | Supabase PostgreSQL (with RLS) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Storage | Supabase Storage (`wedding-media` bucket) |
| Rate limiting | Upstash Redis |
| Billing | Stripe (Starter / Pro plans) |
| Email | Resend |
| Error tracking | Sentry |
| Hosting | Vercel |
| Testing | Vitest |

## Local Development

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Upstash](https://upstash.com) Redis database (required for rate limiting in production; dev uses an in-memory fallback)

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required for local dev:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_URL=http://localhost:3000
```

Optional (features degrade gracefully without them):

```env
UPSTASH_REDIS_REST_URL=...      # rate limiting (in-memory fallback in dev)
UPSTASH_REDIS_REST_TOKEN=...
STRIPE_SECRET_KEY=...           # billing
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
RESEND_API_KEY=...              # email notifications
NEXT_PUBLIC_SENTRY_DSN=...      # error tracking
```

> **Never commit `.env.local`.** It is in `.gitignore`. Use `.env.example` as the template — it contains no real credentials.

### 4. Run database migrations

Run each SQL file in order in the Supabase SQL editor (Dashboard → SQL editor):

```
scripts/001_create_media_table.sql
scripts/002_create_storage_bucket.sql
scripts/003_fix_media_schema.sql
scripts/004_add_guest_tag.sql
scripts/005_fix_rls_policies.sql
scripts/006_add_optional_features.sql
scripts/007_add_events_table.sql
scripts/007_soft_delete_and_rls.sql
scripts/008_add_audit_logs.sql
scripts/009_add_guest_token.sql
scripts/010_add_organizations.sql
scripts/011_alter_events_for_saas.sql
scripts/012_add_org_members.sql
scripts/013_alter_media_for_saas.sql
scripts/014_saas_rls_policies.sql
scripts/015_fix_media_on_delete_and_gallery_rls.sql
```

> The scripts directory does not yet have a migration runner — they must be applied in the order listed above. Skip files already applied to an existing database.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

### Public (no auth)

| Route | Purpose |
|-------|---------|
| `/` | Home / landing |
| `/e/[slug]` | Guest upload page (shared link from Couple) |
| `/e/[slug]/pin` | PIN entry (if event is PIN-protected) |
| `/gallery/[slug]?token=<token>` | View-only shareable gallery |
| `/guest/[guestId]` | Photos from one guest |
| `/auth/login` | Couple sign in |
| `/auth/signup` | Couple account creation |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Set new password (from email link) |
| `/legal/terms` | Terms of Service |
| `/legal/privacy` | Privacy Policy |
| `/support` | Support & FAQ |

### Couple (authenticated)

| Route | Purpose |
|-------|---------|
| `/onboarding` | First-time org + event setup |
| `/dashboard` | Event list and stats |
| `/dashboard/events/new` | Create a new event |
| `/dashboard/events/[eventId]` | Gallery view + delete + ZIP download |
| `/dashboard/events/[eventId]/settings` | PIN, status, gallery visibility, share links |
| `/dashboard/billing` | Plan selection and upgrade |
| `/dashboard/settings` | Account settings and deletion |

### Admin (superadmin only)

| Route | Purpose |
|-------|---------|
| `/superadmin` | Platform stats, org plan overrides |

## Plans

| Feature | Starter (free) | Pro |
|---------|---------------|-----|
| Events | 1 | Unlimited |
| Photos per event | Unlimited | Unlimited |
| ZIP download | ✓ | ✓ |
| PIN protection | ✓ | ✓ |
| Guest gallery toggle | ✓ | ✓ |
| Storage quota | — | — |

> Storage quotas are not yet enforced. This is a known gap to address before heavy scale.

## Security

### Authentication
- Couples authenticate via Supabase Auth (email + password, email confirmation required)
- Session cookies are `httpOnly`, `secure` in production, managed by `@supabase/ssr`
- Platform staff roles live in the `platform_admins` table (service-role access only); superadmin manages grants from `/superadmin`
- Platform staff accounts should enable MFA in Supabase Auth before operational use
- Guests have no accounts; they are identified by a `guest_token` (UUID) stored in `localStorage`

### Tenant isolation
- All queries scope data to `membership.organization_id` — verified server-side before any DB access
- Supabase RLS policies enforce isolation at the database layer as a second line of defence
- The `get_my_org_id()` SQL function (SECURITY DEFINER) is the RLS policy anchor

### File uploads
- Magic-byte validation on upload — extension alone is not trusted
- EXIF data stripped via canvas redraw before storage (removes GPS, camera metadata)
- 50 MB pre-compression limit, ~4 MB post-compression target
- 50 files per upload session
- 60 uploads per hour per IP (Upstash sliding window)

### Rate limiting
- Upload: 60 files / hour / IP
- PIN verification: 10 attempts / 15 min / IP
- Admin auth: 5 attempts / 15 min / IP (wired in `lib/rate-limit.ts`, apply to login if needed)

### PIN protection
- PINs are SHA-256 hashed with a salt before storage
- Constant-time comparison to prevent timing attacks (`lib/pin-utils.ts`)
- Verified PIN sets an `httpOnly` cookie scoped to the event

## Testing

```bash
npm test               # unit tests (Vitest)
npm run test:watch     # unit tests in watch mode
npx playwright test    # E2E tests (requires a running server)
```

**Unit tests** (`__tests__/`) cover cross-tenant isolation invariants, guest upload scoping, PIN brute-force resistance, and `guests_can_view_gallery` RLS enforcement.

**E2E tests** (`tests/`) cover three happy paths: guest upload flow, couple gallery view + ZIP download, and event creation. They require a running dev server and real Supabase credentials. Set these env vars before running:

```env
TEST_BASE_URL=http://localhost:3000   # default
TEST_EVENT_SLUG=your-event-slug       # an open event
TEST_COUPLE_EMAIL=you@example.com
TEST_COUPLE_PASSWORD=yourpassword
```

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

1. `npm ci` — install dependencies
2. `npm run lint` — ESLint
3. `npm run build` — Next.js production build

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

**Deployment** is manual via the Vercel CLI:

```bash
vercel --prod
```

A staging environment (separate Supabase project + Vercel environment) is on the pre-launch checklist but not yet configured.

## Error Tracking

Sentry is configured via `sentry.*.config.ts` and `instrumentation.ts`. It is disabled unless `NEXT_PUBLIC_SENTRY_DSN` is set — the build and app function normally without it.

To enable:
1. Create a project in [sentry.io](https://sentry.io)
2. Set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in Vercel

## Pre-Launch Checklist

These items require action outside the codebase:

- [ ] **Rotate Supabase service role key** (was previously exposed — do this first)
- [ ] **Rotate Stripe API keys** (same reason)
- [ ] Run `scripts/015_fix_media_on_delete_and_gallery_rls.sql` on production DB
- [ ] Enable Supabase PITR (point-in-time recovery) in project settings
- [ ] Configure Upstash Redis (`UPSTASH_REDIS_REST_URL` + token) in Vercel — required for production rate limiting
- [ ] Configure Sentry DSN in Vercel env vars
- [ ] Set up staging environment (separate Supabase project + Vercel preview env)
- [ ] Configure Supabase connection pooler URL for serverless scale
- [ ] Replace `[Company Name]` and `[contact@example.com]` placeholders in `/legal/terms` and `/legal/privacy`
- [ ] Test database restore from a Supabase backup (DR drill)
- [ ] Verify Stripe webhook endpoint is registered in Stripe dashboard pointing to `/api/stripe/webhook`

## Database Schema (summary)

```
organizations       — one per Couple account (name, slug, plan)
  org_members       — links auth.users → organization (role: owner | editor)
  events            — one per wedding (slug, gallery_token, pin_hash, status, closes_at)
    media           — uploaded photos (file_url, thumbnail_url, guest_token, moderation_status)
    featured_media  — pinned photos
    guests          — RSVP list (optional)
audit_logs          — action log for media deletes and moderation
```

All tables have RLS enabled. See `scripts/014_saas_rls_policies.sql` and `scripts/015_fix_media_on_delete_and_gallery_rls.sql` for the full policy definitions.

## Known Gaps (post-launch backlog)

- No storage quota enforcement per org/event
- No automated migration runner (migrations are manual SQL files)
- No admin tooling to look up a specific tenant's event by slug (superadmin event search added)

---

**Stack:** Next.js 16 · Supabase · Stripe · Vercel  
**Last updated:** June 2026
