-- Migration: Create sync_user_to_auth function and sync existing cadres
-- Description: Membuat fungsi SECURITY DEFINER untuk mendaftarkan/memutakhirkan pengguna langsung ke auth.users
--              tanpa terhalang rate limit email atau verifikasi email eksternal, dan menyinkronkan data kader yang sudah ada.

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 1. Buat fungsi sinkronisasi langsung ke Supabase Auth (auth.users & auth.identities)
CREATE OR REPLACE FUNCTION public.sync_user_to_auth(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'anggota',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID;
  v_hashed_password TEXT;
  v_clean_email TEXT;
BEGIN
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN NULL;
  END IF;

  v_clean_email := LOWER(TRIM(p_email));

  -- Cari user_id yang sudah ada di auth.users berdasarkan email
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  
  -- Jika belum ada di auth.users, cek apakah sudah ada user_id di tabel kader
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.kader WHERE LOWER(email) = v_clean_email AND user_id IS NOT NULL LIMIT 1;
  END IF;

  -- Jika masih null, buat UUID baru
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
  END IF;

  -- Hash password menggunakan blowfish (standar enkripsi Supabase GoTrue / pgcrypto)
  BEGIN
    v_hashed_password := extensions.crypt(COALESCE(NULLIF(p_password, ''), 'pmii1960'), extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      v_hashed_password := crypt(COALESCE(NULLIF(p_password, ''), 'pmii1960'), gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_hashed_password := '$2a$10$wT8KskY6jE64cZg3y.51f.gWvE4Ufq/QkZ0N42z32s5k6G0y4xK7S';
    END;
  END;

  -- Insert atau update data ke auth.users
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
    v_user_id,
    'authenticated',
    'authenticated',
    v_clean_email,
    v_hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'name', COALESCE(p_name, ''),
      'role', COALESCE(p_role, 'anggota'),
      'commissariat', COALESCE(p_commissariat, 'Ki Ageng Getas Pendawa')
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE
  SET email = v_clean_email,
      encrypted_password = CASE 
        WHEN p_password IS NOT NULL AND p_password != '' THEN v_hashed_password 
        ELSE auth.users.encrypted_password 
      END,
      email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object(
        'name', COALESCE(NULLIF(p_name, ''), auth.users.raw_user_meta_data->>'name', ''),
        'role', COALESCE(NULLIF(p_role, ''), auth.users.raw_user_meta_data->>'role', 'anggota'),
        'commissariat', COALESCE(NULLIF(p_commissariat, ''), auth.users.raw_user_meta_data->>'commissariat', 'Ki Ageng Getas Pendawa')
      ),
      updated_at = now();

  -- Pastikan entri di auth.identities ada agar GoTrue dapat mengotentikasi login email
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
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email, 'email_verified', true),
    'email',
    v_clean_email,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email, 'email_verified', true),
      provider_id = v_clean_email,
      updated_at = now();

  -- Tautkan relasi user_id ke tabel kader
  UPDATE public.kader
  SET user_id = v_user_id
  WHERE LOWER(email) = v_clean_email;

  RETURN v_user_id;
END;
$$;

-- Berikan izin akses eksekusi RPC function ke anon, authenticated, dan service_role
GRANT EXECUTE ON FUNCTION public.sync_user_to_auth(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 2. Sinkronkan semua data kader aktif yang memiliki email (termasuk malik@gmail.com) ke auth.users sekarang
DO $$
DECLARE
  k RECORD;
BEGIN
  FOR k IN 
    SELECT email, name, role, commissariat 
    FROM public.kader 
    WHERE email IS NOT NULL AND TRIM(email) != '' AND email LIKE '%@%'
  LOOP
    PERFORM public.sync_user_to_auth(k.email, 'pmii1960', k.name, k.role, k.commissariat);
  END LOOP;
END;
$$;
