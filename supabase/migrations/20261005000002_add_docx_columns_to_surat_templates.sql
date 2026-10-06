-- Migration: Add DOCX template columns to surat_templates
-- Description: Mendukung penyimpanan template Word/DOCX (fileBase64, isDocx flag, dan daftar placeholders)

ALTER TABLE IF EXISTS public.surat_templates
  ADD COLUMN IF NOT EXISTS "fileBase64" TEXT,
  ADD COLUMN IF NOT EXISTS "isDocx" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "placeholders" JSONB DEFAULT '[]'::jsonb;
