-- ==============================================================================
-- Migration: Seed Leadership Roles (Ketua Cabang, Ketua Komisariat, Pengurus Cabang, Pengurus Komisariat)
-- File: supabase/migrations/20261020000002_seed_leadership_roles.sql
-- ==============================================================================

INSERT INTO public.roles (id, code, allowed_menus)
VALUES
  (
    'b0000000-0000-0000-0000-000000000011'::uuid,
    'ketua_cabang',
    '[
      "/admin", 
      "/admin/kegiatan", 
      "/admin/anggota", 
      "/admin/kaderisasi", 
      "/admin/pengurus", 
      "/admin/surat", 
      "/admin/arsip", 
      "/admin/artikel", 
      "/admin/penilaian", 
      "/admin/rekap-nilai", 
      "/admin/verifikasi", 
      "/admin/pengguna", 
      "/admin/komisariat", 
      "/admin/pengaturan", 
      "/admin/profil"
    ]'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000012'::uuid,
    'ketua_komisariat',
    '[
      "/pengurus", 
      "/pengurus/kegiatan", 
      "/pengurus/anggota", 
      "/pengurus/kaderisasi", 
      "/pengurus/pengurus", 
      "/pengurus/surat", 
      "/pengurus/arsip", 
      "/pengurus/artikel", 
      "/pengurus/penilaian", 
      "/pengurus/rekap-nilai", 
      "/pengurus/profil"
    ]'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000013'::uuid,
    'pengurus_cabang',
    '[
      "/admin", 
      "/admin/kegiatan", 
      "/admin/anggota", 
      "/admin/kaderisasi", 
      "/admin/pengurus", 
      "/admin/surat", 
      "/admin/arsip", 
      "/admin/artikel", 
      "/admin/penilaian", 
      "/admin/rekap-nilai", 
      "/admin/verifikasi", 
      "/admin/komisariat", 
      "/admin/profil"
    ]'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000014'::uuid,
    'pengurus_komisariat',
    '[
      "/pengurus", 
      "/pengurus/kegiatan", 
      "/pengurus/anggota", 
      "/pengurus/kaderisasi", 
      "/pengurus/surat", 
      "/pengurus/arsip", 
      "/pengurus/artikel", 
      "/pengurus/penilaian", 
      "/pengurus/rekap-nilai", 
      "/pengurus/profil"
    ]'::jsonb
  )
ON CONFLICT (code) DO UPDATE
SET allowed_menus = EXCLUDED.allowed_menus,
    updated_at = timezone('utc'::text, now());
