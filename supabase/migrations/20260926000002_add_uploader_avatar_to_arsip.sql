-- Migration: Add uploaderAvatar and parent to arsip table
-- Description: Mendukung penyimpanan avatar pengunggah dan struktur folder arsip digital

ALTER TABLE IF EXISTS arsip 
ADD COLUMN IF NOT EXISTS "uploaderAvatar" TEXT,
ADD COLUMN IF NOT EXISTS parent TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
