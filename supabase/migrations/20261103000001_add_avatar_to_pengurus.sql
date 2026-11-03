-- Migration: Tambahkan kolom avatar pada tabel pengurus
-- Description: Mendukung penyimpanan pas foto pengurus secara langsung pada tabel pengurus

ALTER TABLE IF EXISTS public.pengurus 
ADD COLUMN IF NOT EXISTS avatar TEXT;

