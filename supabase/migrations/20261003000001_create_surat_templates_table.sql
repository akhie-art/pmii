-- Migration: Create surat_templates table
-- Description: Bank Template Persuratan Digital PMII

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.surat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  classification TEXT DEFAULT 'Instruksi',
  content TEXT NOT NULL,
  "senderTitle" TEXT,
  "senderLocation" TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_surat_templates_created ON public.surat_templates(created_at DESC);

-- Enable Row Level Security (RLS) & Policies
ALTER TABLE public.surat_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select surat_templates" ON public.surat_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert surat_templates" ON public.surat_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update surat_templates" ON public.surat_templates
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete surat_templates" ON public.surat_templates
  FOR DELETE USING (true);
