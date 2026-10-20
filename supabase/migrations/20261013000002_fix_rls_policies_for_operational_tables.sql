-- Migration: Fix and complete RLS policies for all operational tables
-- Description: Memastikan policy RLS ada dan lengkap untuk komisariat, pengurus, articles, dan tabel lainnya

DO $$
BEGIN
  -- 1. KOMISARIAT
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'komisariat') THEN
    ALTER TABLE public.komisariat ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "komisariat_select" ON public.komisariat;
    DROP POLICY IF EXISTS "komisariat_write" ON public.komisariat;
    DROP POLICY IF EXISTS "komisariat_all" ON public.komisariat;
    DROP POLICY IF EXISTS "allow_all" ON public.komisariat;
    DROP POLICY IF EXISTS "allow_select" ON public.komisariat;
    DROP POLICY IF EXISTS "allow_insert" ON public.komisariat;
    DROP POLICY IF EXISTS "allow_update" ON public.komisariat;
    DROP POLICY IF EXISTS "allow_delete" ON public.komisariat;

    CREATE POLICY "komisariat_select" ON public.komisariat
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "komisariat_write" ON public.komisariat
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 2. PENGURUS
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pengurus') THEN
    ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "pengurus_select" ON public.pengurus;
    DROP POLICY IF EXISTS "pengurus_write" ON public.pengurus;
    DROP POLICY IF EXISTS "allow_all" ON public.pengurus;

    CREATE POLICY "pengurus_select" ON public.pengurus
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "pengurus_write" ON public.pengurus
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 3. PERSYARATAN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persyaratan') THEN
    ALTER TABLE public.persyaratan ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "persyaratan_select" ON public.persyaratan;
    DROP POLICY IF EXISTS "persyaratan_write" ON public.persyaratan;

    CREATE POLICY "persyaratan_select" ON public.persyaratan
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "persyaratan_write" ON public.persyaratan
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 4. KEGIATAN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kegiatan') THEN
    ALTER TABLE public.kegiatan ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "kegiatan_select" ON public.kegiatan;
    DROP POLICY IF EXISTS "kegiatan_write" ON public.kegiatan;

    CREATE POLICY "kegiatan_select" ON public.kegiatan
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "kegiatan_write" ON public.kegiatan
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 5. KADERISASI & KURIKULUM
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kaderisasi') THEN
    ALTER TABLE public.kaderisasi ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "kaderisasi_select" ON public.kaderisasi;
    DROP POLICY IF EXISTS "kaderisasi_write" ON public.kaderisasi;

    CREATE POLICY "kaderisasi_select" ON public.kaderisasi
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "kaderisasi_write" ON public.kaderisasi
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kurikulum') THEN
    ALTER TABLE public.kurikulum ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "kurikulum_select" ON public.kurikulum;
    DROP POLICY IF EXISTS "kurikulum_write" ON public.kurikulum;

    CREATE POLICY "kurikulum_select" ON public.kurikulum
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "kurikulum_write" ON public.kurikulum
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 6. ARTICLES
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'articles') THEN
    ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "articles_select" ON public.articles;
    DROP POLICY IF EXISTS "articles_write" ON public.articles;

    CREATE POLICY "articles_select" ON public.articles
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "articles_write" ON public.articles
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 7. ARSIP, EVALUATIONS, SURAT & TEMPLATES
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arsip') THEN
    ALTER TABLE public.arsip ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "arsip_select" ON public.arsip;
    DROP POLICY IF EXISTS "arsip_write" ON public.arsip;

    CREATE POLICY "arsip_select" ON public.arsip
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "arsip_write" ON public.arsip
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evaluations') THEN
    ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "evaluations_select" ON public.evaluations;
    DROP POLICY IF EXISTS "evaluations_write" ON public.evaluations;

    CREATE POLICY "evaluations_select" ON public.evaluations
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "evaluations_write" ON public.evaluations
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'surat') THEN
    ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "surat_select" ON public.surat;
    DROP POLICY IF EXISTS "surat_write" ON public.surat;

    CREATE POLICY "surat_select" ON public.surat
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "surat_write" ON public.surat
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'surat_templates') THEN
    ALTER TABLE public.surat_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "surat_templates_select" ON public.surat_templates;
    DROP POLICY IF EXISTS "surat_templates_write" ON public.surat_templates;

    CREATE POLICY "surat_templates_select" ON public.surat_templates
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "surat_templates_write" ON public.surat_templates
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- 8. ANGGOTA & KADER
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "anggota_select" ON public.anggota;
    DROP POLICY IF EXISTS "anggota_write" ON public.anggota;

    CREATE POLICY "anggota_select" ON public.anggota
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "anggota_write" ON public.anggota
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kader') THEN
    ALTER TABLE public.kader ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "kader_select" ON public.kader;
    DROP POLICY IF EXISTS "kader_write" ON public.kader;

    CREATE POLICY "kader_select" ON public.kader
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "kader_write" ON public.kader
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

END $$;
