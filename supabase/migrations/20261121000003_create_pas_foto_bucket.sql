-- Migration: Create storage bucket for pas-foto
INSERT INTO storage.buckets (id, name, public)
VALUES ('pas-foto', 'pas-foto', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for public access to pas-foto bucket
DROP POLICY IF EXISTS "Public Select Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Pas Foto" ON storage.objects;

CREATE POLICY "Public Select Pas Foto" ON storage.objects FOR SELECT USING (bucket_id = 'pas-foto');
CREATE POLICY "Public Insert Pas Foto" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pas-foto');
CREATE POLICY "Public Update Pas Foto" ON storage.objects FOR UPDATE USING (bucket_id = 'pas-foto') WITH CHECK (bucket_id = 'pas-foto');
CREATE POLICY "Public Delete Pas Foto" ON storage.objects FOR DELETE USING (bucket_id = 'pas-foto');
