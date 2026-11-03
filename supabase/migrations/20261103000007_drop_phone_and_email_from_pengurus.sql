-- ==============================================================================
-- Migration: Hapus kolom phone dan email dari tabel pengurus
-- Tanggal: 03 November 2026
-- Deskripsi: Menghapus redundansi data kontak fungsionaris pada tabel 'pengurus'.
--            Nomor telepon dan email kontak kini sepenuhnya mengacu pada tabel 'anggota'
--            melalui relasi 'anggota_id'.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN
    -- Hapus kolom phone jika ada
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'phone'
    ) THEN
      ALTER TABLE public.pengurus DROP COLUMN phone CASCADE;
      RAISE NOTICE 'Kolom phone pada tabel pengurus berhasil dihapus.';
    END IF;

    -- Hapus kolom email jika ada
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'email'
    ) THEN
      ALTER TABLE public.pengurus DROP COLUMN email CASCADE;
      RAISE NOTICE 'Kolom email pada tabel pengurus berhasil dihapus.';
    END IF;
  END IF;
END $$;

