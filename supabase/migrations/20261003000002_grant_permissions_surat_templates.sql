-- Migration: Grant permissions on surat_templates
-- Description: Grant table access for anon, authenticated, and service_role

GRANT ALL ON TABLE public.surat_templates TO anon, authenticated, service_role;
