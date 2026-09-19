-- Migration: Drop syllabus and modul columns from kaderisasi table
-- Description: Menghapus kolom syllabus dan modul dari tabel kaderisasi

ALTER TABLE IF EXISTS kaderisasi 
  DROP COLUMN IF EXISTS syllabus,
  DROP COLUMN IF EXISTS modul;
