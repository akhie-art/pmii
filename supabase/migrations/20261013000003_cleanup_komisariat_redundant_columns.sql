-- Migration: Cleanup redundant columns from komisariat table
-- Menghapus kolom redundan: campusName, logoUrl, establishedDate, logoInitial

-- 1. Sinkronkan nilai ke kolom utama sebelum drop
UPDATE public.komisariat
SET university = COALESCE(university, "campusName")
WHERE university IS NULL AND "campusName" IS NOT NULL;

UPDATE public.komisariat
SET logo = COALESCE(logo, "logoUrl")
WHERE logo IS NULL AND "logoUrl" IS NOT NULL;

UPDATE public.komisariat
SET "establishedYear" = COALESCE("establishedYear", EXTRACT(YEAR FROM "establishedDate")::integer)
WHERE "establishedYear" IS NULL AND "establishedDate" IS NOT NULL;

-- 2. Hapus kolom-kolom redundan
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS "campusName";
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS "logoUrl";
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS "establishedDate";
ALTER TABLE public.komisariat DROP COLUMN IF EXISTS "logoInitial";
