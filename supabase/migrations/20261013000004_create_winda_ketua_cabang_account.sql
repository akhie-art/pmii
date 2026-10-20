-- Migration: Update Master Account to Sahabat Winda (Ketua Cabang)
-- Email: winda@pmii.org
-- Password: admin123
-- Role: admin (Pengurus Cabang)

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 1. Update auth.users
UPDATE auth.users
SET email = 'winda@pmii.org',
    encrypted_password = extensions.crypt('admin123', extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = jsonb_build_object(
      'name', 'Sahabat Winda (Ketua Cabang)',
      'role', 'admin',
      'commissariat', 'Pengurus Cabang Grobogan'
    ),
    updated_at = now()
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid 
   OR email = 'admin@pmii.org' 
   OR email = 'winda@pmii.org';

-- 2. Update auth.identities jika ada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
    UPDATE auth.identities
    SET identity_data = jsonb_build_object(
          'sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          'email', 'winda@pmii.org',
          'email_verified', true
        ),
        provider_id = 'winda@pmii.org',
        updated_at = now()
    WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
       OR provider_id = 'admin@pmii.org'
       OR provider_id = 'winda@pmii.org';
  END IF;
END $$;

-- 3. Update public.anggota
UPDATE public.anggota
SET name = 'Sahabat Winda (Ketua Cabang)',
    email = 'winda@pmii.org',
    commissariat = 'Pengurus Cabang Grobogan',
    role = 'admin',
    status = 'AKTIF',
    "isGraduated" = true
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' 
   OR email = 'admin@pmii.org' 
   OR email = 'winda@pmii.org';
