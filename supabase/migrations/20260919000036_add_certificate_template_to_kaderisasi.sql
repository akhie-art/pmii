-- Migration: Add certificateTemplate to kaderisasi table
-- Description: Menambahkan kolom certificateTemplate ke tabel kaderisasi

ALTER TABLE kaderisasi 
  ADD COLUMN IF NOT EXISTS "certificateTemplate" TEXT;
