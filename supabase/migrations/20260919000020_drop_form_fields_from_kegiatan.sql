-- Migration: Drop formFields from kegiatan table
-- Description: Menghapus kolom formFields dari tabel kegiatan karena formulir pendaftaran dikelola terpusat di tabel kaderisasi

ALTER TABLE IF EXISTS kegiatan 
DROP COLUMN IF EXISTS "formFields";
