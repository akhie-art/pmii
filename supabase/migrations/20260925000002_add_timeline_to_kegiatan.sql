-- Migration: Add timeline column to kegiatan table
-- Description: Menyimpan pengaturan jadwal tanggal dan status buka/tutup untuk 4 tahapan kegiatan (Pendaftaran, Forum Sesi, RTL, dan Sertifikat)

ALTER TABLE kegiatan 
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '{
  "registration": {"isOpen": true},
  "forum": {"isOpen": true},
  "rtl": {"isOpen": true},
  "certification": {"isOpen": true}
}'::jsonb;
