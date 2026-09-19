-- Migration: Drop unused columns from kurikulum table
-- Description: Menghapus kolom fullName, levelBadge, levelColor, borderColor, glowColor, description, durationDays, requirements dari tabel kurikulum

ALTER TABLE IF EXISTS kurikulum
  DROP COLUMN IF EXISTS "fullName",
  DROP COLUMN IF EXISTS "levelBadge",
  DROP COLUMN IF EXISTS "levelColor",
  DROP COLUMN IF EXISTS "borderColor",
  DROP COLUMN IF EXISTS "glowColor",
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS "durationDays",
  DROP COLUMN IF EXISTS requirements;
