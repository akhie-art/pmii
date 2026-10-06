-- Migration: Add file attachment columns to surat and surat_templates
-- Description: Mendukung penyimpanan URL berkas fisik/PDF dan template Word di Supabase Storage

ALTER TABLE IF EXISTS public.surat
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fileName" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" TEXT;

ALTER TABLE IF EXISTS public.surat_templates
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fileName" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" TEXT;

-- Index for searching attached files
CREATE INDEX IF NOT EXISTS idx_surat_has_file ON public.surat ("fileUrl") WHERE "fileUrl" IS NOT NULL;
