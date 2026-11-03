-- ==============================================================================
-- Migration: Hapus kolom role dari tabel pengurus
-- Tanggal: 03 November 2026
-- Deskripsi: Menghapus kolom 'role' dari tabel 'pengurus'. Hak akses/otorisasi
--            sepenuhnya dikelola melalui tabel 'roles' dan 'anggota.role_id'.
--            Jabatan struktural pengurus menggunakan kolom 'position' dan 'department'.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'role'
    ) THEN
      ALTER TABLE public.pengurus DROP COLUMN role CASCADE;
      RAISE NOTICE 'Kolom role pada tabel pengurus berhasil dihapus.';
    END IF;
  END IF;
END $$;

