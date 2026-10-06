-- ==============================================================================
-- Migration: Add Career Assessment Columns
-- Tanggal: 26 September 2026
-- Deskripsi: Menambahkan kolom 'careerAssessment' pada tabel evaluations dan
--            'careerProfile' pada tabel anggota / kader untuk menyimpan hasil
--            tes Analisis Preferensi Kognitif & Arah Karier Mahasiswa (16 MBTI).
-- ==============================================================================

-- 1. Tambahkan kolom careerAssessment pada tabel evaluations
ALTER TABLE IF EXISTS public.evaluations
  ADD COLUMN IF NOT EXISTS "careerAssessment" JSONB DEFAULT NULL;

-- 2. Index untuk query cepat berdasarkan tipe MBTI kader
CREATE INDEX IF NOT EXISTS idx_evaluations_career_mbti
  ON public.evaluations (("careerAssessment"->>'mbtiCode'))
  WHERE "careerAssessment" IS NOT NULL;

-- 3. Tambahkan kolom careerProfile pada tabel anggota (jika ada) dan kader (jika ada)
DO $$
BEGIN
  -- Cek tabel anggota
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    ALTER TABLE public.anggota 
      ADD COLUMN IF NOT EXISTS "careerProfile" JSONB DEFAULT NULL;
    RAISE NOTICE 'Kolom careerProfile berhasil ditambahkan pada tabel anggota.';
  END IF;

  -- Cek tabel kader (jika belum di-rename atau sebagai fallback)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kader') THEN
    ALTER TABLE public.kader 
      ADD COLUMN IF NOT EXISTS "careerProfile" JSONB DEFAULT NULL;
    RAISE NOTICE 'Kolom careerProfile berhasil ditambahkan pada tabel kader.';
  END IF;
END $$;
