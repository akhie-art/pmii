-- Migration: Drop unused columns from surat_templates
-- Description: Menghapus kolom subject, classification, senderTitle, senderLocation, fileName, fileSize, fileBase64 dari tabel surat_templates

ALTER TABLE IF EXISTS public.surat_templates
  DROP COLUMN IF EXISTS subject CASCADE,
  DROP COLUMN IF EXISTS classification CASCADE,
  DROP COLUMN IF EXISTS "senderTitle" CASCADE,
  DROP COLUMN IF EXISTS sendertitle CASCADE,
  DROP COLUMN IF EXISTS "senderLocation" CASCADE,
  DROP COLUMN IF EXISTS senderlocation CASCADE,
  DROP COLUMN IF EXISTS "fileName" CASCADE,
  DROP COLUMN IF EXISTS filename CASCADE,
  DROP COLUMN IF EXISTS "fileSize" CASCADE,
  DROP COLUMN IF EXISTS filesize CASCADE,
  DROP COLUMN IF EXISTS "fileBase64" CASCADE,
  DROP COLUMN IF EXISTS filebase64 CASCADE;
