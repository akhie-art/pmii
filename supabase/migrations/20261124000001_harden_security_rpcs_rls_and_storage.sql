-- ==============================================================================
-- Migration: Comprehensive Security Hardening (RPCs, RLS, Triggers, Storage)
-- File: supabase/migrations/20261124000001_harden_security_rpcs_rls_and_storage.sql
--
-- Ringkasan perbaikan:
-- 1. Hapus fungsi berbahaya clean_all_data_except_admin() dan sync_user_to_auth().
-- 2. Backfill raw_app_meta_data (tamper-proof) pada auth.users untuk role & tenant_id.
-- 3. Tambahkan helper otorisasi berbasis auth.uid() & raw_app_meta_data.
-- 4. Lindungi kolom sensitif public.anggota via trigger (anti privilege escalation).
-- 5. Kunci seluruh RPC admin (REVOKE anon + cek role/tenant di dalam fungsi).
-- 6. Sediakan RPC publik & self-service sempit yang aman (tanpa bocor PII).
-- 7. Kunci seluruh RLS 17 tabel public dengan prinsip least-privilege & tenant isolation.
-- 8. Perketat Storage RLS & tambahkan bucket private-docs.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 1. HAPUS FUNGSI BERBAHAYA & OVERLOAD LAMA
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.clean_all_data_except_admin();
DROP FUNCTION IF EXISTS public.sync_user_to_auth(TEXT, TEXT, TEXT, TEXT, TEXT);

DROP FUNCTION IF EXISTS public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID);
DROP FUNCTION IF EXISTS public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID);
DROP FUNCTION IF EXISTS public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID);
DROP FUNCTION IF EXISTS public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

-- ------------------------------------------------------------------------------
-- 2. BACKFILL raw_app_meta_data YANG TIDAK BISA DIMODIFIKASI USER KLIEN
-- ------------------------------------------------------------------------------
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', CASE
    WHEN LOWER(u.email) = 'admin@pmii.org' THEN 'superadmin'
    ELSE LOWER(TRIM(COALESCE(
      NULLIF(u.raw_app_meta_data->>'role', ''),
      r.code,
      NULLIF(a.role, ''),
      NULLIF(u.raw_user_meta_data->>'role', ''),
      'anggota'
    )))
  END,
  'role_id', COALESCE(
    CASE WHEN (u.raw_app_meta_data->>'role_id') ~ '^[0-9a-fA-F-]{36}$' THEN u.raw_app_meta_data->>'role_id' END,
    a.role_id::text,
    r.id::text
  ),
  'tenant_id', COALESCE(
    CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN u.raw_app_meta_data->>'tenant_id' END,
    a.tenant_id::text,
    CASE WHEN (u.raw_user_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN u.raw_user_meta_data->>'tenant_id' END,
    CASE WHEN (u.raw_user_meta_data->>'komisariat_id') ~ '^[0-9a-fA-F-]{36}$' THEN u.raw_user_meta_data->>'komisariat_id' END
  ),
  'status', CASE
    WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'NONAKTIF'
    ELSE COALESCE(NULLIF(u.raw_app_meta_data->>'status', ''), NULLIF(u.raw_user_meta_data->>'status', ''), NULLIF(a.status, ''), 'AKTIF')
  END,
  'allowedMenus', COALESCE(
    u.raw_app_meta_data->'allowedMenus',
    u.raw_user_meta_data->'allowedMenus',
    r.allowed_menus,
    '[]'::jsonb
  )
)
FROM (
  SELECT
    u2.id AS uid,
    a2.role,
    a2.role_id,
    a2.tenant_id,
    a2.status
  FROM auth.users u2
  LEFT JOIN LATERAL (
    SELECT role, role_id, tenant_id, status
    FROM public.anggota
    WHERE id = u2.id OR user_id = u2.id OR LOWER(email) = LOWER(u2.email)
    LIMIT 1
  ) a2 ON true
) a
LEFT JOIN public.roles r
  ON r.id = a.role_id
  OR r.code = LOWER(TRIM(COALESCE(a.role, '')))
WHERE u.id = a.uid;

-- ------------------------------------------------------------------------------
-- 3. HELPER OTORISASI BERBASIS SERVER (TAMPER-PROOF)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT LOWER(TRIM(email))
  FROM auth.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'anon';
  END IF;

  -- 1. Prioritaskan raw_app_meta_data (tidak dapat diubah oleh klien via auth.updateUser)
  SELECT LOWER(TRIM(COALESCE(raw_app_meta_data->>'role', '')))
  INTO v_role
  FROM auth.users
  WHERE id = v_uid
  LIMIT 1;

  IF v_role IS NOT NULL AND v_role <> '' THEN
    RETURN v_role;
  END IF;

  -- 2. Fallback ke tabel anggota + roles
  SELECT LOWER(TRIM(COALESCE(r.code, a.role, 'anggota')))
  INTO v_role
  FROM public.anggota a
  LEFT JOIN public.roles r ON r.id = a.role_id
  WHERE a.id = v_uid OR a.user_id = v_uid
  LIMIT 1;

  RETURN COALESCE(NULLIF(v_role, ''), 'anggota');
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tid_text TEXT;
  v_tid UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT raw_app_meta_data->>'tenant_id'
  INTO v_tid_text
  FROM auth.users
  WHERE id = v_uid
  LIMIT 1;

  IF v_tid_text IS NOT NULL AND v_tid_text ~ '^[0-9a-fA-F-]{36}$' THEN
    RETURN v_tid_text::uuid;
  END IF;

  SELECT a.tenant_id
  INTO v_tid
  FROM public.anggota a
  WHERE a.id = v_uid OR a.user_id = v_uid
  LIMIT 1;

  RETURN v_tid;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.current_user_role() IN ('superadmin', 'super_admin', 'super admin');
$$;

CREATE OR REPLACE FUNCTION public.is_cabang_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.current_user_role() IN (
    'superadmin', 'super_admin', 'super admin',
    'admin', 'cabang', 'pc',
    'ketua_cabang', 'ketua cabang',
    'pengurus_cabang', 'pengurus cabang'
  ) OR public.current_user_role() LIKE '%cabang%';
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_cabang_admin()
    OR public.current_user_role() IN (
      'pengurus', 'komisariat', 'pk',
      'ketua_komisariat', 'ketua komisariat',
      'pengurus_komisariat', 'pengurus komisariat',
      'instruktur'
    )
    OR public.current_user_role() LIKE '%pengurus%'
    OR public.current_user_role() LIKE '%komisariat%'
    OR public.current_user_role() LIKE '%instruktur%';
$$;

CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_cabang_admin()
    OR (p_tenant_id IS NOT NULL AND p_tenant_id = public.current_user_tenant_id());
$$;

CREATE OR REPLACE FUNCTION public.can_read_tenant_or_cabang(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_cabang_admin()
    OR p_tenant_id IS NULL
    OR p_tenant_id = public.current_user_tenant_id()
    OR EXISTS (
      SELECT 1 FROM public.tenant t
      WHERE t.id = p_tenant_id
        AND (
          UPPER(COALESCE(t.level, '')) = 'CABANG'
          OR UPPER(COALESCE(t.type, '')) = 'CABANG'
          OR LOWER(COALESCE(t.name, '')) LIKE '%cabang%'
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_own_anggota_id(p_cadre_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    p_cadre_id = auth.uid()::text
    OR LOWER(COALESCE(p_cadre_id, '')) = COALESCE(public.current_user_email(), '__none__')
    OR EXISTS (
      SELECT 1 FROM public.anggota a
      WHERE a.id::text = p_cadre_id
        AND (
          a.id = auth.uid()
          OR a.user_id = auth.uid()
          OR (a.email IS NOT NULL AND LOWER(a.email) = public.current_user_email())
        )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_cabang_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_tenant(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_tenant_or_cabang(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_own_anggota_id(TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. TRIGGER PROTEKSI KOLOM SENSITIF PADA public.anggota
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_anggota_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT code INTO NEW.role FROM public.roles WHERE id = NEW.role_id;
  ELSIF NEW.role IS NOT NULL THEN
    SELECT id INTO NEW.role_id
    FROM public.roles
    WHERE code = LOWER(TRIM(NEW.role))
       OR (LOWER(TRIM(NEW.role)) IN ('super_admin', 'super admin') AND code = 'superadmin')
       OR (LOWER(TRIM(NEW.role)) IN ('pc', 'cabang', 'pengurus cabang') AND code = 'admin')
       OR (LOWER(TRIM(NEW.role)) IN ('pk', 'komisariat', 'pengurus komisariat') AND code = 'pengurus')
       OR (LOWER(TRIM(NEW.role)) = 'calon' AND code = 'peserta')
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_anggota_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Izinkan operasi internal dari RPC SECURITY DEFINER tepercaya atau service_role/migrasi
  IF current_setting('pmii.internal_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') AND auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_caller_role := public.current_user_role();

    -- Anggota / peserta biasa tidak boleh mengubah kolom hak akses / kelulusan
    IF NOT public.is_staff() THEN
      IF TG_OP = 'INSERT' THEN
        NEW.user_id := auth.uid();
        IF LOWER(COALESCE(NEW.role, '')) NOT IN ('peserta', 'anggota') THEN
          NEW.role := 'peserta';
        END IF;
        NEW.role_id := NULL;
        NEW."isGraduated" := false;
      ELSIF TG_OP = 'UPDATE' THEN
        NEW.role := OLD.role;
        NEW.role_id := OLD.role_id;
        NEW.status := OLD.status;
        NEW."isGraduated" := OLD."isGraduated";
        NEW.level := OLD.level;
        IF OLD.tenant_id IS NOT NULL THEN
          NEW.tenant_id := OLD.tenant_id;
        END IF;
      END IF;
    -- Staf komisariat tidak boleh menaikkan role ke level Cabang / Superadmin
    ELSIF NOT public.is_cabang_admin() THEN
      IF LOWER(COALESCE(NEW.role, '')) IN (
        'superadmin', 'super_admin', 'super admin',
        'admin', 'cabang', 'pc', 'ketua_cabang', 'pengurus_cabang'
      ) OR LOWER(COALESCE(NEW.role, '')) LIKE '%cabang%' THEN
        RAISE EXCEPTION 'Akses ditolak: Pengurus komisariat tidak dapat menetapkan peran level Cabang atau Superadmin.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_anggota_privileged_columns ON public.anggota;
CREATE TRIGGER trg_protect_anggota_privileged_columns
BEFORE INSERT OR UPDATE ON public.anggota
FOR EACH ROW
EXECUTE FUNCTION public.protect_anggota_privileged_columns();

-- ------------------------------------------------------------------------------
-- 5. PERKERAS SELURUH RPC MANAJEMEN USER (REVOKE anon + GUARD ROLE/TENANT)
-- ------------------------------------------------------------------------------

-- 5a. get_auth_users()
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_cabang BOOLEAN := false;
  v_is_staff BOOLEAN := false;
  v_my_tenant UUID;
  result JSONB;
BEGIN
  IF v_uid IS NULL AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Login diperlukan.';
  END IF;

  IF v_uid IS NULL THEN
    v_is_cabang := true;
    v_is_staff := true;
  ELSE
    v_is_cabang := public.is_cabang_admin();
    v_is_staff := public.is_staff();
    v_my_tenant := public.current_user_tenant_id();
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'user_id', u.id,
      'email', u.email,
      'createdAt', u.created_at,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'name', COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', a.name, split_part(u.email, '@', 1)),
      'role', COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), r.code, a.role, u.raw_user_meta_data->>'role', 'anggota'),
      'role_id', COALESCE(
        CASE WHEN (u.raw_app_meta_data->>'role_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'role_id')::uuid END,
        a.role_id,
        r.id
      ),
      'role_name', COALESCE(u.raw_user_meta_data->>'role_name', NULLIF(u.raw_app_meta_data->>'role', ''), r.code, 'Anggota / Kader'),
      'commissariat', COALESCE(t.name, u.raw_user_meta_data->>'commissariat', NULL),
      'tenant_id', COALESCE(
        CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
        a.tenant_id,
        t.id
      ),
      'komisariat_id', COALESCE(
        CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
        a.tenant_id,
        t.id
      ),
      'needsOnboarding', CASE
        WHEN COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), r.code, a.role, 'anggota') = 'superadmin' THEN false
        WHEN a.id IS NOT NULL AND (a.tenant_id IS NOT NULL OR t.name IS NOT NULL) THEN false
        WHEN (u.raw_app_meta_data->>'tenant_id') IS NOT NULL THEN false
        ELSE true
      END,
      'status', CASE
        WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'NONAKTIF'
        ELSE COALESCE(NULLIF(u.raw_app_meta_data->>'status', ''), u.raw_user_meta_data->>'status', a.status, 'AKTIF')
      END,
      'allowedMenus', COALESCE(u.raw_app_meta_data->'allowedMenus', u.raw_user_meta_data->'allowedMenus', r.allowed_menus, '[]'::jsonb),
      'avatar', COALESCE(a.avatar, u.raw_user_meta_data->>'avatar', u.raw_user_meta_data->>'avatar_url', '')
    ) ORDER BY u.created_at DESC
  ), '[]'::jsonb) INTO result
  FROM auth.users u
  LEFT JOIN LATERAL (
    SELECT id, name, role, role_id, tenant_id, status, avatar
    FROM public.anggota
    WHERE id = u.id OR user_id = u.id OR LOWER(email) = LOWER(u.email)
    LIMIT 1
  ) a ON true
  LEFT JOIN public.tenant t ON t.id = COALESCE(
    CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
    a.tenant_id
  )
  LEFT JOIN public.roles r ON r.id = a.role_id OR r.code = LOWER(TRIM(COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), a.role)))
  WHERE u.deleted_at IS NULL
    AND (
      v_is_cabang
      OR (v_is_staff AND (u.id = v_uid OR COALESCE(
            CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
            a.tenant_id
          ) = v_my_tenant))
      OR (NOT v_is_staff AND u.id = v_uid)
    );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_auth_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_users() TO authenticated, service_role;

-- 5b. create_auth_user(...)
CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'pengurus',
  p_commissariat TEXT DEFAULT '',
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
  v_caller_uid UUID := auth.uid();
  v_is_service BOOLEAN := (v_caller_uid IS NULL AND current_user IN ('postgres', 'supabase_admin', 'service_role'));
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_resolved_tenant_id UUID := p_komisariat_id;
  v_resolved_tenant_name TEXT := NULLIF(TRIM(p_commissariat), '');
  v_resolved_role_id UUID;
  v_resolved_role_code TEXT;
  v_default_menus JSONB;
BEGIN
  IF NOT v_is_service THEN
    IF v_caller_uid IS NULL OR NOT public.is_staff() THEN
      RAISE EXCEPTION 'Forbidden: Hanya pengurus/admin terautentikasi yang dapat membuat akun.';
    END IF;
  END IF;

  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Format email tidak valid: %', p_email;
  END IF;

  IF p_password IS NULL OR LENGTH(TRIM(p_password)) < 6 THEN
    RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'Email % sudah terdaftar dalam sistem.', v_clean_email;
  END IF;

  -- Resolusi role
  SELECT id, code, allowed_menus
  INTO v_resolved_role_id, v_resolved_role_code, v_default_menus
  FROM public.roles
  WHERE code = LOWER(TRIM(p_role))
     OR id::text = p_role
     OR (LOWER(TRIM(p_role)) IN ('super_admin', 'super admin') AND code = 'superadmin')
     OR (LOWER(TRIM(p_role)) IN ('pc', 'cabang', 'pengurus cabang') AND code = 'admin')
     OR (LOWER(TRIM(p_role)) IN ('pk', 'komisariat', 'pengurus komisariat') AND code = 'pengurus')
     OR (LOWER(TRIM(p_role)) IN ('ketua cabang', 'ketua_cabang') AND code = 'ketua_cabang')
     OR (LOWER(TRIM(p_role)) IN ('ketua komisariat', 'ketua_komisariat') AND code = 'ketua_komisariat')
     OR (LOWER(TRIM(p_role)) IN ('pengurus cabang', 'pengurus_cabang') AND code = 'pengurus_cabang')
     OR (LOWER(TRIM(p_role)) IN ('pengurus komisariat', 'pengurus_komisariat') AND code = 'pengurus_komisariat')
     OR (LOWER(TRIM(p_role)) = 'calon' AND code = 'peserta')
  LIMIT 1;

  IF v_resolved_role_id IS NULL THEN
    v_resolved_role_id := 'b0000000-0000-0000-0000-000000000005'::uuid;
    v_resolved_role_code := 'anggota';
  END IF;

  -- Cegah eskalasi hak akses oleh staf non-cabang / non-superadmin
  IF NOT v_is_service THEN
    IF v_resolved_role_code = 'superadmin' AND NOT public.is_superadmin() THEN
      RAISE EXCEPTION 'Forbidden: Hanya Superadmin yang dapat membuat akun Superadmin.';
    END IF;
    IF NOT public.is_cabang_admin() THEN
      IF v_resolved_role_code IN ('superadmin', 'admin', 'ketua_cabang', 'pengurus_cabang') OR v_resolved_role_code LIKE '%cabang%' THEN
        RAISE EXCEPTION 'Forbidden: Pengurus komisariat tidak dapat membuat akun level Cabang/Admin.';
      END IF;
      v_resolved_tenant_id := public.current_user_tenant_id();
    END IF;
  END IF;

  -- Validasi tenant_id
  IF v_resolved_tenant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tenant WHERE id = v_resolved_tenant_id) THEN
    v_resolved_tenant_id := NULL;
  END IF;

  IF v_resolved_tenant_id IS NULL AND v_resolved_tenant_name IS NOT NULL THEN
    SELECT id INTO v_resolved_tenant_id
    FROM public.tenant
    WHERE name = v_resolved_tenant_name
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(v_resolved_tenant_name, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
  END IF;

  IF v_resolved_tenant_id IS NULL AND (
    v_resolved_role_code IN ('admin', 'superadmin', 'ketua_cabang', 'pengurus_cabang')
    OR v_resolved_role_code LIKE '%cabang%'
  ) THEN
    SELECT id INTO v_resolved_tenant_id
    FROM public.tenant
    WHERE UPPER(COALESCE(level, '')) = 'CABANG' OR UPPER(COALESCE(type, '')) = 'CABANG' OR name ILIKE '%cabang%'
    LIMIT 1;
  END IF;

  IF v_resolved_tenant_id IS NULL THEN
    SELECT id INTO v_resolved_tenant_id FROM public.tenant LIMIT 1;
  END IF;

  SELECT name INTO v_resolved_tenant_name FROM public.tenant WHERE id = v_resolved_tenant_id;

  IF p_allowed_menus IS NULL OR jsonb_array_length(p_allowed_menus) = 0 THEN
    p_allowed_menus := COALESCE(v_default_menus, '[]'::jsonb);
  END IF;

  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_clean_email,
    v_encrypted_pw,
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', v_resolved_role_code,
      'role_id', v_resolved_role_id::text,
      'tenant_id', v_resolved_tenant_id::text,
      'status', COALESCE(p_status, 'AKTIF'),
      'allowedMenus', p_allowed_menus
    ),
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_clean_email,
      'name', COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
      'role', v_resolved_role_code,
      'role_id', v_resolved_role_id,
      'role_name', v_resolved_role_code,
      'commissariat', COALESCE(v_resolved_tenant_name, ''),
      'tenant_id', v_resolved_tenant_id,
      'komisariat_id', v_resolved_tenant_id,
      'status', COALESCE(p_status, 'AKTIF'),
      'allowedMenus', p_allowed_menus
    ),
    'authenticated', 'authenticated', now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email, 'email_verified', true),
    'email', v_clean_email, now(), now(), now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  INSERT INTO public.anggota (id, user_id, name, email, role, role_id, tenant_id, status)
  VALUES (
    v_user_id, v_user_id,
    COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
    v_clean_email, v_resolved_role_code, v_resolved_role_id, v_resolved_tenant_id,
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
    'id', v_user_id,
    'user_id', v_user_id,
    'email', v_clean_email,
    'name', COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
    'role', v_resolved_role_code,
    'role_id', v_resolved_role_id,
    'tenant_id', v_resolved_tenant_id,
    'komisariat_id', v_resolved_tenant_id,
    'commissariat', COALESCE(v_resolved_tenant_name, ''),
    'status', COALESCE(p_status, 'AKTIF'),
    'allowed_menus', p_allowed_menus
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;

-- 5c. update_auth_user(...)
CREATE OR REPLACE FUNCTION public.update_auth_user(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
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
  v_caller_uid UUID := auth.uid();
  v_is_service BOOLEAN := (v_caller_uid IS NULL AND current_user IN ('postgres', 'supabase_admin', 'service_role'));
  v_caller_is_staff BOOLEAN := false;
  v_caller_is_cabang BOOLEAN := false;
  v_caller_is_super BOOLEAN := false;
  v_user RECORD;
  v_target_role TEXT;
  v_target_tenant UUID;
  v_new_meta JSONB;
  v_new_app_meta JSONB;
  v_resolved_tenant_id UUID := p_komisariat_id;
  v_resolved_role_id UUID;
  v_resolved_role_code TEXT;
  v_encrypted_pw TEXT;
BEGIN
  IF NOT v_is_service THEN
    IF v_caller_uid IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: Login diperlukan.';
    END IF;
    v_caller_is_staff := public.is_staff();
    v_caller_is_cabang := public.is_cabang_admin();
    v_caller_is_super := public.is_superadmin();

    IF NOT v_caller_is_staff AND p_user_id <> v_caller_uid THEN
      RAISE EXCEPTION 'Forbidden: Anda hanya dapat mengubah akun Anda sendiri.';
    END IF;
  ELSE
    v_caller_is_staff := true;
    v_caller_is_cabang := true;
    v_caller_is_super := true;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User dengan ID % tidak ditemukan.', p_user_id;
  END IF;

  v_target_role := LOWER(TRIM(COALESCE(NULLIF(v_user.raw_app_meta_data->>'role', ''), v_user.raw_user_meta_data->>'role', 'anggota')));
  v_target_tenant := CASE WHEN (v_user.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (v_user.raw_app_meta_data->>'tenant_id')::uuid ELSE NULL END;

  -- Proteksi hirarki untuk staf komisariat
  IF v_caller_is_staff AND NOT v_caller_is_cabang THEN
    IF v_target_role IN ('superadmin', 'admin', 'ketua_cabang', 'pengurus_cabang') OR v_target_role LIKE '%cabang%' THEN
      RAISE EXCEPTION 'Forbidden: Pengurus komisariat tidak dapat mengubah akun Cabang/Superadmin.';
    END IF;
    IF p_user_id <> v_caller_uid AND v_target_tenant IS NOT NULL AND v_target_tenant <> public.current_user_tenant_id() THEN
      RAISE EXCEPTION 'Forbidden: Akun berada di luar komisariat Anda.';
    END IF;
  END IF;

  IF v_target_role = 'superadmin' AND NOT v_caller_is_super AND p_user_id <> v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: Hanya Superadmin yang dapat mengubah akun Superadmin lain.';
  END IF;

  -- Jika pemanggil BUKAN staf, abaikan perubahan hak akses (hanya boleh ubah nama/email/password sendiri)
  IF NOT v_caller_is_staff THEN
    p_role := NULL;
    p_status := NULL;
    p_allowed_menus := NULL;
    p_komisariat_id := NULL;
    p_commissariat := NULL;
    v_resolved_tenant_id := NULL;
  END IF;

  -- Validasi tenant_id
  IF v_resolved_tenant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tenant WHERE id = v_resolved_tenant_id) THEN
    v_resolved_tenant_id := NULL;
  END IF;

  IF v_resolved_tenant_id IS NULL AND p_commissariat IS NOT NULL AND TRIM(p_commissariat) <> '' THEN
    SELECT id INTO v_resolved_tenant_id
    FROM public.tenant
    WHERE name = p_commissariat
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(p_commissariat, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
  END IF;

  -- Resolusi role_id
  IF p_role IS NOT NULL AND TRIM(p_role) <> '' THEN
    SELECT id, code INTO v_resolved_role_id, v_resolved_role_code
    FROM public.roles
    WHERE code = LOWER(TRIM(p_role))
       OR id::text = p_role
       OR (LOWER(TRIM(p_role)) IN ('super_admin', 'super admin') AND code = 'superadmin')
       OR (LOWER(TRIM(p_role)) IN ('pc', 'cabang', 'pengurus cabang') AND code = 'admin')
       OR (LOWER(TRIM(p_role)) IN ('pk', 'komisariat', 'pengurus komisariat') AND code = 'pengurus')
       OR (LOWER(TRIM(p_role)) IN ('ketua cabang', 'ketua_cabang') AND code = 'ketua_cabang')
       OR (LOWER(TRIM(p_role)) IN ('ketua komisariat', 'ketua_komisariat') AND code = 'ketua_komisariat')
       OR (LOWER(TRIM(p_role)) IN ('pengurus cabang', 'pengurus_cabang') AND code = 'pengurus_cabang')
       OR (LOWER(TRIM(p_role)) IN ('pengurus komisariat', 'pengurus_komisariat') AND code = 'pengurus_komisariat')
       OR (LOWER(TRIM(p_role)) = 'calon' AND code = 'peserta')
    LIMIT 1;

    IF v_resolved_role_code = 'superadmin' AND NOT v_caller_is_super THEN
      RAISE EXCEPTION 'Forbidden: Hanya Superadmin yang dapat menetapkan role Superadmin.';
    END IF;
    IF NOT v_caller_is_cabang AND (v_resolved_role_code IN ('superadmin', 'admin', 'ketua_cabang', 'pengurus_cabang') OR v_resolved_role_code LIKE '%cabang%') THEN
      RAISE EXCEPTION 'Forbidden: Pengurus komisariat tidak dapat menaikkan role ke level Cabang/Admin.';
    END IF;
  END IF;

  v_new_meta := COALESCE(v_user.raw_user_meta_data, '{}'::jsonb);
  v_new_app_meta := COALESCE(v_user.raw_app_meta_data, '{}'::jsonb);

  IF p_name IS NOT NULL AND TRIM(p_name) <> '' THEN
    v_new_meta := jsonb_set(v_new_meta, '{name}', to_jsonb(TRIM(p_name)));
  END IF;
  IF v_resolved_role_code IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{role}', to_jsonb(v_resolved_role_code));
    v_new_meta := jsonb_set(v_new_meta, '{role_name}', to_jsonb(v_resolved_role_code));
    v_new_app_meta := jsonb_set(v_new_app_meta, '{role}', to_jsonb(v_resolved_role_code));
  END IF;
  IF v_resolved_role_id IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{role_id}', to_jsonb(v_resolved_role_id::text));
    v_new_app_meta := jsonb_set(v_new_app_meta, '{role_id}', to_jsonb(v_resolved_role_id::text));
  END IF;
  IF p_commissariat IS NOT NULL AND TRIM(p_commissariat) <> '' THEN
    v_new_meta := jsonb_set(v_new_meta, '{commissariat}', to_jsonb(TRIM(p_commissariat)));
  END IF;
  IF v_resolved_tenant_id IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{tenant_id}', to_jsonb(v_resolved_tenant_id::text));
    v_new_meta := jsonb_set(v_new_meta, '{komisariat_id}', to_jsonb(v_resolved_tenant_id::text));
    v_new_app_meta := jsonb_set(v_new_app_meta, '{tenant_id}', to_jsonb(v_resolved_tenant_id::text));
  END IF;
  IF p_allowed_menus IS NOT NULL THEN
    v_new_meta := jsonb_set(v_new_meta, '{allowedMenus}', p_allowed_menus);
    v_new_app_meta := jsonb_set(v_new_app_meta, '{allowedMenus}', p_allowed_menus);
  END IF;
  IF p_status IS NOT NULL AND TRIM(p_status) <> '' THEN
    v_new_meta := jsonb_set(v_new_meta, '{status}', to_jsonb(p_status));
    v_new_app_meta := jsonb_set(v_new_app_meta, '{status}', to_jsonb(p_status));
  END IF;

  IF p_password IS NOT NULL AND TRIM(p_password) <> '' THEN
    IF LENGTH(TRIM(p_password)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
    END IF;
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
    UPDATE auth.users SET encrypted_password = v_encrypted_pw WHERE id = p_user_id;
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = v_new_meta,
      raw_app_meta_data = v_new_app_meta,
      email = COALESCE(NULLIF(LOWER(TRIM(p_email)), ''), email),
      banned_until = CASE
        WHEN p_status = 'NONAKTIF' THEN now() + INTERVAL '100 years'
        WHEN p_status = 'AKTIF' THEN NULL
        ELSE banned_until
      END,
      updated_at = now()
  WHERE id = p_user_id;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  UPDATE public.anggota
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      email = COALESCE(NULLIF(LOWER(TRIM(p_email)), ''), email),
      role = COALESCE(v_resolved_role_code, role),
      role_id = COALESCE(v_resolved_role_id, role_id),
      tenant_id = COALESCE(v_resolved_tenant_id, tenant_id),
      status = COALESCE(NULLIF(TRIM(p_status), ''), status)
  WHERE id = p_user_id OR user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', COALESCE(NULLIF(LOWER(TRIM(p_email)), ''), v_user.email),
    'role', COALESCE(v_resolved_role_code, v_target_role),
    'tenant_id', COALESCE(v_resolved_tenant_id, v_target_tenant)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) TO authenticated, service_role;

-- 5d. delete_user_from_auth & delete_users_from_auth
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
  v_caller_uid UUID := auth.uid();
  v_is_service BOOLEAN := (v_caller_uid IS NULL AND current_user IN ('postgres', 'supabase_admin', 'service_role'));
  v_target_id UUID := p_user_id;
  v_clean_email TEXT;
  v_target_role TEXT;
  v_target_tenant UUID;
BEGIN
  IF NOT v_is_service THEN
    IF v_caller_uid IS NULL OR NOT public.is_staff() THEN
      RAISE EXCEPTION 'Forbidden: Hanya pengurus/admin yang dapat menghapus akun.';
    END IF;
  END IF;

  IF p_email IS NOT NULL AND TRIM(p_email) <> '' THEN
    v_clean_email := LOWER(TRIM(p_email));
  END IF;

  IF v_target_id IS NULL AND v_clean_email IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_target_id IS NULL AND v_clean_email IS NOT NULL THEN
    SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  END IF;

  IF v_target_id IS NULL AND v_clean_email IS NOT NULL THEN
    SELECT user_id INTO v_target_id FROM public.anggota WHERE LOWER(email) = v_clean_email AND user_id IS NOT NULL LIMIT 1;
  END IF;

  IF v_target_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Tidak boleh menghapus diri sendiri atau Master Admin
  IF v_caller_uid IS NOT NULL AND v_target_id = v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: Tidak dapat menghapus akun Anda sendiri.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_id AND LOWER(email) = 'admin@pmii.org') THEN
    RAISE EXCEPTION 'Master Administrator tidak dapat dihapus.';
  END IF;

  SELECT
    LOWER(TRIM(COALESCE(NULLIF(raw_app_meta_data->>'role', ''), raw_user_meta_data->>'role', 'anggota'))),
    CASE WHEN (raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (raw_app_meta_data->>'tenant_id')::uuid ELSE NULL END
  INTO v_target_role, v_target_tenant
  FROM auth.users
  WHERE id = v_target_id;

  IF NOT v_is_service THEN
    IF v_target_role = 'superadmin' AND NOT public.is_superadmin() THEN
      RAISE EXCEPTION 'Forbidden: Hanya Superadmin yang dapat menghapus Superadmin.';
    END IF;
    IF NOT public.is_cabang_admin() THEN
      IF v_target_role IN ('superadmin', 'admin', 'ketua_cabang', 'pengurus_cabang') OR v_target_role LIKE '%cabang%' THEN
        RAISE EXCEPTION 'Forbidden: Pengurus komisariat tidak dapat menghapus akun Cabang/Admin.';
      END IF;
      IF v_target_tenant IS NOT NULL AND v_target_tenant <> public.current_user_tenant_id() THEN
        RAISE EXCEPTION 'Forbidden: Akun berada di luar komisariat Anda.';
      END IF;
    END IF;
  END IF;

  DELETE FROM auth.identities WHERE user_id = v_target_id;
  UPDATE public.anggota SET user_id = NULL WHERE user_id = v_target_id;
  DELETE FROM auth.users WHERE id = v_target_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_from_auth(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_from_auth(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_users_from_auth(
  p_user_ids UUID[] DEFAULT '{}',
  p_emails TEXT[] DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_count INTEGER := 0;
  v_id UUID;
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Login diperlukan.';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Forbidden: Hanya pengurus/admin yang dapat menghapus akun.';
  END IF;

  IF p_user_ids IS NOT NULL THEN
    FOREACH v_id IN ARRAY p_user_ids LOOP
      IF v_id IS NOT NULL AND public.delete_user_from_auth(v_id, NULL) THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  IF p_emails IS NOT NULL THEN
    FOREACH v_email IN ARRAY p_emails LOOP
      IF v_email IS NOT NULL AND TRIM(v_email) <> '' AND public.delete_user_from_auth(NULL, v_email) THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_users_from_auth(UUID[], TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_users_from_auth(UUID[], TEXT[]) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. RPC PUBLIK & SELF-SERVICE SEMPIT YANG AMAN (ZERO PII LEAK)
-- ------------------------------------------------------------------------------

-- 6a. Profil otoritatif user yang sedang login (dibaca dari DB, bukan localStorage)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', u.id,
    'user_id', u.id,
    'anggota_id', a.id,
    'email', u.email,
    'name', COALESCE(a.name, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'role', COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), r.code, a.role, 'anggota'),
    'role_id', COALESCE(
      CASE WHEN (u.raw_app_meta_data->>'role_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'role_id')::uuid END,
      a.role_id,
      r.id
    ),
    'role_name', COALESCE(r.code, NULLIF(u.raw_app_meta_data->>'role', ''), a.role, 'anggota'),
    'tenant_id', COALESCE(
      CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
      a.tenant_id,
      t.id
    ),
    'komisariat_id', COALESCE(
      CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
      a.tenant_id,
      t.id
    ),
    'commissariat', COALESCE(t.name, ''),
    'status', CASE
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'NONAKTIF'
      ELSE COALESCE(NULLIF(u.raw_app_meta_data->>'status', ''), a.status, 'AKTIF')
    END,
    'needsOnboarding', CASE
      WHEN COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), r.code, a.role, 'anggota') = 'superadmin' THEN false
      WHEN a.id IS NOT NULL AND a.tenant_id IS NOT NULL THEN false
      WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN false
      ELSE true
    END,
    'allowedMenus', COALESCE(u.raw_app_meta_data->'allowedMenus', r.allowed_menus, '[]'::jsonb),
    'avatar', COALESCE(a.avatar, u.raw_user_meta_data->>'avatar', u.raw_user_meta_data->>'avatar_url', ''),
    'createdAt', u.created_at
  )
  INTO v_result
  FROM auth.users u
  LEFT JOIN LATERAL (
    SELECT id, name, role, role_id, tenant_id, status, avatar
    FROM public.anggota
    WHERE id = u.id OR user_id = u.id OR LOWER(email) = LOWER(u.email)
    LIMIT 1
  ) a ON true
  LEFT JOIN public.tenant t ON t.id = COALESCE(
    CASE WHEN (u.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (u.raw_app_meta_data->>'tenant_id')::uuid END,
    a.tenant_id
  )
  LEFT JOIN public.roles r ON r.id = a.role_id OR r.code = LOWER(TRIM(COALESCE(NULLIF(u.raw_app_meta_data->>'role', ''), a.role)))
  WHERE u.id = v_uid
    AND u.deleted_at IS NULL
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;

-- 6b. Resolusi identifier login (NIM / NIPA / username / nama) ke email untuk signInWithPassword
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean TEXT := LOWER(TRIM(COALESCE(p_identifier, '')));
  v_digits TEXT := regexp_replace(v_clean, '\D', '', 'g');
  v_email TEXT;
BEGIN
  IF LENGTH(v_clean) < 2 THEN
    RETURN NULL;
  END IF;

  IF v_clean = 'admin' THEN
    RETURN 'admin@pmii.org';
  END IF;

  IF POSITION('@' IN v_clean) > 0 THEN
    RETURN v_clean;
  END IF;

  -- 1. Cocokkan di public.anggota (nim, nipa, nta, nama persis, prefix email, atau 9 digit terakhir telepon)
  SELECT LOWER(TRIM(a.email))
  INTO v_email
  FROM public.anggota a
  WHERE a.email IS NOT NULL AND TRIM(a.email) <> ''
    AND (
      LOWER(TRIM(COALESCE(a.nim, ''))) = v_clean
      OR LOWER(TRIM(COALESCE(a.nipa, ''))) = v_clean
      OR LOWER(TRIM(COALESCE(a.nta, ''))) = v_clean
      OR LOWER(TRIM(COALESCE(a.name, ''))) = v_clean
      OR LOWER(split_part(a.email, '@', 1)) = v_clean
      OR (LENGTH(v_digits) >= 9 AND RIGHT(regexp_replace(COALESCE(a.phone, ''), '\D', '', 'g'), 9) = RIGHT(v_digits, 9))
    )
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. Cocokkan di auth.users (prefix email atau nama metadata)
  SELECT LOWER(TRIM(u.email))
  INTO v_email
  FROM auth.users u
  WHERE u.deleted_at IS NULL
    AND (
      LOWER(split_part(u.email, '@', 1)) = v_clean
      OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'name', ''))) = v_clean
    )
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated, service_role;

-- 6c. Statistik publik agregat (tanpa ekspos baris anggota)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_by_tenant JSONB;
BEGIN
  SELECT COUNT(*)::int INTO v_total FROM public.anggota;

  SELECT COALESCE(jsonb_object_agg(tenant_id::text, cnt), '{}'::jsonb)
  INTO v_by_tenant
  FROM (
    SELECT tenant_id, COUNT(*)::int AS cnt
    FROM public.anggota
    WHERE tenant_id IS NOT NULL
    GROUP BY tenant_id
  ) sub;

  RETURN jsonb_build_object(
    'cadresCount', COALESCE(v_total, 0),
    'tenantCounts', COALESCE(v_by_tenant, '{}'::jsonb),
    'stagesCount', 3,
    'digitalArchivePercent', 100
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;

-- 6d. Verifikasi anggota publik (hanya 4 field aman, maks 5 hasil, min 2 karakter)
CREATE OR REPLACE FUNCTION public.verify_anggota_public(p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q TEXT := LOWER(TRIM(COALESCE(p_query, '')));
  v_res JSONB;
BEGIN
  IF LENGTH(v_q) < 2 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(row_obj), '[]'::jsonb)
  INTO v_res
  FROM (
    SELECT jsonb_build_object(
      'name', a.name,
      'level', COALESCE(a.level, 'Anggota'),
      'commissariat', COALESCE(t.name, 'PC PMII Grobogan'),
      'status', COALESCE(a.status, 'Aktif')
    ) AS row_obj
    FROM public.anggota a
    LEFT JOIN public.tenant t ON t.id = a.tenant_id
    WHERE LOWER(COALESCE(a.name, '')) LIKE '%' || v_q || '%'
       OR LOWER(COALESCE(a.nim, '')) = v_q
       OR LOWER(COALESCE(a.nipa, '')) = v_q
       OR LOWER(a.id::text) = v_q
    ORDER BY a.name ASC
    LIMIT 5
  ) sub;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_anggota_public(TEXT) TO anon, authenticated, service_role;

-- 6e. Direktori avatar/gender pengurus publik (tanpa membocorkan seluruh tabel anggota)
CREATE OR REPLACE FUNCTION public.get_public_board_directory(p_tenant_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'pengurus_id', p.id,
      'anggota_id', p.anggota_id,
      'name', p.name,
      'avatar', COALESCE(NULLIF(p.avatar, ''), a.avatar, ''),
      'gender', COALESCE(a.gender, 'Laki-laki')
    )
  ), '[]'::jsonb)
  FROM public.pengurus p
  LEFT JOIN public.anggota a ON a.id = p.anggota_id OR LOWER(TRIM(a.name)) = LOWER(TRIM(p.name))
  WHERE p_tenant_id IS NULL OR p.tenant_id = p_tenant_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_board_directory(UUID) TO anon, authenticated, service_role;

-- 6f. Cek status akun & pendaftaran publik tanpa membocorkan PII
CREATE OR REPLACE FUNCTION public.check_registration_account(
  p_email TEXT,
  p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_exists BOOLEAN := false;
  v_reg RECORD;
BEGIN
  IF v_email = '' OR POSITION('@' IN v_email) = 0 THEN
    RETURN jsonb_build_object('accountExists', false, 'alreadyRegistered', false);
  END IF;

  SELECT (
    EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM public.anggota WHERE LOWER(email) = v_email)
  ) INTO v_exists;

  IF p_event_id IS NOT NULL AND TRIM(p_event_id) <> '' THEN
    SELECT id, status, "registrationNumber", "dateApplied"
    INTO v_reg
    FROM public.pendaftaran
    WHERE "eventId" = p_event_id
      AND LOWER("cadreEmail") = v_email
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'accountExists', v_exists,
    'alreadyRegistered', (v_reg.id IS NOT NULL),
    'registration', CASE WHEN v_reg.id IS NOT NULL THEN jsonb_build_object(
      'id', v_reg.id,
      'status', v_reg.status,
      'registrationNumber', v_reg."registrationNumber",
      'dateApplied', v_reg."dateApplied"
    ) ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_registration_account(TEXT, TEXT) TO anon, authenticated, service_role;

-- 6g. Submit pendaftaran kegiatan publik secara aman (atomik pendaftaran + evaluasi)
CREATE OR REPLACE FUNCTION public.submit_public_registration(
  p_event_id TEXT,
  p_cadre_name TEXT,
  p_cadre_email TEXT,
  p_phone TEXT DEFAULT '',
  p_level TEXT DEFAULT 'MAPABA',
  p_tenant_id UUID DEFAULT NULL,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_verification_status JSONB DEFAULT '{}'::jsonb,
  p_registration_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_existing BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(COALESCE(p_cadre_email, '')));
  v_name TEXT := TRIM(COALESCE(p_cadre_name, ''));
  v_event RECORD;
  v_reg_id UUID := gen_random_uuid();
  v_existing_reg RECORD;
  v_tenant_id UUID := p_tenant_id;
  v_cadre_id UUID;
BEGIN
  IF v_email = '' OR POSITION('@' IN v_email) = 0 OR v_name = '' THEN
    RAISE EXCEPTION 'Nama dan email wajib diisi.';
  END IF;

  -- Cek duplikasi pendaftaran pada kegiatan yang sama
  SELECT id, "registrationNumber", status
  INTO v_existing_reg
  FROM public.pendaftaran
  WHERE "eventId" = p_event_id AND LOWER("cadreEmail") = v_email
  LIMIT 1;

  IF v_existing_reg.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'alreadyRegistered', true,
      'id', v_existing_reg.id,
      'registrationNumber', v_existing_reg."registrationNumber",
      'status', v_existing_reg.status
    );
  END IF;

  -- Ambil metadata kegiatan jika tersedia
  SELECT id, name, level, tenant_id
  INTO v_event
  FROM public.kegiatan
  WHERE id::text = p_event_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := v_event.tenant_id;
  END IF;

  -- Cek/tautkan anggota jika sudah login atau sudah terdaftar
  SELECT id INTO v_cadre_id
  FROM public.anggota
  WHERE (auth.uid() IS NOT NULL AND (id = auth.uid() OR user_id = auth.uid()))
     OR LOWER(email) = v_email
  LIMIT 1;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  -- Jika non-MAPABA dan belum ada anggota, buat data anggota dasar (role 'anggota', tidak pernah staff)
  IF v_cadre_id IS NULL AND UPPER(COALESCE(p_level, 'MAPABA')) <> 'MAPABA' THEN
    v_cadre_id := COALESCE(auth.uid(), gen_random_uuid());
    INSERT INTO public.anggota (
      id, user_id, name, email, phone, level, tenant_id, status, "isGraduated", "registrationNumber", role
    )
    VALUES (
      v_cadre_id, auth.uid(), v_name, v_email, NULLIF(TRIM(p_phone), ''),
      COALESCE(p_level, 'PKD'), v_tenant_id, 'AKTIF', true, p_registration_number, 'anggota'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.pendaftaran (
    id, "eventId", "cadreName", "cadreEmail", "dateApplied", status, notes,
    answers, "verificationStatus", attendance, "isGraduated", "registrationNumber", tenant_id
  )
  VALUES (
    v_reg_id, p_event_id, v_name, v_email, CURRENT_DATE, 'APPROVED',
    COALESCE(p_notes, 'Pendaftaran berhasil direkam.'),
    COALESCE(p_answers, '{}'::jsonb),
    COALESCE(p_verification_status, '{}'::jsonb),
    '[]'::jsonb,
    (UPPER(COALESCE(p_level, 'MAPABA')) <> 'MAPABA'),
    p_registration_number,
    v_tenant_id
  );

  -- Buat entri evaluasi awal jika belum ada
  IF NOT EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE "activityId" = p_event_id
      AND (LOWER("participantName") = LOWER(v_name) OR (v_cadre_id IS NOT NULL AND "cadreId" = v_cadre_id::text))
  ) THEN
    INSERT INTO public.evaluations (
      id, "activityId", "activityName", "cadreId", "participantName",
      level, status, tenant_id, "updatedAt"
    )
    VALUES (
      gen_random_uuid(), p_event_id, COALESCE(v_event.name, 'Kegiatan Kaderisasi'),
      COALESCE(v_cadre_id::text, v_reg_id::text), v_name,
      COALESCE(v_event.level, p_level, 'MAPABA'), 'BELUM_DINILAI', v_tenant_id, now()
    );
  END IF;

  RETURN jsonb_build_object(
    'alreadyRegistered', false,
    'id', v_reg_id,
    'registrationNumber', p_registration_number,
    'status', 'APPROVED'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_registration(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- 6h. Onboarding self-service (hanya untuk user sendiri, tidak bisa pilih Cabang / ubah role)
CREATE OR REPLACE FUNCTION public.complete_my_onboarding(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user RECORD;
  v_tenant RECORD;
  v_role TEXT;
  v_existing_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Login diperlukan.';
  END IF;

  SELECT * INTO v_tenant
  FROM public.tenant
  WHERE id = p_tenant_id
    AND UPPER(COALESCE(level, '')) <> 'CABANG'
    AND UPPER(COALESCE(type, '')) <> 'CABANG'
    AND LOWER(COALESCE(name, '')) NOT LIKE '%cabang%'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Komisariat yang dipilih tidak valid.';
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun pengguna tidak ditemukan.';
  END IF;

  v_role := LOWER(TRIM(COALESCE(NULLIF(v_user.raw_app_meta_data->>'role', ''), 'anggota')));

  SELECT id INTO v_existing_id
  FROM public.anggota
  WHERE id = v_uid OR user_id = v_uid OR LOWER(email) = LOWER(v_user.email)
  LIMIT 1;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.anggota
    SET user_id = COALESCE(user_id, v_uid),
        tenant_id = v_tenant.id,
        "perguruanTinggi" = COALESCE(NULLIF(v_tenant.university, ''), "perguruanTinggi")
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.anggota (id, user_id, name, email, role, tenant_id, "perguruanTinggi", status, level)
    VALUES (
      v_uid, v_uid,
      COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', split_part(v_user.email, '@', 1)),
      LOWER(v_user.email),
      CASE WHEN v_role IN ('anggota', 'peserta') THEN v_role ELSE 'peserta' END,
      v_tenant.id,
      COALESCE(NULLIF(v_tenant.university, ''), '-'),
      'AKTIF',
      'MAPABA'
    );
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', v_tenant.id::text),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'tenant_id', v_tenant.id::text,
        'komisariat_id', v_tenant.id::text,
        'commissariat', v_tenant.name
      ),
      updated_at = now()
  WHERE id = v_uid;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant.id,
    'commissariat', v_tenant.name,
    'university', COALESCE(v_tenant.university, '-')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_my_onboarding(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_my_onboarding(UUID) TO authenticated, service_role;

-- 6i. Lengkapi data kader via tautan UUID tunggal (tanpa akses massal tabel anggota & anti-takeover)
CREATE OR REPLACE FUNCTION public.get_anggota_for_completion(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res JSONB;
BEGIN
  IF p_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', a.id,
    'hasAccount', (a.user_id IS NOT NULL),
    'name', a.name,
    'nim', a.nim,
    'tempatLahir', a."tempatLahir",
    'tanggalLahir', a."tanggalLahir",
    'gender', a.gender,
    'golonganDarah', a."golonganDarah",
    'phone', a.phone,
    'email', a.email,
    'alamatRumah', COALESCE(a."alamatRumah", a.address),
    'alamatDomisili', a."alamatDomisili",
    'perguruanTinggi', a."perguruanTinggi",
    'fakultas', a.fakultas,
    'jurusan', a.jurusan,
    'angkatan', a.angkatan,
    'level', a.level,
    'tenant_id', a.tenant_id,
    'commissariat', COALESCE(t.name, ''),
    'avatar', a.avatar
  )
  INTO v_res
  FROM public.anggota a
  LEFT JOIN public.tenant t ON t.id = a.tenant_id
  WHERE a.id = p_id
  LIMIT 1;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_anggota_for_completion(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_anggota_profile(
  p_id UUID,
  p_payload JSONB,
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_member RECORD;
  v_clean_email TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
  v_new_uid UUID;
  v_encrypted_pw TEXT;
  v_role_id UUID := 'b0000000-0000-0000-0000-000000000005'::uuid; -- anggota
BEGIN
  SELECT * INTO v_member FROM public.anggota WHERE id = p_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data anggota tidak ditemukan.';
  END IF;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  -- Hanya update kolom biodata yang aman (DILARANG mengubah role, role_id, status, tenant_id, isGraduated)
  UPDATE public.anggota
  SET name = COALESCE(NULLIF(TRIM(p_payload->>'name'), ''), name),
      nim = COALESCE(NULLIF(TRIM(p_payload->>'nim'), ''), nim),
      "tempatLahir" = COALESCE(NULLIF(TRIM(p_payload->>'tempatLahir'), ''), "tempatLahir"),
      "tanggalLahir" = COALESCE(NULLIF(TRIM(p_payload->>'tanggalLahir'), ''), "tanggalLahir"),
      gender = COALESCE(NULLIF(TRIM(p_payload->>'gender'), ''), gender),
      "golonganDarah" = COALESCE(NULLIF(TRIM(p_payload->>'golonganDarah'), ''), "golonganDarah"),
      phone = COALESCE(NULLIF(TRIM(p_payload->>'phone'), ''), phone),
      email = COALESCE(v_clean_email, email),
      "alamatRumah" = COALESCE(NULLIF(TRIM(p_payload->>'alamatRumah'), ''), "alamatRumah"),
      address = COALESCE(NULLIF(TRIM(p_payload->>'alamatRumah'), ''), address),
      "alamatDomisili" = COALESCE(NULLIF(TRIM(p_payload->>'alamatDomisili'), ''), "alamatDomisili"),
      "perguruanTinggi" = COALESCE(NULLIF(TRIM(p_payload->>'perguruanTinggi'), ''), "perguruanTinggi"),
      fakultas = COALESCE(NULLIF(TRIM(p_payload->>'fakultas'), ''), fakultas),
      jurusan = COALESCE(NULLIF(TRIM(p_payload->>'jurusan'), ''), jurusan),
      angkatan = COALESCE(NULLIF(TRIM(p_payload->>'angkatan'), ''), angkatan),
      avatar = COALESCE(NULLIF(TRIM(p_payload->>'avatar'), ''), avatar)
  WHERE id = p_id;

  -- Aktivasi akun baru HANYA jika anggota belum memiliki user_id DAN email belum terdaftar di auth.users (anti-takeover!)
  IF v_member.user_id IS NULL
     AND v_clean_email IS NOT NULL
     AND POSITION('@' IN v_clean_email) > 0
     AND p_password IS NOT NULL
     AND LENGTH(TRIM(p_password)) >= 6
     AND NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email)
  THEN
    v_new_uid := gen_random_uuid();
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    )
    VALUES (
      v_new_uid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_clean_email,
      v_encrypted_pw,
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', 'anggota',
        'role_id', v_role_id::text,
        'tenant_id', v_member.tenant_id::text,
        'status', 'AKTIF',
        'allowedMenus', '["/anggota", "/anggota/kegiatan", "/anggota/materi", "/anggota/profil", "/anggota/laporan"]'::jsonb
      ),
      jsonb_build_object(
        'sub', v_new_uid::text,
        'email', v_clean_email,
        'name', COALESCE(NULLIF(TRIM(p_payload->>'name'), ''), v_member.name),
        'role', 'anggota',
        'tenant_id', v_member.tenant_id
      ),
      'authenticated', 'authenticated', now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      v_new_uid, v_new_uid,
      jsonb_build_object('sub', v_new_uid::text, 'email', v_clean_email, 'email_verified', true),
      'email', v_clean_email, now(), now(), now()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;

    UPDATE public.anggota SET user_id = v_new_uid WHERE id = p_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', p_id, 'accountCreated', (v_new_uid IS NOT NULL));
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_anggota_profile(UUID, JSONB, TEXT, TEXT) TO anon, authenticated, service_role;

-- 6j. Counter view & like artikel publik (tanpa memberi izin UPDATE articles ke anon)
CREATE OR REPLACE FUNCTION public.increment_article_views(p_article_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INTEGER;
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_article_id AND status = 'DITAMPILKAN'
  RETURNING views INTO v_views;
  RETURN COALESCE(v_views, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_article_like(p_article_id UUID, p_delta INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_step INTEGER := CASE WHEN p_delta < 0 THEN -1 ELSE 1 END;
  v_likes INTEGER;
BEGIN
  UPDATE public.articles
  SET likes = GREATEST(0, COALESCE(likes, 0) + v_step)
  WHERE id = p_article_id AND status = 'DITAMPILKAN'
  RETURNING likes INTO v_likes;
  RETURN COALESCE(v_likes, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.toggle_article_like(UUID, INTEGER) TO anon, authenticated, service_role;

-- 6k. Counter download materi kurikulum untuk member login (tanpa izin UPDATE kurikulum)
CREATE OR REPLACE FUNCTION public.increment_material_download(p_level_name TEXT, p_material_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.kurikulum
  SET materials = (
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN elem->>'id' = p_material_id THEN
          jsonb_set(elem, '{downloadCount}', to_jsonb(COALESCE((elem->>'downloadCount')::int, 0) + 1))
        ELSE elem
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(materials, '[]'::jsonb)) AS elem
  )
  WHERE UPPER(name) = UPPER(p_level_name);

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_material_download(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_material_download(TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. KUNCI RLS SELURUH 17 TABEL PUBLIC (DROP POLICY LAMA + BUAT POLICY KETAT)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
  all_tables TEXT[] := ARRAY[
    'tenant', 'roles', 'pengaturan', 'pengurus', 'kegiatan', 'kaderisasi',
    'kurikulum', 'persyaratan', 'articles', 'galeri', 'anggota', 'pendaftaran',
    'evaluations', 'surat', 'surat_templates', 'arsip', 'pengajuan_sk'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
      END LOOP;
      -- Cabut hak write langsung dari role anon di level privilege PostgreSQL
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.%I FROM anon;', tbl);
    END IF;
  END LOOP;
END $$;

-- Cabut SELECT anon pada tabel privat/PII
REVOKE SELECT ON TABLE public.anggota FROM anon;
REVOKE SELECT ON TABLE public.pendaftaran FROM anon;
REVOKE SELECT ON TABLE public.evaluations FROM anon;
REVOKE SELECT ON TABLE public.surat FROM anon;
REVOKE SELECT ON TABLE public.surat_templates FROM anon;
REVOKE SELECT ON TABLE public.arsip FROM anon;
REVOKE SELECT ON TABLE public.pengajuan_sk FROM anon;
REVOKE SELECT ON TABLE public.kurikulum FROM anon;

-- 7.1 TENANT (komisariat)
CREATE POLICY "tenant_public_select" ON public.tenant
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tenant_cabang_insert" ON public.tenant
  FOR INSERT TO authenticated WITH CHECK (public.is_cabang_admin());
CREATE POLICY "tenant_staff_update" ON public.tenant
  FOR UPDATE TO authenticated
  USING (public.is_cabang_admin() OR (public.is_staff() AND id = public.current_user_tenant_id()))
  WITH CHECK (public.is_cabang_admin() OR (public.is_staff() AND id = public.current_user_tenant_id()));
CREATE POLICY "tenant_cabang_delete" ON public.tenant
  FOR DELETE TO authenticated USING (public.is_cabang_admin());

-- 7.2 ROLES
CREATE POLICY "roles_public_select" ON public.roles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "roles_superadmin_manage" ON public.roles
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 7.3 PENGATURAN
CREATE POLICY "pengaturan_public_select" ON public.pengaturan
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pengaturan_cabang_manage" ON public.pengaturan
  FOR ALL TO authenticated
  USING (public.is_cabang_admin())
  WITH CHECK (public.is_cabang_admin());

-- 7.4 PENGURUS
CREATE POLICY "pengurus_public_select" ON public.pengurus
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pengurus_staff_manage" ON public.pengurus
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.5 KEGIATAN
CREATE POLICY "kegiatan_public_select" ON public.kegiatan
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "kegiatan_staff_manage" ON public.kegiatan
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.6 KADERISASI
CREATE POLICY "kaderisasi_public_select" ON public.kaderisasi
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "kaderisasi_staff_manage" ON public.kaderisasi
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.7 KURIKULUM
CREATE POLICY "kurikulum_auth_select" ON public.kurikulum
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "kurikulum_staff_manage" ON public.kurikulum
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- 7.8 PERSYARATAN
CREATE POLICY "persyaratan_public_select" ON public.persyaratan
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "persyaratan_staff_manage" ON public.persyaratan
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.9 ARTICLES
CREATE POLICY "articles_anon_select_published" ON public.articles
  FOR SELECT TO anon USING (status = 'DITAMPILKAN');
CREATE POLICY "articles_auth_select" ON public.articles
  FOR SELECT TO authenticated USING (status = 'DITAMPILKAN' OR public.is_staff());
CREATE POLICY "articles_staff_manage" ON public.articles
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.10 GALERI
CREATE POLICY "galeri_public_select" ON public.galeri
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "galeri_staff_manage" ON public.galeri
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.11 ANGGOTA (PII - STRICT!)
CREATE POLICY "anggota_auth_select" ON public.anggota
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR user_id = auth.uid()
    OR (email IS NOT NULL AND LOWER(email) = public.current_user_email())
    OR public.is_cabang_admin()
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "anggota_auth_insert" ON public.anggota
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_staff() AND public.can_access_tenant(tenant_id))
    OR (user_id = auth.uid() AND LOWER(COALESCE(email, '')) = public.current_user_email())
  );
CREATE POLICY "anggota_auth_update" ON public.anggota
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR user_id = auth.uid()
    OR (email IS NOT NULL AND LOWER(email) = public.current_user_email())
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  )
  WITH CHECK (
    id = auth.uid()
    OR user_id = auth.uid()
    OR (email IS NOT NULL AND LOWER(email) = public.current_user_email())
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "anggota_staff_delete" ON public.anggota
  FOR DELETE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.12 PENDAFTARAN (PII - STRICT!)
CREATE POLICY "pendaftaran_auth_select" ON public.pendaftaran
  FOR SELECT TO authenticated
  USING (
    LOWER(COALESCE("cadreEmail", '')) = public.current_user_email()
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "pendaftaran_auth_insert" ON public.pendaftaran
  FOR INSERT TO authenticated
  WITH CHECK (
    LOWER(COALESCE("cadreEmail", '')) = public.current_user_email()
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "pendaftaran_staff_update" ON public.pendaftaran
  FOR UPDATE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));
CREATE POLICY "pendaftaran_staff_delete" ON public.pendaftaran
  FOR DELETE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.13 EVALUATIONS
CREATE POLICY "evaluations_auth_select" ON public.evaluations
  FOR SELECT TO authenticated
  USING (
    public.is_own_anggota_id("cadreId")
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "evaluations_auth_insert" ON public.evaluations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_anggota_id("cadreId")
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "evaluations_auth_update" ON public.evaluations
  FOR UPDATE TO authenticated
  USING (
    public.is_own_anggota_id("cadreId")
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  )
  WITH CHECK (
    public.is_own_anggota_id("cadreId")
    OR (public.is_staff() AND public.can_access_tenant(tenant_id))
  );
CREATE POLICY "evaluations_staff_delete" ON public.evaluations
  FOR DELETE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.14 SURAT (INTERNAL STAFF ONLY)
CREATE POLICY "surat_staff_manage" ON public.surat
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.15 SURAT_TEMPLATES (INTERNAL STAFF ONLY)
CREATE POLICY "surat_templates_staff_select" ON public.surat_templates
  FOR SELECT TO authenticated
  USING (public.is_staff() AND public.can_read_tenant_or_cabang(tenant_id));
CREATE POLICY "surat_templates_staff_write" ON public.surat_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));
CREATE POLICY "surat_templates_staff_update" ON public.surat_templates
  FOR UPDATE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));
CREATE POLICY "surat_templates_staff_delete" ON public.surat_templates
  FOR DELETE TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.16 ARSIP (INTERNAL STAFF ONLY)
CREATE POLICY "arsip_staff_manage" ON public.arsip
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- 7.17 PENGAJUAN_SK (INTERNAL STAFF ONLY)
CREATE POLICY "pengajuan_sk_staff_manage" ON public.pengajuan_sk
  FOR ALL TO authenticated
  USING (public.is_staff() AND public.can_access_tenant(tenant_id))
  WITH CHECK (public.is_staff() AND public.can_access_tenant(tenant_id));

-- ------------------------------------------------------------------------------
-- 8. PERKETAT STORAGE BUCKETS & POLICIES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-docs',
  'private-docs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "Allow Public Read Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Materials Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Komisariat Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Pas Foto Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Galeri Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Update Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Private Docs Staff Or Owner Select" ON storage.objects;
DROP POLICY IF EXISTS "Private Docs Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Private Docs Staff Or Owner Modify" ON storage.objects;
DROP POLICY IF EXISTS "Private Docs Staff Or Owner Delete" ON storage.objects;

-- SELECT untuk bucket aset publik (mempertahankan kompatibilitas URL media publik)
CREATE POLICY "Allow Public Read Storage Objects"
ON storage.objects FOR SELECT
USING (bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri'));

-- SELECT untuk private-docs: hanya pemilik atau staf
CREATE POLICY "Private Docs Staff Or Owner Select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'private-docs' AND (owner = auth.uid() OR public.is_staff()));

-- INSERT materials: user login atau anon hanya di folder registrations/ dan avatars/
CREATE POLICY "Allow Upload Materials Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND (
    auth.role() = 'authenticated'
    OR name LIKE 'registrations/%'
    OR name LIKE 'avatars/%'
  )
);

-- INSERT komisariat & galeri: HANYA staf
CREATE POLICY "Allow Upload Komisariat Objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'komisariat' AND public.is_staff());

CREATE POLICY "Allow Upload Galeri Objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'galeri' AND public.is_staff());

-- INSERT pas-foto: HANYA user login (atau folder registrations untuk pendaftar)
CREATE POLICY "Allow Upload Pas Foto Objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pas-foto');

-- INSERT private-docs: user login
CREATE POLICY "Private Docs Authenticated Insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'private-docs');

-- UPDATE: HANYA pemilik berkas atau staf (mencegah anggota hapus/timpa file admin!)
CREATE POLICY "Allow Authenticated Update Storage Objects"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND (owner = auth.uid() OR public.is_staff())
)
WITH CHECK (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND (owner = auth.uid() OR public.is_staff())
);

-- DELETE: HANYA pemilik berkas atau staf
CREATE POLICY "Allow Authenticated Delete Storage Objects"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND (owner = auth.uid() OR public.is_staff())
);
