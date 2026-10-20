-- ==============================================================================
-- Migration: Drop name, description, level, is_system from public.roles
-- File: supabase/migrations/20261020000001_drop_columns_from_roles.sql
-- ==============================================================================

-- 1. Drop dependent view first
DROP VIEW IF EXISTS public.role CASCADE;

-- 2. Drop the 4 requested columns from public.roles
ALTER TABLE public.roles 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS level,
  DROP COLUMN IF EXISTS is_system;

-- 3. Recreate view public.role for compatibility
CREATE OR REPLACE VIEW public.role AS SELECT * FROM public.roles;

-- -------------------------------------------------------------
-- 4. Update create_auth_user (tanpa kolom name pada public.roles)
-- -------------------------------------------------------------
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

  -- 2. Cari role dari tabel public.roles (murni menggunakan code & allowed_menus)
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

  -- 5. Masukkan ke public.anggota
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

-- -------------------------------------------------------------
-- 5. Update update_auth_user (tanpa kolom name pada public.roles)
-- -------------------------------------------------------------
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

  -- 2. Resolusi role_id (tanpa kolom name)
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
  END IF;

  v_resolved_role_name := v_resolved_role_code;
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

  -- Sinkronkan ke tabel public.anggota
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

-- -------------------------------------------------------------
-- 6. Update get_auth_users (tanpa kolom name/level pada public.roles)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'user_id', u.id,
      'email', u.email,
      'createdAt', u.created_at,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'name', COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', a.name, split_part(u.email, '@', 1)),
      'role', COALESCE(r.code, u.raw_user_meta_data->>'role', a.role, 'anggota'),
      'role_id', COALESCE(a.role_id, (u.raw_user_meta_data->>'role_id')::uuid, r.id),
      'role_name', COALESCE(u.raw_user_meta_data->>'role_name', r.code, 'Anggota / Kader'),
      'commissariat', COALESCE(u.raw_user_meta_data->>'commissariat', a.commissariat, 'Ki Ageng Getas Pendawa'),
      'tenant_id', COALESCE(a.tenant_id, (u.raw_user_meta_data->>'tenant_id')::uuid),
      'komisariat_id', COALESCE(a.tenant_id, (u.raw_user_meta_data->>'komisariat_id')::uuid),
      'status', CASE 
        WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'NONAKTIF'
        ELSE COALESCE(u.raw_user_meta_data->>'status', a.status, 'AKTIF')
      END,
      'allowedMenus', COALESCE(u.raw_user_meta_data->'allowedMenus', r.allowed_menus, '[]'::jsonb),
      'avatar', COALESCE(u.raw_user_meta_data->>'avatar', u.raw_user_meta_data->>'avatar_url', a.avatar, '')
    ) ORDER BY u.created_at DESC
  ), '[]'::jsonb) INTO result
  FROM auth.users u
  LEFT JOIN public.anggota a ON a.id = u.id OR a.user_id = u.id OR LOWER(a.email) = LOWER(u.email)
  LEFT JOIN public.roles r ON r.id = a.role_id OR r.code = LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', a.role)))
  WHERE u.deleted_at IS NULL;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users() TO anon, authenticated, service_role;
