-- Migration: Create pengurus table
-- Description: Pengurus Komisariat dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pengurus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'pengurus',
  position TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT DEFAULT '',
  period TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  department TEXT,
  gender TEXT,
  status TEXT DEFAULT 'AKTIF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
