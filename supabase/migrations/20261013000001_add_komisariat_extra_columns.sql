-- Migration: Add missing columns to komisariat table
-- Description: Menambahkan kolom campusName, establishedYear, logo, logoUrl, rayons agar selaras dengan kebutuhan frontend

ALTER TABLE public.komisariat ADD COLUMN IF NOT EXISTS "campusName" TEXT;
ALTER TABLE public.komisariat ADD COLUMN IF NOT EXISTS "establishedYear" INTEGER;
ALTER TABLE public.komisariat ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.komisariat ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE public.komisariat ADD COLUMN IF NOT EXISTS rayons JSONB DEFAULT '[]'::jsonb;

-- Sinkronkan campusName dari university jika ada baris yang kosong
UPDATE public.komisariat 
SET "campusName" = university 
WHERE "campusName" IS NULL AND university IS NOT NULL;
