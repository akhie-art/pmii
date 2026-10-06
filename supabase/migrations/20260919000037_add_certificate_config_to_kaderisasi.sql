-- Add certificateConfig column to kaderisasi table
ALTER TABLE kaderisasi ADD COLUMN IF NOT EXISTS "certificateConfig" JSONB;
