# BM Wedding Photo - Environment Setup Guide

## What's Remaining to Complete

### Phase 3: UX Improvements (Partially Integrated)
- [ ] Wire `UploadSuccess` component into `/upload` page after successful upload
- [ ] Wire `UploadProgressBar` into upload form during file upload
- [ ] Add delete button to `/guest/[guestId]` page using `guestSelfDeleteMedia` action

### Phase 4: Performance (Partially Integrated)
- [ ] Replace current media fetching with `usePaginatedMedia()` hook on home page
- [ ] Add responsive `sizes` props to all Next.js Image components
- [ ] Implement infinite scroll with `loadMore()` button
- [ ] Create Supabase Edge Function for server-side thumbnail generation (optional)

### Phase 5: Technical Debt
- [ ] Delete unused hook files:
  - `hooks/use-guest-identity.ts`
  - `hooks/use-toast.ts` (duplicate)
  - `hooks/use-mobile.ts` (duplicate)

### Phase 6: Nice-to-Have Features (Partially Integrated)
- [ ] Add `ThemeToggle` to Header component (done, needs testing)
- [ ] Call `detectDuplicate()` in upload form before upload
- [ ] Store `file_hash` when saving media
- [ ] Install & integrate EXIF stripping in compression pipeline
- [ ] Create `/admin/guests` page for RSVP tracking
- [ ] Display guest upload stats on admin dashboard

---

## How to Get All Secrets and Tokens

### 1. **Supabase Credentials** (REQUIRED)

**Where to get them:**
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Go to **Settings → API**

**Environment Variables:**
```env
# Copy from Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (long key)

# Get from Settings → API → Service Role Secret (keep private!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (different long key)
```

**Also do in Supabase:**
- Create storage bucket named `wedding-media`
- Run all migration scripts from `scripts/` folder in Supabase SQL Editor

---

### 2. **Admin Password** (REQUIRED)

```env
# You choose this password - used to login to admin dashboard
ADMIN_PASSWORD=bmwedding
```

---

### 3. **JWT Secret** (REQUIRED)

Generate a secure random string. Options:

**Option A: Use OpenSSL (Mac/Linux/WSL)**
```bash
openssl rand -hex 32
```

**Option B: Use Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Use online generator**
- Go to https://www.uuidgenerator.net/
- Generate any UUID and use it

```env
JWT_SECRET=your-32-character-random-string
```

---

### 4. **Resend (Email Notifications)** - OPTIONAL

**Where to get it:**
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Go to **API Keys**
4. Click **Create API Key**
5. Copy the key

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Your email (couple will get upload notifications)
COUPLE_EMAIL=your-email@gmail.com
```

---

### 5. **Upstash Redis (Rate Limiting)** - OPTIONAL

**Where to get it:**
1. Go to [upstash.com](https://upstash.com)
2. Sign up
3. Create a Redis database
4. Go to **Details**
5. Copy REST credentials

```env
# Only needed if using Upstash for distributed rate limiting
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
```

**Note:** App works fine without this - uses in-memory rate limiting instead.

---

### 6. **Gallery Token** - OPTIONAL

Create a secure token for shareable read-only gallery link:

```bash
node -e "console.log(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))"
```

```env
NEXT_PUBLIC_GALLERY_TOKEN=your-random-token-here
```

---

### 7. **Site URL** - REQUIRED FOR PRODUCTION

```env
# For local development
NEXT_PUBLIC_URL=http://localhost:3000

# For production (after deploying to Vercel)
NEXT_PUBLIC_URL=https://your-domain.com
```

---

## Complete .env.local Template

Copy and paste this into `.env.local` in your project root:

```env
# ========== SUPABASE (REQUIRED) ==========
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ========== ADMIN & SECURITY (REQUIRED) ==========
ADMIN_PASSWORD=bmwedding
JWT_SECRET=your-32-char-random-string

# ========== SITE URL (REQUIRED) ==========
NEXT_PUBLIC_URL=http://localhost:3000

# ========== EMAIL NOTIFICATIONS (OPTIONAL) ==========
RESEND_API_KEY=re_xxxxxxxxxxxxx
COUPLE_EMAIL=couple@example.com

# ========== RATE LIMITING (OPTIONAL) ==========
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# ========== SHAREABLE GALLERY (OPTIONAL) ==========
NEXT_PUBLIC_GALLERY_TOKEN=your-random-token
```

---

## Step-by-Step Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create new project
3. Wait for project to initialize (2-3 minutes)
4. Copy API credentials to `.env.local`

### Step 2: Create Storage Bucket
1. In Supabase, go to **Storage**
2. Click **Create Bucket**
3. Name it: `wedding-media`
4. Make it **Public**

### Step 3: Run Database Migrations
1. In Supabase, go to **SQL Editor**
2. For each file in `scripts/` folder (001-006), copy contents and run:
   - `001_create_media_table.sql`
   - `002_create_storage_bucket.sql`
   - `003_fix_media_schema.sql`
   - `004_add_guest_tag.sql`
   - `005_fix_rls_policies.sql`
   - `006_add_optional_features.sql` (optional)

### Step 4: Generate Secrets
1. Generate `JWT_SECRET` using one of the methods above
2. Generate `NEXT_PUBLIC_GALLERY_TOKEN` (optional)
3. Add `ADMIN_PASSWORD=bmwedding` (already in .env.example)

### Step 5: Optional Services
- **Email:** Sign up at [resend.com](https://resend.com) for notifications
- **Rate Limiting:** Sign up at [upstash.com](https://upstash.com) for distributed rate limiting

### Step 6: Create `.env.local`
1. Copy template above
2. Fill in all values
3. Save in project root

### Step 7: Install & Run
```bash
npm install
npm run dev
```

### Step 8: Test Admin
1. Go to http://localhost:3000
2. Click **Admin** button (top right)
3. Login with password: `bmwedding`
4. You're in the admin dashboard!

---

## Deployment to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import project from GitHub
4. In **Environment Variables**, add all values from `.env.local`
5. Click **Deploy**

**Important:** For production, set:
- `NEXT_PUBLIC_URL=https://your-domain.com` (not localhost)
- Use strong random `ADMIN_PASSWORD`
- Use strong random `JWT_SECRET`

---

## Troubleshooting

### "Admin password not working"
- Check `.env.local` has `ADMIN_PASSWORD=bmwedding`
- Restart dev server: `npm run dev`
- Check browser console for errors

### "Supabase connection error"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check Supabase project is running (Settings → General)

### "Storage bucket not found"
- Go to Supabase → Storage
- Create bucket named `wedding-media`
- Make it **Public**

### "Email notifications not working"
- Check `RESEND_API_KEY` is correct (starts with `re_`)
- Check `COUPLE_EMAIL` is valid
- Resend requires domain verification for production

---

## Security Notes

- Never commit `.env.local` to Git (add to `.gitignore`)
- Rotate `JWT_SECRET` if compromised
- Use strong `ADMIN_PASSWORD` (not `bmwedding` in production)
- `SUPABASE_SERVICE_ROLE_KEY` is private - never expose
- All tokens/keys are environment variables - no hardcoding
