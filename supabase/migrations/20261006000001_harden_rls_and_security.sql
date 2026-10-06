-- ==============================================================================
-- Migration: Harden Row Level Security (RLS) & Table Access Permissions
-- Date: 06 Oktober 2026
-- Description: Mengunci izin akses tulis (INSERT/UPDATE/DELETE) pada tabel-tabel
--            sensitif agar hanya dapat diakses oleh user yang terotentikasi (authenticated),
--            sembari tetap mengizinkan akses baca (SELECT) pada data publik (artikel,
--            kegiatan, kurikulum, dan form pendaftaran).
-- ==============================================================================

-- 1. Pastikan RLS aktif pada seluruh tabel publik
ALTER TABLE IF EXISTS public.komisariat ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.persyaratan ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kader ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kaderisasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kurikulum ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.surat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.arsip ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.articles ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan policy lama yang memperbolehkan write tanpa autentikasi (USING true)
DO $$
BEGIN
  -- Drop open write policies on sensitive tables if exist
  DROP POLICY IF EXISTS "allow_all" ON public.komisariat;
  DROP POLICY IF EXISTS "allow_insert" ON public.komisariat;
  DROP POLICY IF EXISTS "allow_update" ON public.komisariat;
  DROP POLICY IF EXISTS "allow_delete" ON public.komisariat;

  DROP POLICY IF EXISTS "allow_all" ON public.pengurus;
  DROP POLICY IF EXISTS "allow_insert" ON public.pengurus;
  DROP POLICY IF EXISTS "allow_update" ON public.pengurus;
  DROP POLICY IF EXISTS "allow_delete" ON public.pengurus;

  DROP POLICY IF EXISTS "allow_all" ON public.surat;
  DROP POLICY IF EXISTS "allow_insert" ON public.surat;
  DROP POLICY IF EXISTS "allow_update" ON public.surat;
  DROP POLICY IF EXISTS "allow_delete" ON public.surat;

  DROP POLICY IF EXISTS "allow_all" ON public.surat_templates;
  DROP POLICY IF EXISTS "allow_insert" ON public.surat_templates;
  DROP POLICY IF EXISTS "allow_update" ON public.surat_templates;
  DROP POLICY IF EXISTS "allow_delete" ON public.surat_templates;

  DROP POLICY IF EXISTS "allow_all" ON public.arsip;
  DROP POLICY IF EXISTS "allow_insert" ON public.arsip;
  DROP POLICY IF EXISTS "allow_update" ON public.arsip;
  DROP POLICY IF EXISTS "allow_delete" ON public.arsip;

  DROP POLICY IF EXISTS "allow_all" ON public.evaluations;
  DROP POLICY IF EXISTS "allow_insert" ON public.evaluations;
  DROP POLICY IF EXISTS "allow_update" ON public.evaluations;
  DROP POLICY IF EXISTS "allow_delete" ON public.evaluations;
END $$;

-- 3. Kebijakan Keamanan untuk TABEL PERSURATAN (SURAT & TEMPLATES)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'surat') THEN
    DROP POLICY IF EXISTS "surat_auth_select" ON public.surat;
    DROP POLICY IF EXISTS "surat_auth_all" ON public.surat;

    CREATE POLICY "surat_auth_all" ON public.surat
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'surat_templates') THEN
    DROP POLICY IF EXISTS "templates_auth_all" ON public.surat_templates;

    CREATE POLICY "templates_auth_all" ON public.surat_templates
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Kebijakan Keamanan untuk ARSIP & EVALUATIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arsip') THEN
    DROP POLICY IF EXISTS "arsip_auth_all" ON public.arsip;

    CREATE POLICY "arsip_auth_all" ON public.arsip
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evaluations') THEN
    DROP POLICY IF EXISTS "evaluations_auth_all" ON public.evaluations;

    CREATE POLICY "evaluations_auth_all" ON public.evaluations
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Kebijakan Keamanan untuk PENDAFTARAN (Publik boleh mendaftar / INSERT, admin mengelola)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pendaftaran') THEN
    DROP POLICY IF EXISTS "pendaftaran_public_insert" ON public.pendaftaran;
    DROP POLICY IF EXISTS "pendaftaran_auth_manage" ON public.pendaftaran;
    DROP POLICY IF EXISTS "pendaftaran_public_select" ON public.pendaftaran;

    -- Publik boleh mendaftar diri
    CREATE POLICY "pendaftaran_public_insert" ON public.pendaftaran
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);

    -- Publik boleh membaca data pendaftarannya sendiri atau umum
    CREATE POLICY "pendaftaran_public_select" ON public.pendaftaran
      FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Hanya akun resmi terotentikasi yang boleh mengubah status / menghapus
    CREATE POLICY "pendaftaran_auth_manage" ON public.pendaftaran
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Kebijakan Keamanan untuk TABEL ANGGOTA & KADER
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    DROP POLICY IF EXISTS "anggota_read_policy" ON public.anggota;
    DROP POLICY IF EXISTS "anggota_write_policy" ON public.anggota;

    CREATE POLICY "anggota_read_policy" ON public.anggota
      FOR SELECT
      TO anon, authenticated
      USING (true);

    CREATE POLICY "anggota_write_policy" ON public.anggota
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kader') THEN
    DROP POLICY IF EXISTS "kader_read_policy" ON public.kader;
    DROP POLICY IF EXISTS "kader_write_policy" ON public.kader;

    CREATE POLICY "kader_read_policy" ON public.kader
      FOR SELECT
      TO anon, authenticated
      USING (true);

    CREATE POLICY "kader_write_policy" ON public.kader
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
