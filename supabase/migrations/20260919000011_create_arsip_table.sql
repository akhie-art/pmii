-- Migration: Create arsip table
-- Description: Manajemen Dokumen & Arsip Digital dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS arsip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  year TEXT NOT NULL,
  size TEXT NOT NULL,
  access TEXT NOT NULL,
  "uploadedDate" TEXT NOT NULL,
  uploader TEXT NOT NULL,
  downloads INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  "isStarred" BOOLEAN DEFAULT false NOT NULL,
  url TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
