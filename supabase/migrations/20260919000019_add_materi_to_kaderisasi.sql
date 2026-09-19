-- Migration: Add materi to kaderisasi table
-- Description: Menambahkan kolom materi (JSONB) pada tabel kaderisasi

ALTER TABLE IF EXISTS kaderisasi 
ADD COLUMN IF NOT EXISTS "materi" JSONB NOT NULL DEFAULT '[]'::jsonb;
