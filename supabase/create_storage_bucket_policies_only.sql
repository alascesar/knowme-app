-- ============================================
-- Storage Bucket Policies Only
-- ============================================
-- This script sets up RLS policies for the profile-assets bucket
-- 
-- PREREQUISITE: Create the bucket first via Supabase Dashboard:
-- 1. Go to Storage > New bucket
-- 2. Name: profile-assets
-- 3. Make it Public (uncheck "Private bucket")
-- 4. Click Create bucket
-- 
-- Then run this script to set up the policies
-- ============================================

-- Enable Row Level Security on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Authenticated users can read profile assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile assets" ON storage.objects;

-- Policy: Authenticated users can read/view all files in profile-assets bucket
CREATE POLICY "Authenticated users can read profile assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can upload files to their own folder
-- Files are stored as: {userId}/photos/{filename} or {userId}/audio/{filename}
CREATE POLICY "Authenticated users can upload profile assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own profile assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own profile assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- ============================================
-- Verification Query (optional - run to check)
-- ============================================
-- Check if bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'profile-assets';
-- 
-- Check policies were created:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%profile assets%';

