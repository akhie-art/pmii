-- Migration: Create surat table
-- Description: Administrasi Persuratan Digital dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor TEXT NOT NULL,
  type TEXT NOT NULL, -- 'MASUK' or 'KELUAR'
  "senderOrRecipient" TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  classification TEXT NOT NULL,
  status TEXT NOT NULL,
  content TEXT NOT NULL,
  "senderTitle" TEXT,
  "senderLocation" TEXT,
  "dateIndo" TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
