-- Migration: Add pasFoto column to anggota table
-- Description: Menambahkan kolom khusus pasFoto (3x4 resmi) terpisah dari avatar profil

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'pasFoto'
  ) THEN
    ALTER TABLE public.anggota ADD COLUMN "pasFoto" TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'kader'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'pasFoto'
    ) THEN
      ALTER TABLE public.kader ADD COLUMN "pasFoto" TEXT;
    END IF;
  END IF;
END $$;
