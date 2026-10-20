-- Migration: Fix auth RPC functions to reference public.anggota instead of obsolete public.kader
-- Fixes error: relation "public.kader" does not exist

-- 1. Perbarui fungsi update_auth_user
CREATE OR REPLACE FUNCTION public.update_auth_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'anggota',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  p_status TEXT DEFAULT 'AKTIF',
  p_allowed_menus JSONB DEFAULT '[]'::jsonb,
  p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_hashed_password TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_password IS NOT NULL AND TRIM(p_password) != '' THEN
    BEGIN
      v_hashed_password := extensions.crypt(TRIM(p_password), extensions.gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_hashed_password := crypt(TRIM(p_password), gen_salt('bf'));
    END;
  END IF;

  UPDATE auth.users
  SET email = v_clean_email,
      encrypted_password = COALESCE(v_hashed_password, encrypted_password),
      banned_until = CASE WHEN p_status = 'NONAKTIF' THEN now() + INTERVAL '100 years' ELSE NULL END,
      raw_user_meta_data = jsonb_build_object(
        'name', p_name,
        'role', p_role,
        'commissariat', p_commissariat,
        'status', p_status,
        'allowedMenus', COALESCE(p_allowed_menus, '[]'::jsonb)
      ),
      updated_at = now()
  WHERE id = p_user_id;

  -- Update identitas login email jika ada
  UPDATE auth.identities
  SET identity_data = jsonb_build_object('sub', p_user_id::text, 'email', v_clean_email, 'email_verified', true),
      provider_id = v_clean_email,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Selaraskan juga email dan nama di tabel anggota jika tertaut
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota
    SET email = v_clean_email,
        name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name) ELSE name END
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;


-- 2. Perbarui fungsi sync_user_to_auth
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
  v_encrypted_pw TEXT;
  v_clean_email TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RETURN NULL;
  END IF;

  -- Cari user_id yang sudah ada di auth.users berdasarkan email
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  
  -- Jika belum ada di auth.users, cek apakah sudah ada user_id di tabel anggota
  IF v_user_id IS NULL AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    SELECT user_id INTO v_user_id FROM public.anggota WHERE LOWER(email) = v_clean_email AND user_id IS NOT NULL LIMIT 1;
  END IF;

  -- Jika masih null, buat UUID baru
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
  END IF;

  -- Hash password menggunakan blowfish
  BEGIN
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
  END;

  -- Upsert ke auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_clean_email,
    v_encrypted_pw,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'name', COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
      'role', COALESCE(p_role, 'anggota'),
      'commissariat', COALESCE(p_commissariat, 'Ki Ageng Getas Pendawa'),
      'status', 'AKTIF',
      'allowedMenus', CASE 
        WHEN p_role = 'admin' THEN '["/dashboard", "/dashboard/anggota", "/dashboard/pengurus", "/dashboard/kegiatan", "/dashboard/surat", "/dashboard/pengguna", "/dashboard/pengaturan"]'::jsonb
        WHEN p_role = 'instruktur' THEN '["/instruktur", "/instruktur/penilaian", "/instruktur/rekap-nilai", "/instruktur/materi", "/instruktur/kegiatan", "/instruktur/anggota", "/instruktur/profil"]'::jsonb
        WHEN p_role = 'pengurus' THEN '["/dashboard", "/dashboard/anggota", "/dashboard/pengurus", "/dashboard/kegiatan", "/dashboard/surat", "/dashboard/arsip"]'::jsonb
        ELSE '["/kader", "/kader/kegiatan", "/kader/materi", "/kader/profil", "/kader/laporan"]'::jsonb
      END
    ),
    'authenticated',
    'authenticated',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = v_encrypted_pw,
      email = v_clean_email,
      raw_user_meta_data = auth.users.raw_user_meta_data || jsonb_build_object(
        'name', COALESCE(NULLIF(p_name, ''), auth.users.raw_user_meta_data->>'name', split_part(v_clean_email, '@', 1)),
        'role', COALESCE(NULLIF(p_role, ''), auth.users.raw_user_meta_data->>'role', 'anggota'),
        'commissariat', COALESCE(NULLIF(p_commissariat, ''), auth.users.raw_user_meta_data->>'commissariat', 'Ki Ageng Getas Pendawa')
      ),
      updated_at = now();

  -- Upsert ke auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email, 'email_verified', true),
    'email',
    v_clean_email,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
  SET identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email, 'email_verified', true),
      updated_at = now();

  -- Tautkan relasi user_id ke tabel anggota
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota
    SET user_id = v_user_id
    WHERE LOWER(email) = v_clean_email;
  END IF;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_user_to_auth(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;


-- 3. Perbarui fungsi delete_user_from_auth
CREATE OR REPLACE FUNCTION public.delete_user_from_auth(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_target_id UUID := p_user_id;
  v_clean_email TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_target_id IS NULL AND (v_clean_email IS NULL OR v_clean_email = '') THEN
    RETURN FALSE;
  END IF;

  -- 1. Cari user_id di auth.users berdasarkan email jika p_user_id kosong atau belum valid
  IF v_target_id IS NULL AND v_clean_email IS NOT NULL THEN
    SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  END IF;

  -- Jika p_user_id diberikan tapi tidak ditemukan di auth.users, coba cari di anggota
  IF v_target_id IS NULL AND v_clean_email IS NOT NULL AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    SELECT user_id INTO v_target_id FROM public.anggota WHERE LOWER(email) = v_clean_email AND user_id IS NOT NULL LIMIT 1;
  END IF;

  IF v_target_id IS NULL THEN
    IF p_user_id IS NOT NULL THEN
      v_target_id := p_user_id;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  -- 2. Keamanan: Cegah penghapusan akun Master Administrator resmi
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_id AND LOWER(email) = 'admin@pmii.org') THEN
    RAISE NOTICE 'Master Administrator tidak dapat dihapus.';
    RETURN FALSE;
  END IF;

  -- 3. Hapus entri terkait di auth.identities
  DELETE FROM auth.identities WHERE user_id = v_target_id;

  -- 4. Lepaskan relasi user_id dari tabel anggota dan pengurus
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota SET user_id = NULL WHERE user_id = v_target_id;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pengurus') THEN
    UPDATE public.pengurus SET user_id = NULL WHERE user_id = v_target_id;
  END IF;

  -- 5. Hapus akun dari auth.users
  DELETE FROM auth.users WHERE id = v_target_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_from_auth(UUID, TEXT) TO anon, authenticated, service_role;
