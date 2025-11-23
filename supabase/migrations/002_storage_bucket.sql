-- ============================================
-- Storage Bucket Policies for profile-assets
-- ============================================
-- NOTE: The bucket must be created via Supabase Dashboard first:
-- Storage > New bucket > Name: profile-assets > Public > Create
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all files in profile-assets bucket
CREATE POLICY "Authenticated users can read profile assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can upload files to their own folder
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

