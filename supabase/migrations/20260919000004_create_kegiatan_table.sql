-- Migration: Create kegiatan table
-- Description: Kegiatan Kaderisasi & Acara dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS kegiatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL, -- 'MAPABA', 'PKD', 'PKL', 'PELATIHAN'
  date DATE DEFAULT CURRENT_DATE,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
  sessions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
