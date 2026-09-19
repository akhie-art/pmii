-- Migration: Add formFields to kaderisasi table
-- Description: Menambahkan kolom formFields (JSONB) pada tabel kaderisasi untuk konfigurasi formulir pendaftaran

ALTER TABLE IF EXISTS kaderisasi 
ADD COLUMN IF NOT EXISTS "formFields" JSONB NOT NULL DEFAULT '[]'::jsonb;
