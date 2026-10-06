-- Migration: Create helper function to create user directly in auth.users
-- Description: Memungkinkan penambahan pengguna baru ke Users Authentication langsung dari dashboard admin.

CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'pengurus',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  p_status TEXT DEFAULT 'AKTIF',
  p_allowed_menus JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_hashed_password TEXT;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_existing_id UUID;
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'Email tidak boleh kosong';
  END IF;

  SELECT id INTO v_existing_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Email sudah terdaftar di Users Authentication';
  END IF;

  BEGIN
    v_hashed_password := extensions.crypt(COALESCE(NULLIF(p_password, ''), 'pmii1960'), extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    v_hashed_password := crypt(COALESCE(NULLIF(p_password, ''), 'pmii1960'), gen_salt('bf'));
  END;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    banned_until,
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
    CASE WHEN p_status = 'NONAKTIF' THEN now() + INTERVAL '100 years' ELSE NULL END,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'name', COALESCE(p_name, ''),
      'role', COALESCE(p_role, 'pengurus'),
      'commissariat', COALESCE(p_commissariat, 'Ki Ageng Getas Pendawa'),
      'status', COALESCE(p_status, 'AKTIF'),
      'allowedMenus', COALESCE(p_allowed_menus, '[]'::jsonb)
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

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
  );

  RETURN jsonb_build_object(
    'id', v_user_id,
    'email', v_clean_email,
    'name', p_name,
    'role', p_role,
    'commissariat', p_commissariat,
    'status', p_status,
    'allowedMenus', p_allowed_menus
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
