-- Migration: Create pengaturan (settings) table for persistent configuration
-- Supports: Identitas Cabang, Format Surat & Administrasi, Parameter Kaderisasi, Sistem

CREATE TABLE IF NOT EXISTS public.pengaturan (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Row Level Security
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pengaturan_select" ON public.pengaturan;
DROP POLICY IF EXISTS "pengaturan_write" ON public.pengaturan;

CREATE POLICY "pengaturan_select" ON public.pengaturan
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "pengaturan_write" ON public.pengaturan
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed default settings for Pengurus Cabang PMII Grobogan
INSERT INTO public.pengaturan (key, value)
VALUES (
  'system_settings',
  '{
    "organization": {
      "cabangName": "Pengurus Cabang PMII Grobogan",
      "period": "2026 - 2027",
      "address": "Jl. Raya Purwodadi - Solo Km. 2, Grobogan, Jawa Tengah",
      "email": "cabang@pmiigrobogan.or.id",
      "phone": "+6281234567890",
      "website": "https://pmiigrobogan.or.id",
      "instagram": "@pcpmii_grobogan",
      "logo": ""
    },
    "administration": {
      "letterCode": "PC-XX",
      "regionCode": "V-02",
      "autoNumbering": true,
      "headOfBranch": "Sahabat Winda",
      "secretaryGeneral": "Sahabat Ahmad Fauzi",
      "digitalSignature": false
    },
    "theme": "system"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
