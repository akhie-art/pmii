-- ==============================================================================
-- Migration: Ganti nama tabel 'kader' menjadi 'anggota'
-- Tanggal: 25 September 2026
-- Deskripsi: Mengubah nama tabel database pangkalan data dari 'kader' menjadi 'anggota'
--            sesuai terminologi resmi organisasi PMII.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Rename table kader menjadi anggota jika tabel kader masih ada dan anggota belum ada
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kader') 
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    ALTER TABLE public.kader RENAME TO anggota;
    RAISE NOTICE 'Tabel kader berhasil di-rename menjadi anggota.';
  ELSE
    RAISE NOTICE 'Tabel anggota sudah ada atau tabel kader tidak ditemukan.';
  END IF;

  -- 2. Pastikan RLS (Row Level Security) aktif di tabel anggota
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;

    -- Policy Select (Public / Authenticated Read)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anggota' AND policyname = 'Allow public read on anggota'
    ) THEN
      CREATE POLICY "Allow public read on anggota" ON public.anggota FOR SELECT USING (true);
    END IF;

    -- Policy Insert / Update / Delete (All Operations)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anggota' AND policyname = 'Allow all write on anggota'
    ) THEN
      CREATE POLICY "Allow all write on anggota" ON public.anggota FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;
