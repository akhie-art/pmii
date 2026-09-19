-- Migration: Create pendaftaran table
-- Description: Pendaftaran Peserta Kegiatan dengan ID UUID dan eventId UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pendaftaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "cadreName" TEXT NOT NULL,
  "cadreRayon" TEXT DEFAULT '',
  "cadreEmail" TEXT NOT NULL,
  "dateApplied" DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  notes TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  "verificationStatus" JSONB NOT NULL DEFAULT '{}'::jsonb,
  attendance JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isGraduated" BOOLEAN DEFAULT false,
  "registrationNumber" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
