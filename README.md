# BM Wedding Photo - Complete Implementation

A full-stack wedding photo sharing platform built with Next.js 16, React 19, Supabase, and TypeScript. Guests can upload photos, couples get admin dashboard, and everything is secure with proper authentication and rate limiting.

## Features

### Core Features
- **Guest Photo Upload** - Simple 2-step flow: enter name/tag → upload files
- **Photo Gallery** - Browse photos organized by guest with beautiful lightbox viewer
- **Admin Dashboard** - Manage all photos, delete, download, generate QR codes
- **PWA Support** - Install as app on mobile, works offline
- **Real-time Updates** - Photos appear instantly via Supabase Realtime

### Security (Implemented)
- ✅ Server-side admin authentication with httpOnly JWT cookies
- ✅ RLS policies prevent public deletion
- ✅ IP-based upload rate limiting (30 files/hour)
- ✅ Guest self-delete window (30 minutes after upload)
- ✅ EXIF data stripping for privacy

### Advanced Features (Implemented)
- ✅ QR code generator for easy guest access
- ✅ Download all photos as ZIP file
- ✅ Shareable read-only gallery link
- ✅ Featured photos rotating slideshow on home
- ✅ Email notifications when guests upload
- ✅ Upload progress tracking
- ✅ Success screen with redirect to own photos
- ✅ Improved video playback with autoplay (muted)
- ✅ Pagination for better performance
- ✅ Duplicate photo detection via SHA-256 hashing
- ✅ Dark mode toggle

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Resend account (for email notifications)

### Environment Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Admin & Security
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret-key

   # Features
   NEXT_PUBLIC_GALLERY_TOKEN=your-unique-token
   RESEND_API_KEY=your-resend-api-key
   COUPLE_EMAIL=couple@example.com
   NEXT_PUBLIC_URL=http://localhost:3000

   # Rate Limiting (optional)
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   ```

3. **Run database migrations** in Supabase SQL editor:
   - `scripts/001_create_media_table.sql`
   - `scripts/002_create_storage_bucket.sql`
   - `scripts/003_fix_media_schema.sql`
   - `scripts/004_add_guest_tag.sql`
   - `scripts/005_fix_rls_policies.sql`

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:** http://localhost:3000

## Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Home gallery with guest albums | Public |
| `/upload` | Upload photos (2-step form) | Public |
| `/guest/[guestId]` | View photos from specific guest | Public |
| `/gallery/[token]` | Shareable read-only gallery | Token |
| `/admin` | Dashboard to manage all photos | Admin |
| `/admin/login` | Admin login page | Public |
| `/admin/qr` | Generate/download QR code | Admin |

## Usage

### For Guests
1. Visit the site or scan QR code
2. Click "Add Photos" or "+" button
3. Enter your name and select relationship tag
4. Upload up to 10 files (50MB each)
5. Photos are compressed and appear in gallery instantly
6. Can delete own photos within 30 minutes

### For Couples (Admin)
1. Go to `/admin`
2. Login with your admin password
3. View all photos, stats, and guest uploads
4. Delete unwanted photos
5. Generate QR code for printing/sharing
6. Download all photos as ZIP file
7. Get email notifications when guests upload

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase PostgreSQL, Object Storage, Realtime
- **Authentication**: Server-side JWT with httpOnly cookies
- **Email**: Resend API
- **Rate Limiting**: Upstash Redis (optional)
- **Hosting**: Vercel

## Security

### Authentication
- Admin password validated server-side (never exposed to client)
- JWT tokens signed with secret key
- Tokens stored in httpOnly cookies (inaccessible to JavaScript)
- Tokens expire after 24 hours

### Authorization
- RLS policies prevent public deletion
- Guest self-delete limited to 30-minute window
- Admin operations use service role (bypass RLS)
- Rate limiting prevents abuse (30 files/hour per IP)

## Deployment

### Deploy to Vercel
```bash
vercel deploy
```

### Environment Variables
Set all `.env.local` variables in Vercel project settings.

## Documentation

See `IMPLEMENTATION_SUMMARY.md` for detailed information about:
- All implemented features
- Database schema
- API routes and server actions
- Security implementation
- Performance optimizations
- Testing checklist

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed info
2. Review database schema in Supabase
3. Check browser console for errors
4. Review Vercel logs for server errors

---

**Built with Next.js 16 & Supabase**
**Last Updated:** April 30, 2026
