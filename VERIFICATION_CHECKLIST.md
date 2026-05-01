# Verification Checklist - BM Wedding Photo Platform

## Pre-Launch Verification

### 1. Environment Setup ✅
- [ ] `.env.local` file exists in project root
- [ ] Contains: `ADMIN_PASSWORD=bmwedding`
- [ ] Contains: `JWT_SECRET=` (with actual secret, not placeholder)
- [ ] Contains: `NEXT_PUBLIC_SUPABASE_URL=` (with actual URL)
- [ ] Contains: `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (with actual key)
- [ ] Contains: `SUPABASE_SERVICE_ROLE_KEY=` (with actual key)

### 2. Build Status ✅
- [ ] Run `npm run build` and confirm "Build successful"
- [ ] No errors about missing environment variables
- [ ] All routes are listed as available

### 3. Dev Server ✅
- [ ] Run `npm run dev`
- [ ] Server starts without errors
- [ ] Can access http://localhost:3000

### 4. Home Page ✅
- [ ] Can access http://localhost:3000
- [ ] Sees "BM Wedding" header with logo
- [ ] Admin button visible in top-right
- [ ] Dark mode toggle visible
- [ ] "Add Photos" button visible

### 5. Admin Login ✅
- [ ] Click "Admin" button in header
- [ ] Redirected to `/admin/login`
- [ ] Login page shows password input
- [ ] Enter password: `bmwedding`
- [ ] Click "Login" button
- [ ] Redirected to `/admin` dashboard
- [ ] Can see gallery grid with tabs

### 6. Admin Dashboard ✅
- [ ] Can access http://localhost:3000/admin
- [ ] "Gallery" tab shows photos (or "No photos yet" message)
- [ ] "Guests & RSVPs" tab shows guest table
- [ ] "QR Code" button in header
- [ ] "Download All" button works
- [ ] Can delete photos with confirmation
- [ ] Logout button works and redirects to home

### 7. Photo Upload ✅
- [ ] Click "Add Photos" button
- [ ] Enter guest name and select relationship tag
- [ ] Click "Continue"
- [ ] Drag and drop or select files
- [ ] Files are compressed and uploaded
- [ ] See upload progress
- [ ] After completion, see success screen
- [ ] Option to view your photos

### 8. Guest Album ✅
- [ ] From home page, click on a guest folder
- [ ] See all photos from that guest
- [ ] Click photo to open lightbox
- [ ] Can navigate with arrow keys or buttons
- [ ] Can download individual photos
- [ ] Can delete photo if within 30-minute window
- [ ] Close lightbox with ESC or X button

### 9. Dark Mode ✅
- [ ] Click dark mode toggle (sun/moon icon)
- [ ] Page switches to dark mode
- [ ] All colors are properly themed
- [ ] Toggle back to light mode
- [ ] Setting persists after page reload

### 10. API Routes ✅
- [ ] Auth route: `/api/admin/auth` - POST password and get token
- [ ] Logout route: `/api/admin/logout` - Clear session
- [ ] Rate limit check: `/api/upload/check-rate-limit` - Returns rate limit status
- [ ] Check browser Network tab for requests

## Optional Features

### 11. QR Code Generator ✅
- [ ] Go to http://localhost:3000/admin/qr (when logged in)
- [ ] See QR code pointing to home page
- [ ] Can download QR code as image

### 12. Shareable Gallery ✅
- [ ] If NEXT_PUBLIC_GALLERY_TOKEN is set
- [ ] Access http://localhost:3000/gallery/[token]
- [ ] View read-only gallery with all photos

### 13. Email Notifications
- [ ] (Optional) If RESEND_API_KEY is configured
- [ ] Couple email should receive notifications on uploads
- [ ] Check spam folder if not received

## Common Issues & Solutions

### Issue: "Invalid password" error
**Solution:**
1. Verify `.env.local` has `ADMIN_PASSWORD=bmwedding` (exact spelling)
2. Restart dev server after editing `.env.local`
3. Clear browser cookies
4. Check if you're typing password correctly (case-sensitive)

### Issue: Build fails with Upstash error
**Solution:**
1. If you haven't configured Upstash, that's OK
2. The fix should handle placeholder values
3. Rate limiting will use in-memory fallback
4. Or properly configure Upstash in `.env.local`

### Issue: Middleware error or redirect loops
**Solution:**
1. Verify JWT_SECRET is set in `.env.local`
2. Clear browser cookies
3. Restart dev server
4. Try in incognito window

### Issue: Photos not uploading
**Solution:**
1. Check Supabase credentials in `.env.local`
2. Verify Supabase database exists with proper schema
3. Check browser console for specific error messages
4. Verify file size is under 50MB per file
5. Maximum 10 files at once

## Testing Workflow

1. **First Time Setup**
   ```bash
   npm install
   npm run build  # Verify build works
   npm run dev    # Start dev server
   ```

2. **Test Authentication**
   - Go to http://localhost:3000/admin/login
   - Try wrong password (should fail)
   - Try correct password: `bmwedding` (should work)

3. **Test Upload Flow**
   - Click "Add Photos"
   - Fill in name and tag
   - Upload test images
   - Verify they appear in gallery

4. **Test Admin Features**
   - View all photos in admin dashboard
   - Delete a photo
   - View guest RSVP list
   - Download QR code

5. **Test Guest View**
   - Click on guest folder from home
   - View guest photos
   - Try to delete within 30 minutes
   - Download individual photos

## Performance Check

- [ ] Home page loads in < 2 seconds
- [ ] Admin dashboard loads in < 3 seconds
- [ ] Photo uploads complete in reasonable time
- [ ] Lightbox opens smoothly without lag
- [ ] Navigation between pages is fast

## Security Check

- [ ] Admin password is not exposed in client-side code
- [ ] JWT token is httpOnly (not accessible to JavaScript)
- [ ] Rate limiting prevents abuse
- [ ] EXIF data is stripped from images
- [ ] Database RLS policies are enforced

## Deployment Checklist

When ready to deploy to Vercel:

- [ ] All environment variables set in Vercel project settings
- [ ] Database migrations executed (scripts/001-006)
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev mode
- [ ] All features tested locally
- [ ] Admin login works with production password
- [ ] Ready for launch!

---

**If all checkboxes pass, your BM Wedding Photo Platform is ready to use!**
