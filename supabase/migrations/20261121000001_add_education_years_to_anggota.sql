-- ==============================================================================
-- Migration: Add Education Years (Tahun Masuk & Tahun Selesai) to anggota
-- Tanggal: 21 November 2026
-- Deskripsi: Menambahkan kolom tahun masuk dan tahun selesai untuk perguruan tinggi,
--            serta riwayat pendidikan formal SD, SMP, SMA/SMK pada tabel anggota.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
    -- Perguruan Tinggi
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunMasukPT') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunMasukPT" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunLulusPT') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunLulusPT" TEXT;
    END IF;

    -- Sekolah Dasar (SD / MI)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunMasukSD') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunMasukSD" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunLulusSD') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunLulusSD" TEXT;
    END IF;

    -- SMP / MTs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunMasukSMP') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunMasukSMP" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunLulusSMP') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunLulusSMP" TEXT;
    END IF;

    -- SMA / SMK / MA
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunMasukSMA') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunMasukSMA" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'tahunLulusSMA') THEN
      ALTER TABLE public.anggota ADD COLUMN "tahunLulusSMA" TEXT;
    END IF;

    RAISE NOTICE 'Kolom tahun pendidikan berhasil ditambahkan ke tabel anggota.';
  END IF;

  -- Jika tabel kader masih ada (legacy alias)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kader') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunMasukPT') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunMasukPT" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunLulusPT') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunLulusPT" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunMasukSD') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunMasukSD" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunLulusSD') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunLulusSD" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunMasukSMP') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunMasukSMP" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunLulusSMP') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunLulusSMP" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunMasukSMA') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunMasukSMA" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'tahunLulusSMA') THEN
      ALTER TABLE public.kader ADD COLUMN "tahunLulusSMA" TEXT;
    END IF;
  END IF;
END $$;
