-- Drop pasFotoName from anggota and kader tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'pasFotoName'
  ) THEN
    ALTER TABLE public.anggota DROP COLUMN "pasFotoName";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kader' AND column_name = 'pasFotoName'
  ) THEN
    ALTER TABLE public.kader DROP COLUMN "pasFotoName";
  END IF;
END $$;

