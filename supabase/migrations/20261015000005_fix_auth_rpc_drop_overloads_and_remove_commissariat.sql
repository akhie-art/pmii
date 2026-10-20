-- ==============================================================================
-- Migration: Fix create_auth_user and update_auth_user RPC functions
-- File: supabase/migrations/20261015000005_fix_auth_rpc_drop_overloads_and_remove_commissariat.sql
-- Deskripsi:
-- 1. Menghapus overload fungsi lama create_auth_user dengan 7 parameter agar tidak ambigu.
-- 2. Menghapus referensi kolom 'commissariat' pada INSERT/UPDATE public.anggota
--    karena kolom tersebut telah dihapus pada migrasi sebelumnya (kini murni tenant_id).
-- ==============================================================================

-- 1. Drop signature 7 parameter lama yang menyebabkan ambiguitas PostgREST
DROP FUNCTION IF EXISTS public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

-- 2. Perbarui create_auth_user tunggal (8 parameter)
CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'pengurus',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  p_status TEXT DEFAULT 'AKTIF',
  p_allowed_menus JSONB DEFAULT '[]'::jsonb,
  p_komisariat_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_resolved_tenant_id UUID := p_komisariat_id;
  v_resolved_role_id UUID;
  v_resolved_role_code TEXT;
  v_resolved_role_name TEXT;
  v_default_menus JSONB;
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Format email tidak valid: %', p_email;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'Email % sudah terdaftar dalam sistem.', v_clean_email;
  END IF;

  -- 1. Cari tenant_id jika tidak diberikan
  IF v_resolved_tenant_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_tenant_id 
    FROM public.tenant 
    WHERE name = p_commissariat 
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(p_commissariat, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
  END IF;

  -- 2. Cari role dari tabel public.roles
  SELECT id, code, allowed_menus 
  INTO v_resolved_role_id, v_resolved_role_code, v_default_menus
  FROM public.roles
  WHERE code = LOWER(TRIM(p_role))
     OR id::text = p_role
     OR (LOWER(TRIM(p_role)) IN ('super_admin', 'super admin') AND code = 'superadmin')
     OR (LOWER(TRIM(p_role)) IN ('pc', 'cabang', 'pengurus cabang') AND code = 'admin')
     OR (LOWER(TRIM(p_role)) IN ('pk', 'komisariat', 'pengurus komisariat') AND code = 'pengurus')
     OR (LOWER(TRIM(p_role)) = 'calon' AND code = 'peserta')
  LIMIT 1;

  IF v_resolved_role_id IS NULL THEN
    v_resolved_role_id := 'b0000000-0000-0000-0000-000000000005'::uuid; -- default anggota
    v_resolved_role_code := 'anggota';
  END IF;

  v_resolved_role_name := v_resolved_role_code;

  IF p_allowed_menus IS NULL OR jsonb_array_length(p_allowed_menus) = 0 THEN
    p_allowed_menus := COALESCE(v_default_menus, '[]'::jsonb);
  END IF;

  BEGIN
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
  END;

  -- 3. Masukkan ke auth.users
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
      'role', v_resolved_role_code,
      'role_id', v_resolved_role_id,
      'role_name', v_resolved_role_name,
      'commissariat', COALESCE(p_commissariat, 'Ki Ageng Getas Pendawa'),
      'tenant_id', v_resolved_tenant_id,
      'komisariat_id', v_resolved_tenant_id,
      'status', COALESCE(p_status, 'AKTIF'),
      'allowedMenus', p_allowed_menus
    ),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- 4. Masukkan ke auth.identities
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
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_clean_email,
      'email_verified', true
    ),
    'email',
    v_clean_email,
    now(),
    now(),
    now()
  );

  -- 5. Masukkan ke public.anggota (MURNI menggunakan tenant_id, tanpa kolom commissariat yang telah di-drop)
  INSERT INTO public.anggota (
    id,
    user_id,
    name,
    email,
    role,
    role_id,
    tenant_id,
    status
  )
  VALUES (
    v_user_id,
    v_user_id,
    COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
    v_clean_email,
    v_resolved_role_code,
    v_resolved_role_id,
    v_resolved_tenant_id,
    COALESCE(p_status, 'AKTIF')
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      role = EXCLUDED.role,
      role_id = EXCLUDED.role_id,
      tenant_id = EXCLUDED.tenant_id,
      status = EXCLUDED.status;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'role', v_resolved_role_code,
    'role_id', v_resolved_role_id,
    'tenant_id', v_resolved_tenant_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO anon, authenticated, service_role;

-- 3. Perbarui update_auth_user (tanpa kolom commissariat pada public.anggota)
CREATE OR REPLACE FUNCTION public.update_auth_user(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_commissariat TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_allowed_menus JSONB DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_komisariat_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_new_meta JSONB;
  v_encrypted_pw TEXT;
  v_resolved_tenant_id UUID := p_komisariat_id;
  v_resolved_role_id UUID;
  v_resolved_role_code TEXT;
  v_resolved_role_name TEXT;
BEGIN
  SELECT * INTO v_user FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User dengan ID % tidak ditemukan.', p_user_id;
  END IF;

  -- 1. Resolusi tenant_id
  IF v_resolved_tenant_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_tenant_id 
    FROM public.tenant 
    WHERE name = p_commissariat 
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(p_commissariat, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
  END IF;

  -- 2. Resolusi role_id
  IF p_role IS NOT NULL THEN
    SELECT id, code 
    INTO v_resolved_role_id, v_resolved_role_code
    FROM public.roles
    WHERE code = LOWER(TRIM(p_role))
       OR id::text = p_role
       OR (LOWER(TRIM(p_role)) IN ('super_admin', 'super admin') AND code = 'superadmin')
       OR (LOWER(TRIM(p_role)) IN ('pc', 'cabang', 'pengurus cabang') AND code = 'admin')
       OR (LOWER(TRIM(p_role)) IN ('pk', 'komisariat', 'pengurus komisariat') AND code = 'pengurus')
       OR (LOWER(TRIM(p_role)) = 'calon' AND code = 'peserta')
    LIMIT 1;
    v_resolved_role_name := v_resolved_role_code;
  END IF;

  v_new_meta := COALESCE(v_user.raw_user_meta_data, '{}'::jsonb);

  IF p_name IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{name}', to_jsonb(p_name));
  END IF;
  IF v_resolved_role_code IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{role}', to_jsonb(v_resolved_role_code));
    v_new_meta := jsonb_set(v_new_meta, '{role_id}', to_jsonb(v_resolved_role_id));
    v_new_meta := jsonb_set(v_new_meta, '{role_name}', to_jsonb(v_resolved_role_name));
  ELSIF p_role IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{role}', to_jsonb(p_role));
  END IF;
  IF p_commissariat IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{commissariat}', to_jsonb(p_commissariat));
  END IF;
  IF v_resolved_tenant_id IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{tenant_id}', to_jsonb(v_resolved_tenant_id));
    v_new_meta := jsonb_set(v_new_meta, '{komisariat_id}', to_jsonb(v_resolved_tenant_id));
  END IF;
  IF p_status IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{status}', to_jsonb(p_status));
  END IF;
  IF p_allowed_menus IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{allowedMenus}', p_allowed_menus);
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = v_new_meta,
      banned_until = CASE WHEN p_status = 'NONAKTIF' THEN '2099-01-01'::timestamptz ELSE NULL END,
      updated_at = now()
  WHERE id = p_user_id;

  IF p_password IS NOT NULL AND length(p_password) >= 6 THEN
    BEGIN
      v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    END;

    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  -- Sinkronkan ke tabel public.anggota (tanpa kolom commissariat)
  UPDATE public.anggota
  SET name = COALESCE(p_name, name),
      role = COALESCE(v_resolved_role_code, p_role, role),
      role_id = COALESCE(v_resolved_role_id, role_id),
      tenant_id = COALESCE(v_resolved_tenant_id, tenant_id),
      status = COALESCE(p_status, status)
  WHERE id = p_user_id OR user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'role', COALESCE(v_resolved_role_code, p_role),
    'role_id', v_resolved_role_id,
    'tenant_id', v_resolved_tenant_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) TO anon, authenticated, service_role;
