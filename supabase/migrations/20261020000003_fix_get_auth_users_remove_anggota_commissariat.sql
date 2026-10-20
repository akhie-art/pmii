-- ==============================================================================
-- Migration: Fix get_auth_users RPC by removing dropped column a.commissariat
-- File: supabase/migrations/20261020000003_fix_get_auth_users_remove_anggota_commissariat.sql
-- ==============================================================================

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
      'commissariat', COALESCE(u.raw_user_meta_data->>'commissariat', t.name, 'Ki Ageng Getas Pendawa'),
      'tenant_id', COALESCE(a.tenant_id, (u.raw_user_meta_data->>'tenant_id')::uuid, t.id),
      'komisariat_id', COALESCE(a.tenant_id, (u.raw_user_meta_data->>'komisariat_id')::uuid, t.id),
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
  LEFT JOIN public.tenant t ON t.id = a.tenant_id OR t.id = (u.raw_user_meta_data->>'tenant_id')::uuid
  LEFT JOIN public.roles r ON r.id = a.role_id OR r.code = LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'role', a.role)))
  WHERE u.deleted_at IS NULL;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users() TO anon, authenticated, service_role;
