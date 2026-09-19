-- Migration: Create kaderisasi table
-- Description: Modul Pelaksanaan Kaderisasi dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS kaderisasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL, -- 'FORMAL', 'INFORMAL', 'NON_FORMAL'
  "formFields" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "materi" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

