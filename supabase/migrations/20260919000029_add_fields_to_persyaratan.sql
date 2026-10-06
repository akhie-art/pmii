-- Migration: Add RTL task fields to persyaratan table
-- Description: Menambahkan kolom deadline, eventId, fileName, fileSize, dan fileUrl ke tabel persyaratan

ALTER TABLE persyaratan 
  ADD COLUMN IF NOT EXISTS deadline TEXT,
  ADD COLUMN IF NOT EXISTS "eventId" TEXT,
  ADD COLUMN IF NOT EXISTS "fileName" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" TEXT,
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
