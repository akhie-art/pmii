-- Migration: Create kurikulum table
-- Description: Silabus & Kurikulum Formal Nasional dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS kurikulum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'MAPABA', 'PKD', 'PKL', 'PKN', dll
  syllabus JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  quiz JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_kurikulum_name UNIQUE (name)
);
