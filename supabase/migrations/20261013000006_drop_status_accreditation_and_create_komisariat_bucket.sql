-- Migration: Hapus Kolom status & accreditation serta Buat Storage Bucket untuk Logo Komisariat
-- File: supabase/migrations/20261013000006_drop_status_accreditation_and_create_komisariat_bucket.sql

-- 1. Hapus kolom accreditation dan status dari tabel public.komisariat
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS accreditation;
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS status;

-- 2. Buat Storage Bucket 'komisariat' khusus untuk Logo Komisariat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'komisariat',
  'komisariat',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Kebijakan RLS (Storage Policies) untuk Bucket 'komisariat'
DROP POLICY IF EXISTS "Public Select Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Komisariat Logos" ON storage.objects;

-- Siapa saja dapat melihat logo komisariat secara publik
CREATE POLICY "Public Select Komisariat Logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'komisariat');

-- Izinkan upload logo komisariat
CREATE POLICY "Public Insert Komisariat Logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'komisariat');

-- Izinkan pembaruan logo komisariat
CREATE POLICY "Public Update Komisariat Logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'komisariat') 
WITH CHECK (bucket_id = 'komisariat');

-- Izinkan penghapusan logo komisariat
CREATE POLICY "Public Delete Komisariat Logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'komisariat');
