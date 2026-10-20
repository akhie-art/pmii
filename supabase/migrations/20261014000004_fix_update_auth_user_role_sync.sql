-- Migration: Enhance update_auth_user to synchronize role and commissariat to public.anggota and preserve existing metadata
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

  -- Update auth.users while merging metadata so OAuth data (avatar, provider info) is preserved
  UPDATE auth.users
  SET email = v_clean_email,
      encrypted_password = COALESCE(v_hashed_password, encrypted_password),
      banned_until = CASE WHEN p_status = 'NONAKTIF' THEN now() + INTERVAL '100 years' ELSE NULL END,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
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

  -- Selaraskan juga email, nama, role, dan commissariat di tabel anggota jika tertaut
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota
    SET email = v_clean_email,
        name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name) ELSE name END,
        role = CASE WHEN p_role IS NOT NULL AND TRIM(p_role) != '' THEN LOWER(TRIM(p_role)) ELSE role END,
        commissariat = CASE WHEN p_commissariat IS NOT NULL AND TRIM(p_commissariat) != '' THEN TRIM(p_commissariat) ELSE commissariat END
    WHERE user_id = p_user_id OR LOWER(email) = v_clean_email;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
