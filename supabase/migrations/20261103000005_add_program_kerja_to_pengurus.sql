-- Migration: Add program_kerja column to pengurus table
-- Description: Menyimpan program kerja utama atau unggulan untuk fungsionaris pengurus

ALTER TABLE pengurus ADD COLUMN IF NOT EXISTS program_kerja TEXT;

