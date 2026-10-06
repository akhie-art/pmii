-- Migration: Drop all rayon-related columns, indexes, and constraints
-- Description: Total cleanup of Rayon structure across all tables

-- 1. Drop Rayon composite index on kader and recreate index for commissariat
DROP INDEX IF EXISTS idx_kader_commissariat_rayon;
CREATE INDEX IF NOT EXISTS idx_kader_commissariat ON kader(commissariat);

-- 2. Drop rayon columns from all tables
ALTER TABLE IF EXISTS komisariat DROP COLUMN IF EXISTS rayons;
ALTER TABLE IF EXISTS pengurus DROP COLUMN IF EXISTS rayon;
ALTER TABLE IF EXISTS pendaftaran DROP COLUMN IF EXISTS "cadreRayon";
ALTER TABLE IF EXISTS kader DROP COLUMN IF EXISTS rayon;
ALTER TABLE IF EXISTS pengguna DROP COLUMN IF EXISTS rayon;
ALTER TABLE IF EXISTS surat DROP COLUMN IF EXISTS rayon;
ALTER TABLE IF EXISTS arsip DROP COLUMN IF EXISTS rayon;
