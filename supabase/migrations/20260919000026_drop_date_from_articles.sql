-- Migration: Drop date column from articles table
-- Description: Menghapus kolom date dan menggunakan kolom created_at saja

ALTER TABLE articles DROP COLUMN IF EXISTS date;
