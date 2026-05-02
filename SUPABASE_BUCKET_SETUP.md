# Supabase Storage Bucket Setup

## Issue: "Bucket not found" Error

Your application is trying to upload images to a storage bucket called `wedding-media`, but this bucket hasn't been created in your Supabase project.

## How to Fix: Create the Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Sign in with your account
3. Select your wedding photo project

### Step 2: Navigate to Storage
1. Click on **"Storage"** in the left sidebar
2. You'll see the "Buckets" section

### Step 3: Create New Bucket
1. Click the **"Create a new bucket"** button
2. **Bucket name:** `wedding-media`
3. **Public bucket:** Toggle **ON** (so guests can view photos)
4. Click **"Create bucket"**

### Step 4: Set Bucket Policies (Public Access)
After creating the bucket:
1. Click on the `wedding-media` bucket
2. Go to the **"Policies"** tab
3. Add these policies to allow public read/write:

**Policy 1 - Allow Public Upload:**
```
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'wedding-media');
```

**Policy 2 - Allow Public Read:**
```
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'wedding-media');
```

**Policy 3 - Allow Public Delete:**
```
CREATE POLICY "Allow public delete"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'wedding-media');
```

### Step 5: Create Upload Folders (Optional)
Inside the `wedding-media` bucket, create two folders:
- `uploads/` - for full-size images and videos
- `thumbnails/` - for thumbnail images

The application will automatically create these if they don't exist.

## After Setup

Once the bucket is created:
1. Refresh your application
2. Try uploading images again
3. Images should now upload successfully!

## Troubleshooting

**Still getting "Bucket not found"?**
- Make sure the bucket name is exactly: `wedding-media`
- Make sure the bucket is set to Public
- Check that policies allow public access
- Try clearing your browser cache and refreshing

**Images upload but don't appear in gallery?**
- Check that the bucket is public
- Verify the policies allow SELECT (read) access
- Make sure your browser has JavaScript enabled
