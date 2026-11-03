-- Migration: Replace NIK with NIM and Drop KTP columns from anggota and kader
-- Description:
-- 1. Mengganti kolom NIK menjadi NIM (Nomor Induk Mahasiswa)
-- 2. Menghapus kolom ktpName dan ktpFileUrl untuk privasi & keamanan data

DO $$
BEGIN
  -- ==========================================
  -- 1. Perubahan pada tabel 'anggota'
  -- ==========================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
    -- Tambah kolom 'nim' jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'nim') THEN
      ALTER TABLE public.anggota ADD COLUMN nim TEXT;
    END IF;

    -- Salin data dari nik ke nim jika kolom nik ada
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'nik') THEN
      UPDATE public.anggota SET nim = COALESCE(nim, nik) WHERE nim IS NULL;
      ALTER TABLE public.anggota DROP COLUMN nik CASCADE;
    END IF;

    -- Hapus kolom berkas KTP
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS "ktpName" CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS ktpname CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS "ktpFileUrl" CASCADE;
    ALTER TABLE public.anggota DROP COLUMN IF EXISTS ktpfileurl CASCADE;

    -- Update indeks
    DROP INDEX IF EXISTS idx_anggota_nik;
    CREATE INDEX IF NOT EXISTS idx_anggota_nim ON public.anggota(nim);
  END IF;

  -- ==========================================
  -- 2. Perubahan pada tabel 'kader' (jika masih ada)
  -- ==========================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kader') THEN
    -- Tambah kolom 'nim' jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'nim') THEN
      ALTER TABLE public.kader ADD COLUMN nim TEXT;
    END IF;

    -- Salin data dari nik ke nim jika kolom nik ada
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'nik') THEN
      UPDATE public.kader SET nim = COALESCE(nim, nik) WHERE nim IS NULL;
      ALTER TABLE public.kader DROP COLUMN nik CASCADE;
    END IF;

    -- Hapus kolom berkas KTP
    ALTER TABLE public.kader DROP COLUMN IF EXISTS "ktpName" CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS ktpname CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS "ktpFileUrl" CASCADE;
    ALTER TABLE public.kader DROP COLUMN IF EXISTS ktpfileurl CASCADE;

    -- Update indeks
    DROP INDEX IF EXISTS idx_kader_nik;
    CREATE INDEX IF NOT EXISTS idx_kader_nim ON public.kader(nim);
  END IF;
END $$;

