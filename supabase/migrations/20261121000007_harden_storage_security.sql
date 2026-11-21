-- Migration: Harden Supabase Storage security and policies
-- File: supabase/migrations/20261121000007_harden_storage_security.sql

-- 1. Pastikan konfigurasi bucket aman dengan batas ukuran dan format file yang valid
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('materials', 'materials', true, 20971520)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'komisariat',
  'komisariat',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pas-foto',
  'pas-foto',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'galeri',
  'galeri',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- 2. Hapus kebijakan publik lama yang terlalu longgar (misal public delete/update)
DROP POLICY IF EXISTS "Public Select Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Materials" ON storage.objects;

DROP POLICY IF EXISTS "Public Select Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Komisariat Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Komisariat Logos" ON storage.objects;

DROP POLICY IF EXISTS "Public Select Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Pas Foto" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Pas Foto" ON storage.objects;

DROP POLICY IF EXISTS "Public Select Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Galeri" ON storage.objects;

DROP POLICY IF EXISTS "Allow Public Read Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Materials Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Komisariat Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Pas Foto Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Galeri Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Update Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete Storage Objects" ON storage.objects;

-- 3. Kebijakan SELECT (Publik dapat melihat aset media di bucket publik)
CREATE POLICY "Allow Public Read Storage Objects"
ON storage.objects FOR SELECT
USING (bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri'));

-- 4. Kebijakan INSERT
-- Materials: User login ATAU calon anggota saat registrasi (folder registrations/)
CREATE POLICY "Allow Upload Materials Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND (
    auth.role() = 'authenticated'
    OR (name LIKE 'registrations/%')
  )
);

-- Komisariat: Pengurus / user yang login saja
CREATE POLICY "Allow Upload Komisariat Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'komisariat'
  AND auth.role() = 'authenticated'
);

-- Pas Foto: User login ATAU calon anggota saat melengkapi data / registrasi
CREATE POLICY "Allow Upload Pas Foto Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pas-foto'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
  )
);

-- Galeri: Pengurus / user yang login saja
CREATE POLICY "Allow Upload Galeri Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'galeri'
  AND auth.role() = 'authenticated'
);

-- 5. Kebijakan UPDATE (Hanya user terautentikasi yang boleh memodifikasi objek)
CREATE POLICY "Allow Authenticated Update Storage Objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri')
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri')
  AND auth.role() = 'authenticated'
);

-- 6. Kebijakan DELETE (Hanya user terautentikasi yang boleh menghapus objek)
CREATE POLICY "Allow Authenticated Delete Storage Objects"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri')
  AND auth.role() = 'authenticated'
);
