-- ==============================================================================
-- Migration: Drop legacy 'kader' table and ensure seamless view redirection
-- Tanggal: 21 November 2026
-- Deskripsi: Menghapus tabel fisik legacy 'kader' (jika masih ada) setelah
--            memastikan seluruh data sinkron ke tabel master 'anggota'.
--            Membuat View 'kader' yang mengarah ke 'anggota' agar kompatibel 100%.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Jika tabel fisik kader masih ada dan bertipe BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'kader' 
      AND table_type = 'BASE TABLE'
  ) THEN
    -- Salin data yang mungkin belum ada di tabel anggota (safety data migration)
    INSERT INTO public.anggota (id, name, email, created_at)
    SELECT id, name, email, created_at 
    FROM public.kader
    ON CONFLICT (id) DO NOTHING;

    -- Drop tabel kader fisik
    DROP TABLE public.kader CASCADE;
    RAISE NOTICE 'Tabel legacy kader berhasil di-drop.';
  END IF;

  -- 2. Buat VIEW kader yang merujuk ke tabel anggota agar query lama tetap berfungsi jika ada
  CREATE OR REPLACE VIEW public.kader AS
  SELECT * FROM public.anggota;

  RAISE NOTICE 'View publik kader berhasil dibuat merujuk ke public.anggota.';
END $$;
