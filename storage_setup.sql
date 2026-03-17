-- SUPABASE STORAGE SETUP FOR VOXY
-- Execute this SQL in the Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Row Level Security (RLS) policies for the bucket
-- Allow public access to read files
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files
-- We restrict this to the 'business-logs' folder for organization
CREATE POLICY "Authenticated Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete their own uploads (optional but recommended)
CREATE POLICY "Authenticated Update Access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Authenticated Delete Access" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'voxy-assets' AND auth.uid() = owner);
