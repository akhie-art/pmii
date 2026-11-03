-- Migration: Drop kolom provinsi, kabupaten, kecamatan, organisasiSD dari tabel anggota dan kader
-- Description: Menghapus kolom wilayah administratif terpisah dan organisasi SD sesuai standarisasi data anggota PMII

DO $$
BEGIN
  -- 1. Hapus dari tabel anggota jika ada
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS provinsi CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS kabupaten CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS kecamatan CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS "organisasiSD" CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS organisasisd CASCADE;
  END IF;

  -- 2. Hapus dari tabel kader jika ada
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kader') THEN
    ALTER TABLE public.kader DROP COLUMN IF EXISTS provinsi CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS kabupaten CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS kecamatan CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS "organisasiSD" CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS organisasisd CASCADE;
  END IF;
END $$;

