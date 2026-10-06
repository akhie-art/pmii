-- Migration: Add waGroupLink to kegiatan table
-- Description: Menambahkan kolom waGroupLink ke tabel kegiatan

ALTER TABLE kegiatan 
  ADD COLUMN IF NOT EXISTS "waGroupLink" TEXT;
