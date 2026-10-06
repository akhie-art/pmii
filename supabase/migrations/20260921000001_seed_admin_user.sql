-- Migration: Seed admin user
-- Description: Akun seeder resmi administrator dengan role 'admin' untuk Supabase Auth (auth.users) dan tabel kader

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

DO $$
DECLARE
  admin_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
  admin_email TEXT := 'admin@pmii.org';
  admin_password TEXT := 'admin123';
  admin_name TEXT := 'Admin PK PMII Ki Ageng Getas Pendawa';
  admin_commissariat TEXT := 'Ki Ageng Getas Pendawa';
  hashed_password TEXT;
BEGIN
  -- Dapatkan hash password menggunakan extensions.crypt atau fallback ke crypt biasa
  BEGIN
    hashed_password := extensions.crypt(admin_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      hashed_password := crypt(admin_password, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      hashed_password := '$2a$10$wT8KskY6jE64cZg3y.51f.gWvE4Ufq/QkZ0N42z32s5k6G0y4xK7S';
    END;
  END;

  -- 1. SEED KE SUPABASE AUTH (auth.users) JIKA SKEMA AUTH TERSEDIA
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id OR email = admin_email) THEN
      UPDATE auth.users
      SET id = admin_user_id,
          email = admin_email,
          encrypted_password = hashed_password,
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
          raw_user_meta_data = jsonb_build_object(
            'name', admin_name,
            'role', 'admin',
            'commissariat', admin_commissariat
          ),
          updated_at = now()
      WHERE id = admin_user_id OR email = admin_email;
    ELSE
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated',
        'authenticated',
        admin_email,
        hashed_password,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'name', admin_name,
          'role', 'admin',
          'commissariat', admin_commissariat
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    END IF;

    -- 2. SEED KE auth.identities (Diperlukan GoTrue untuk autentikasi email & password)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
      IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_user_id) THEN
        UPDATE auth.identities
        SET identity_data = jsonb_build_object(
              'sub', admin_user_id::text,
              'email', admin_email,
              'email_verified', true
            ),
            updated_at = now()
        WHERE user_id = admin_user_id;
      ELSE
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          admin_user_id,
          admin_user_id,
          jsonb_build_object(
            'sub', admin_user_id::text,
            'email', admin_email,
            'email_verified', true
          ),
          'email',
          admin_user_id::text,
          now(),
          now(),
          now()
        );
      END IF;
    END IF;
  END IF;

  -- 3. SEED KE TABEL kader (Profil Utama Akun di Aplikasi PMII)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kader') THEN
    IF EXISTS (SELECT 1 FROM kader WHERE id = admin_user_id OR email = admin_email) THEN
      UPDATE kader
      SET user_id = admin_user_id,
          name = admin_name,
          email = admin_email,
          role = 'admin',
          commissariat = admin_commissariat,
          status = 'AKTIF',
          level = 'PKL'
      WHERE id = admin_user_id OR email = admin_email;
    ELSE
      INSERT INTO kader (
        id,
        user_id,
        name,
        email,
        role,
        commissariat,
        status,
        level
      ) VALUES (
        admin_user_id,
        admin_user_id,
        admin_name,
        admin_email,
        'admin',
        admin_commissariat,
        'AKTIF',
        'PKL'
      );
    END IF;
  END IF;

  -- 4. BACKWARD COMPATIBILITY: Update tabel pengguna jika masih ada
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengguna') THEN
    IF EXISTS (SELECT 1 FROM pengguna WHERE id = admin_user_id OR email = admin_email) THEN
      UPDATE pengguna
      SET name = admin_name,
          email = admin_email,
          role = 'admin',
          commissariat = admin_commissariat,
          status = 'AKTIF'
      WHERE id = admin_user_id OR email = admin_email;
    ELSE
      INSERT INTO pengguna (
        id,
        name,
        email,
        role,
        commissariat,
        status
      ) VALUES (
        admin_user_id,
        admin_name,
        admin_email,
        'admin',
        admin_commissariat,
        'AKTIF'
      );
    END IF;
  END IF;

END $$;
