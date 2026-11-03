-- ==============================================================================
-- Migration: Hapus kolom gender dari tabel pengurus
-- Tanggal: 03 November 2026
-- Deskripsi: Menghapus kolom 'gender' dari tabel 'pengurus'. Data jenis kelamin /
--            sapaan (Sahabat/Sahabati) sepenuhnya terpusat dan mengacu pada tabel 'anggota'
--            melalui foreign key 'anggota_id'.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'gender'
    ) THEN
      ALTER TABLE public.pengurus DROP COLUMN gender CASCADE;
      RAISE NOTICE 'Kolom gender pada tabel pengurus berhasil dihapus.';
    END IF;
  END IF;
END $$;

