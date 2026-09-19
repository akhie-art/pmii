-- Migration: Drop readTime column from articles table
-- Description: Menghapus kolom readTime dari tabel articles

ALTER TABLE articles DROP COLUMN IF EXISTS "readTime";
