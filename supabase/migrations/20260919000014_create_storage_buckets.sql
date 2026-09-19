-- Migration: Create storage buckets and policies
-- Description: Konfigurasi Supabase Storage bucket 'materials' untuk berkas modul/persuratan

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing storage policies
DROP POLICY IF EXISTS "Public Select Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Materials" ON storage.objects;

-- 3. Create storage policies
CREATE POLICY "Public Select Materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Public Insert Materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Public Update Materials" ON storage.objects FOR UPDATE USING (bucket_id = 'materials') WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Public Delete Materials" ON storage.objects FOR DELETE USING (bucket_id = 'materials');
