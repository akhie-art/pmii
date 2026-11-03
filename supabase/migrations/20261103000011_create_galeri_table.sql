-- ==============================================================================
-- Migration: Create galeri table (Simplified)
-- Timestamp: 20261103000011
-- Description:
-- 1. Membuat tabel 'public.galeri' murni untuk arsip file foto dokumentasi kegiatan (id, tenant_id, image_url, created_at, updated_at).
-- 2. Menghapus kolom title, caption, category, dan date dari tabel galeri/gallery.
-- 3. Menghubungkan tenant_id dengan public.tenant(id) (CASCADE).
-- 4. Membuat indeks performa pencarian berdasarkan tenant_id dan created_at.
-- 5. Mengaktifkan Row Level Security (RLS) dan kebijakan akses terbuka untuk anon/authenticated.
-- 6. Membuat storage bucket 'galeri' dan kebijakan storage publik.
-- 7. Melakukan seeder dokumentasi foto awal.
-- ==============================================================================

-- 1. Create Table public.galeri
CREATE TABLE IF NOT EXISTS public.galeri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hapus kolom title, caption, category, date jika tabel sudah ada sebelumnya
ALTER TABLE public.galeri 
    DROP COLUMN IF EXISTS title,
    DROP COLUMN IF EXISTS caption,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS date;

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_galeri_tenant_id ON public.galeri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_galeri_created_at ON public.galeri(created_at DESC);

-- Drop indeks lama kolom yang dihapus
DROP INDEX IF EXISTS idx_galeri_date;
DROP INDEX IF EXISTS idx_galeri_category;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.galeri ENABLE ROW LEVEL SECURITY;

-- 4. Permissive policies for anon, authenticated, and service_role
DROP POLICY IF EXISTS "galeri_all" ON public.galeri;
CREATE POLICY "galeri_all" ON public.galeri
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. API Role Grants
GRANT ALL ON TABLE public.galeri TO anon, authenticated, service_role;

-- 6. Storage Bucket for Galeri & Dokumentasi Kegiatan
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeri', 'galeri', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Select Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Galeri" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Galeri" ON storage.objects;

CREATE POLICY "Public Select Galeri" ON storage.objects FOR SELECT USING (bucket_id = 'galeri');
CREATE POLICY "Public Insert Galeri" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'galeri');
CREATE POLICY "Public Update Galeri" ON storage.objects FOR UPDATE USING (bucket_id = 'galeri') WITH CHECK (bucket_id = 'galeri');
CREATE POLICY "Public Delete Galeri" ON storage.objects FOR DELETE USING (bucket_id = 'galeri');

-- 7. Bersihkan VIEW atau tabel lama 'gallery' agar murni hanya 1 tabel: 'galeri'
DROP VIEW IF EXISTS public.gallery;
DROP TABLE IF EXISTS public.gallery;

-- 8. Seed Initial Galeri Data
INSERT INTO public.galeri (
    id,
    tenant_id,
    image_url,
    created_at
) VALUES 
(
    'c1111111-1111-1111-1111-111111110001'::uuid,
    '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid,
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    NOW()
),
(
    'c1111111-1111-1111-1111-111111110002'::uuid,
    '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid,
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    NOW()
),
(
    'c1111111-1111-1111-1111-111111110003'::uuid,
    '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid,
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;
