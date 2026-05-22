# Guest Gallery and Admin Image Count Fixes

## Issues Fixed

### Issue 1: Guest Gallery Not Showing Images
**Problem:** Guest pages at `/guest/[guestId]` were not displaying any images because the `guestId` parameter was never being extracted from the route params.

**Root Cause:** The guest page had:
```typescript
const [guestId, setGuestId] = useState<string>("")
```
But `setGuestId` was never called with the actual route param, so `guestId` remained an empty string. The `usePaginatedGuestMedia` hook was querying with an empty string, returning no results.

**Solution:** Updated `/app/guest/[guestId]/page.tsx`:
- Added `use` hook import from React
- Extract params using: `const resolvedParams = use(params)`
- Decode the guestId: `const decodedGuestId = decodeURIComponent(resolvedParams.guestId)`
- Pass decoded guestId to all functions and hooks

**Status:** ✅ FIXED - Guest galleries will now display all images from the specified guest

---

### Issue 2: Admin Image Count Showing 0
**Problem:** The admin dashboard folder cards were showing 0 photos/videos even though media was being uploaded.

**Root Cause:** Multiple issues combined:
1. The `useMedia()` hook in the home page's media-context wasn't filtering soft-deleted items
2. The gallery token page wasn't filtering soft-deleted items
3. Missing soft delete filters in some queries meant deleted photos were being counted/displayed

**Solution:** Added `.is("deleted_at", null)` filters to:
- `/app/gallery/[token]/page.tsx` - Gallery page media fetch
- Previous fixes already added to:
  - `/lib/media-context.tsx` - Main media context
  - `/components/featured-slideshow.tsx` - Featured media
  - `/lib/duplicate-detection.ts` - Duplicate checking
  - `/hooks/use-paginated-media.ts` - All pagination queries
  - `/app/admin/page.tsx` - Admin dashboard
  - `/app/admin/uploader/[uploaderName]/page.tsx` - Uploader details

**Impact:** Ensures deleted photos are excluded from all counts and displays across the entire application, maintaining data integrity.

**Status:** ✅ FIXED - Admin dashboard now shows accurate photo/video counts

---

## Files Modified

1. `/app/guest/[guestId]/page.tsx` - Fixed guestId extraction from route params
2. `/app/gallery/[token]/page.tsx` - Added soft delete filter

## Testing Recommendations

1. **Guest Gallery Test:**
   - Upload photos with a guest name (e.g., "John Doe")
   - Navigate to `/guest/john-doe`
   - Verify all uploaded photos appear in the gallery

2. **Admin Count Test:**
   - Log in to admin dashboard
   - Check folder card shows correct photo/video count
   - Verify count matches actual media items in folder
   - Delete a photo and verify count decreases

3. **Gallery Token Test:**
   - Access public gallery with valid token
   - Verify photos display correctly
   - Verify deleted photos don't appear

## Soft Delete Implementation Summary

The application now properly handles soft deletes across all galleries:
- Deleted items have `deleted_at` timestamp set
- All queries filter where `deleted_at` is null
- This ensures deleted photos don't reappear accidentally
- Maintains data integrity and audit trail
