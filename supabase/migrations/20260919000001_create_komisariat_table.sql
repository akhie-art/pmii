-- Migration: Create komisariat table
-- Description: Profil Komisariat & Rayon Binaan dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS komisariat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  "establishedDate" DATE,
  status TEXT NOT NULL DEFAULT 'AKTIF', -- 'AKTIF', 'PERSUPERVISION', 'INAKTIF'
  "logoInitial" TEXT,
  "contactEmail" TEXT,
  accreditation TEXT NOT NULL DEFAULT 'A', -- 'A', 'B', 'C', 'Belum Akreditasi'
  structure JSONB DEFAULT '{}'::jsonb, -- { chairman, secretary, treasurer, period }
  rayons JSONB DEFAULT '[]'::jsonb, -- [{ id, name, memberCount }]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
