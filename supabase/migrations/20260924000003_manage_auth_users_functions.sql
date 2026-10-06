-- Migration: Create functions to manage auth.users from client
-- Description: Menyediakan fungsi get_auth_users() dan update_auth_user() agar halaman admin/pengguna 
--              dapat membaca dan mengelola data pengguna langsung dari auth.users (Users Authentication).

-- 1. Fungsi untuk membaca semua pengguna resmi dari auth.users
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
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
      'name', COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      'role', COALESCE(u.raw_user_meta_data->>'role', 'anggota'),
      'commissariat', COALESCE(u.raw_user_meta_data->>'commissariat', 'Ki Ageng Getas Pendawa'),
      'status', CASE 
        WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'NONAKTIF'
        ELSE COALESCE(u.raw_user_meta_data->>'status', 'AKTIF')
      END,
      'allowedMenus', COALESCE(u.raw_user_meta_data->'allowedMenus', '[]'::jsonb),
      'avatar', COALESCE(u.raw_user_meta_data->>'avatar', u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
    ) ORDER BY u.created_at DESC
  ), '[]'::jsonb) INTO result
  FROM auth.users u
  WHERE u.deleted_at IS NULL;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users() TO anon, authenticated, service_role;

-- 2. Fungsi untuk memperbarui pengguna di auth.users (nama, role, komisariat, status, allowedMenus, password)
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

  -- Selaraskan juga email dan nama di tabel kader jika tertaut
  UPDATE public.kader
  SET email = v_clean_email,
      name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name) ELSE name END
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
