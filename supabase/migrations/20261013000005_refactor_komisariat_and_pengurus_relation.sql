-- Migration: Refactor Tabel Komisariat & Relasi dengan Tabel Pengurus
-- 1. Hapus kolom accreditation dari tabel komisariat
-- 2. Tambahkan relasi komisariat_id di tabel pengurus dan anggota
-- 3. Seed 4 data komisariat resmi PMII Cabang Grobogan

-- 1. Hapus kolom accreditation dari tabel komisariat jika ada
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS accreditation;

-- 2. Tambahkan kolom komisariat_id di tabel pengurus (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.pengurus 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Tambahkan kolom komisariat_id di tabel anggota (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.anggota 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Seed / Upsert 4 Data Komisariat Resmi PMII Cabang Grobogan
INSERT INTO public.komisariat (
  id,
  name,
  university,
  "contactEmail",
  "establishedYear",
  structure,
  rayons,
  created_at
)
VALUES
  (
    '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f',
    'Komisariat Ki Ageng Getas Pendawa',
    'Universitas An Nuur',
    'getaspendawa@pmii.org',
    2018,
    jsonb_build_object(
      'chairman_id', null,
      'secretary_id', null,
      'treasurer_id', null,
      'chairman', '',
      'secretary', '',
      'treasurer', '',
      'period', '2026 - 2027'
    ),
    '[]'::jsonb,
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Komisariat Ki Ageng Tarub',
    'Sekolah Tinggi Agama Islam Walisembilan Semarang',
    'kiagengtarub@pmii.org',
    2019,
    jsonb_build_object(
      'chairman_id', null,
      'secretary_id', null,
      'treasurer_id', null,
      'chairman', '',
      'secretary', '',
      'treasurer', '',
      'period', '2026 - 2027'
    ),
    '[]'::jsonb,
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Komisariat Ajisaka',
    'Sekolah Tinggi Agama Islam Grobogan',
    'ajisaka@pmii.org',
    2020,
    jsonb_build_object(
      'chairman_id', null,
      'secretary_id', null,
      'treasurer_id', null,
      'chairman', '',
      'secretary', '',
      'treasurer', '',
      'period', '2026 - 2027'
    ),
    '[]'::jsonb,
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Komisariat Joko Suro',
    'Sekolah Tinggi Agama Islam Walisembilan Semarang',
    'jokosuro@pmii.org',
    2021,
    jsonb_build_object(
      'chairman_id', null,
      'secretary_id', null,
      'treasurer_id', null,
      'chairman', '',
      'secretary', '',
      'treasurer', '',
      'period', '2026 - 2027'
    ),
    '[]'::jsonb,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  "contactEmail" = EXCLUDED."contactEmail";

-- 5. Hubungkan anggota AKHIE DESAIN ke Komisariat Ki Ageng Getas Pendawa
UPDATE public.anggota
SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid
WHERE name ILIKE '%AKHIE DESAIN%' OR email = 'akhiedesain@gmail.com';
