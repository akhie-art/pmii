-- Migration: Add twibbon column to kegiatan table
-- Description: Menyimpan konfigurasi twibbon kampanye (frame PNG transparan, caption, status aktif)

ALTER TABLE kegiatan 
ADD COLUMN IF NOT EXISTS twibbon JSONB DEFAULT NULL;
