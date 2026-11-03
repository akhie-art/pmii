-- ==============================================================================
-- Migration: Hapus kolom user_id dari tabel pengurus
-- Tanggal: 03 November 2026
-- Deskripsi: Menghapus kolom 'user_id' dari tabel 'pengurus'. Akun autentikasi/user
--            sepenuhnya terhubung melalui tabel 'anggota' (pengurus -> anggota -> users).
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.pengurus DROP COLUMN user_id CASCADE;
      RAISE NOTICE 'Kolom user_id pada tabel pengurus berhasil dihapus.';
    END IF;
  END IF;
END $$;

