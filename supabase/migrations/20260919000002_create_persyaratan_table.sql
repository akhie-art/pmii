-- Migration: Create persyaratan table
-- Description: Syarat Penugasan Follow Up / RKTL dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS persyaratan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL, -- 'MAPABA', 'PKD', 'PKL'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'FILE',
  category TEXT,
  "minSubmissions" INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
