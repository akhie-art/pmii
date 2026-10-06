-- Migration: Seed initial data
-- Description: Data awal resmi PK PMII Ki Ageng Getas Pendawa, kurikulum formal, dan akun resmi dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bersihkan akun dummy lama jika ada
DELETE FROM pengguna 
WHERE email IN (
  'pk.walisongo@pmii.org', 
  'pr.tarbiyah@pmii.org', 
  'ahmad.fudholi@student.walisongo.ac.id'
);

-- 2. AKUN SEED BERDASARKAN 4 ROLE RESMI (admin, pengurus, anggota, peserta)
INSERT INTO pengguna (id, name, email, role, commissariat, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Admin PK PMII Ki Ageng Getas Pendawa', 'admin@pmii.org', 'admin', 'Ki Ageng Getas Pendawa', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'Pengurus PK PMII Ki Ageng Getas Pendawa', 'pengurus@pmii.org', 'pengurus', 'Ki Ageng Getas Pendawa', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'Sahabat Anggota (Kader Resmi)', 'anggota@pmii.org', 'anggota', 'Ki Ageng Getas Pendawa', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'Calon Anggota (Peserta MAPABA)', 'peserta@pmii.org', 'peserta', 'Ki Ageng Getas Pendawa', 'AKTIF')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  commissariat = EXCLUDED.commissariat,
  status = EXCLUDED.status;

-- 3. DATA RESMI KOMISARIAT
INSERT INTO komisariat (
  id, 
  name, 
  university, 
  "establishedDate", 
  status, 
  "logoInitial", 
  "contactEmail", 
  accreditation, 
  structure
)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::uuid,
  'PK PMII Ki Ageng Getas Pendawa',
  'Komisariat Ki Ageng Getas Pendawa',
  '1970-04-17',
  'AKTIF',
  'KGP',
  '-',
  'A',
  '{"chairman": "-", "secretary": "-", "treasurer": "-", "period": "2026 - 2027"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  "logoInitial" = COALESCE(komisariat."logoInitial", EXCLUDED."logoInitial"),
  "contactEmail" = COALESCE(komisariat."contactEmail", EXCLUDED."contactEmail"),
  structure = CASE 
    WHEN komisariat.structure IS NULL OR komisariat.structure = '{}'::jsonb 
    THEN EXCLUDED.structure 
    ELSE komisariat.structure 
  END;

-- 4. DATA SEED KURIKULUM FORMAL NASIONAL PMII (MAPABA, PKD, PKL, PKN)
INSERT INTO kurikulum (
  id,
  name,
  syllabus,
  materials,
  quiz
)
VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::uuid, 'MAPABA', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::uuid, 'PKD', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::uuid, 'PKL', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::uuid, 'PKN', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  syllabus = CASE 
    WHEN kurikulum.syllabus IS NULL OR kurikulum.syllabus = '[]'::jsonb 
    THEN EXCLUDED.syllabus 
    ELSE kurikulum.syllabus 
  END,
  materials = CASE 
    WHEN kurikulum.materials IS NULL OR kurikulum.materials = '[]'::jsonb 
    THEN EXCLUDED.materials 
    ELSE kurikulum.materials 
  END,
  quiz = CASE 
    WHEN kurikulum.quiz IS NULL OR kurikulum.quiz = '[]'::jsonb 
    THEN EXCLUDED.quiz 
    ELSE kurikulum.quiz 
  END;
