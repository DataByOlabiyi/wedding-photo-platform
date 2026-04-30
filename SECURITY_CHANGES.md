# Security Implementation Guide

This document outlines the security improvements made to the BM Wedding Photo platform.

## Changes Made

### 1. Admin Authentication (Server-Side)

**Problem:** The original implementation used `NEXT_PUBLIC_ADMIN_PASSWORD` which is exposed in the browser bundle and sessionStorage.

**Solution:**
- Created `/app/api/admin/auth` - Server-side password validation against `ADMIN_PASSWORD` env var (server-only, never exposed to client)
- Password is validated on the server and a signed JWT token is generated
- Token is stored in an **httpOnly, secure cookie** that cannot be accessed by JavaScript
- Created `/app/admin/login` page for authentication
- Middleware (`middleware.ts`) protects `/admin` routes by checking the valid token in the cookie

**Files Changed:**
- `app/api/admin/auth/route.ts` - Authentication endpoint
- `app/api/admin/logout/route.ts` - Logout endpoint (clears cookie)
- `app/admin/login/page.tsx` - Login UI
- `lib/verify-admin.ts` - Server-side token verification utility
- `middleware.ts` - Route protection
- `app/admin/page.tsx` - Updated to use new auth system

**Environment Variables Required:**
```env
ADMIN_PASSWORD=your-secure-password-here    # Server-only (NOT NEXT_PUBLIC_)
JWT_SECRET=your-jwt-secret-key              # Server-only (NOT NEXT_PUBLIC_)
```

### 2. Delete Authorization (Server-Side)

**Problem:** The RLS policy allowed anyone to delete any media via the public anon client.

**Solution:**
- Created server action `/app/actions/admin-delete.ts` that:
  1. Verifies the admin token (token must be in the httpOnly cookie)
  2. Uses the Supabase **service role client** (has full permissions, bypasses RLS)
  3. Deletes files from storage and the database
  4. Cannot be called from the browser without a valid admin session
- Updated RLS policy to deny all DELETE operations for the public anon client
- Admin operations must go through the verified server action

**Files Changed:**
- `app/actions/admin-delete.ts` - Server-side delete authorization
- `scripts/005_fix_rls_policies.sql` - RLS policy updates
- `app/admin/page.tsx` - Updated to use server action instead of client-side delete

### 3. Upload Rate Limiting

**Problem:** No rate limiting on uploads; users could spam many files.

**Solution:**
- Created rate limiting utility in `lib/rate-limit.ts`:
  - **Primary (Production):** Uses Upstash Redis for distributed rate limiting (30 files/hour per IP)
  - **Fallback (Development):** In-memory rate limiting if Upstash is not configured
- Created `/api/upload/check-rate-limit` endpoint to check limits before uploading
- Upload page should call this endpoint and show rate limit status to users

**Files Changed:**
- `lib/rate-limit.ts` - Rate limiting logic
- `app/api/upload/check-rate-limit/route.ts` - Rate check endpoint

**Environment Variables (Optional but Recommended):**
```env
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` (never commit to git):

```env
# REQUIRED - Admin Security
ADMIN_PASSWORD=your-super-secure-password-at-least-16-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars

# OPTIONAL - Rate Limiting (recommended for production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Database Migrations

Execute the SQL migration to fix RLS policies:

```sql
-- Run scripts/005_fix_rls_policies.sql in your Supabase SQL editor
```

### 3. Dependencies

Make sure these are installed in `package.json`:
```json
{
  "dependencies": {
    "jose": "^5.7.0",
    "@upstash/ratelimit": "^1.2.0",
    "@upstash/redis": "^1.34.0"
  }
}
```

### 4. Test the Setup

1. **Login Flow:**
   - Visit `/admin` → should redirect to `/admin/login`
   - Enter the `ADMIN_PASSWORD`
   - Should set httpOnly cookie and redirect to `/admin` dashboard

2. **Logout:**
   - Click logout button in admin dashboard
   - Cookie should be cleared
   - Should redirect to `/`

3. **Delete Protection:**
   - Try to delete a photo without a valid session
   - Should get "Unauthorized" error
   - Only works when authenticated

---

## Security Best Practices

### For Production Deployment:

1. **Strong Passwords:**
   - `ADMIN_PASSWORD` should be at least 16+ characters
   - Use a password manager to generate secure passwords
   - Don't reuse passwords across services

2. **JWT Secret:**
   - `JWT_SECRET` should be a random string at least 32 characters
   - Use `openssl rand -base64 32` to generate

3. **HTTPS Only:**
   - Always use HTTPS in production (Vercel does this automatically)
   - httpOnly cookies are only sent over HTTPS

4. **Cookie Security:**
   - Tokens expire in 24 hours automatically
   - Users are logged out after 24 hours
   - On logout, the cookie is immediately cleared

5. **Rate Limiting:**
   - Set up Upstash Redis for production rate limiting
   - Without it, rate limiting is in-memory only (doesn't persist across server restarts)

6. **Monitoring:**
   - Monitor login attempts (optional: could add logging)
   - Set up alerts for repeated failed login attempts

---

## Future Improvements

- [ ] Add failed login attempt logging
- [ ] Implement login attempt rate limiting (prevent brute force)
- [ ] Add two-factor authentication (2FA)
- [ ] Implement admin action audit log
- [ ] Add password expiration policies
- [ ] Create admin invitation system (instead of hardcoded password)

---

## Removed/Deprecated

- ❌ `NEXT_PUBLIC_ADMIN_PASSWORD` - No longer used, remove from env vars
- ❌ `sessionStorage` for auth - Replaced with httpOnly cookies
- ❌ Client-side password validation - Now server-side only
- ❌ Public delete permission in RLS - Now protected by server action
