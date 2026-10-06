-- Migration: Clean all dummy and transaction data while preserving Master Admin
-- Description: Mengosongkan data kader dummy, evaluasi, kegiatan, pendaftaran, artikel, surat, dan arsip,
--              serta memastikan akun Master Admin (admin@pmii.org) tetap aktif dan aman.

-- 1. Bersihkan tabel-tabel operasional / data transaksi
DELETE FROM public.evaluations;
DELETE FROM public.pendaftaran;
DELETE FROM public.kegiatan;
DELETE FROM public.articles;
DELETE FROM public.arsip;
DELETE FROM public.surat;
DELETE FROM public.pengurus;

-- 2. Bersihkan tabel kader KECUALI akun Master Admin
DELETE FROM public.kader 
WHERE LOWER(email) != 'admin@pmii.org' 
  AND id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Pastikan akun Master Admin ada di tabel kader
INSERT INTO public.kader (
  id,
  user_id,
  name,
  email,
  role,
  commissariat,
  status,
  level,
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Admin PK PMII Ki Ageng Getas Pendawa',
  'admin@pmii.org',
  'admin',
  'Ki Ageng Getas Pendawa',
  'AKTIF',
  'PKL',
  now()
)
ON CONFLICT (id) DO UPDATE
SET email = 'admin@pmii.org',
    name = 'Admin PK PMII Ki Ageng Getas Pendawa',
    role = 'admin',
    status = 'AKTIF';

-- 3. Bersihkan akun di auth.users & auth.identities KECUALI Master Admin
DELETE FROM auth.identities 
WHERE user_id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND LOWER(provider_id) != 'admin@pmii.org';

DELETE FROM auth.users 
WHERE id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND LOWER(email) != 'admin@pmii.org';

-- 4. Buat fungsi helper jika admin ingin membersihkan data ulang di masa mendatang
CREATE OR REPLACE FUNCTION public.clean_all_data_except_admin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_kader_count INT;
  v_eval_count INT;
BEGIN
  -- Bersihkan tabel
  DELETE FROM public.evaluations;
  DELETE FROM public.pendaftaran;
  DELETE FROM public.kegiatan;
  DELETE FROM public.articles;
  DELETE FROM public.arsip;
  DELETE FROM public.surat;
  DELETE FROM public.pengurus;

  DELETE FROM public.kader 
  WHERE LOWER(email) != 'admin@pmii.org' 
    AND id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  DELETE FROM auth.identities 
  WHERE user_id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    AND LOWER(provider_id) != 'admin@pmii.org';

  DELETE FROM auth.users 
  WHERE id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    AND LOWER(email) != 'admin@pmii.org';

  SELECT count(*) INTO v_kader_count FROM public.kader;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Semua data telah dibersihkan. Akun Master Admin admin@pmii.org tetap aktif.',
    'remainingKader', v_kader_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clean_all_data_except_admin() TO authenticated, service_role, anon;
