-- Migration: Add avatar column to evaluations table
-- Description: Menyimpan link foto / avatar peserta kaderisasi pada tabel evaluations

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluations' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE evaluations ADD COLUMN avatar TEXT;
  END IF;
END $$;
