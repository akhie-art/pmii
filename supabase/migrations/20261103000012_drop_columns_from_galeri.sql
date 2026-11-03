-- ==============================================================================
-- Migration: Drop kolom title, caption, category, date dari tabel galeri
-- Timestamp: 20261103000012
-- Description: Menghapus kolom title, caption, category, dan date dari tabel galeri
-- ==============================================================================

DO $$
BEGIN
  -- 1. Hapus VIEW gallery terlebih dahulu jika masih ada dependensi
  DROP VIEW IF EXISTS public.gallery CASCADE;

  -- 2. Hapus kolom dari tabel galeri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'galeri') THEN
    ALTER TABLE public.galeri DROP COLUMN IF EXISTS title CASCADE;
    ALTER TABLE public.galeri DROP COLUMN IF EXISTS caption CASCADE;
    ALTER TABLE public.galeri DROP COLUMN IF EXISTS category CASCADE;
    ALTER TABLE public.galeri DROP COLUMN IF EXISTS date CASCADE;
  END IF;

  -- 3. Hapus kolom dari tabel gallery jika sempat dibuat sebagai tabel terpisah
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery') THEN
    ALTER TABLE public.gallery DROP COLUMN IF EXISTS title CASCADE;
    ALTER TABLE public.gallery DROP COLUMN IF EXISTS caption CASCADE;
    ALTER TABLE public.gallery DROP COLUMN IF EXISTS category CASCADE;
    ALTER TABLE public.gallery DROP COLUMN IF EXISTS date CASCADE;
  END IF;

  -- 4. Hapus indeks lama kolom yang dihapus
  DROP INDEX IF EXISTS public.idx_galeri_date;
  DROP INDEX IF EXISTS public.idx_galeri_category;
  DROP INDEX IF EXISTS public.idx_gallery_date;
  DROP INDEX IF EXISTS public.idx_gallery_category;
END $$;

