-- ==============================================================================
-- Migration: Fix auth.users GoTrue string columns and identities to prevent 500 error
-- File: supabase/migrations/20261020000006_fix_auth_users_gotrue_columns.sql
-- ==============================================================================

-- 1. Fix NULL values in auth.users string columns that cause GoTrue Scan error
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_super_admin = COALESCE(is_super_admin, false),
  is_sso_user = COALESCE(is_sso_user, false);

-- 2. Ensure admin@pmii.org has a clean identity in auth.identities
DO $$
DECLARE
  v_admin_id UUID;
  v_identity_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE LOWER(email) = 'admin@pmii.org' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    -- Check if identity exists
    SELECT id INTO v_identity_id FROM auth.identities WHERE user_id = v_admin_id LIMIT 1;
    
    IF v_identity_id IS NULL THEN
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
        gen_random_uuid(),
        v_admin_id,
        jsonb_build_object(
          'sub', v_admin_id::text,
          'email', 'admin@pmii.org',
          'email_verified', true
        ),
        'email',
        'admin@pmii.org',
        now(),
        now(),
        now()
      );
    ELSE
      UPDATE auth.identities
      SET identity_data = jsonb_build_object(
            'sub', v_admin_id::text,
            'email', 'admin@pmii.org',
            'email_verified', true
          ),
          provider = 'email',
          provider_id = 'admin@pmii.org',
          updated_at = now()
      WHERE id = v_identity_id;
    END IF;
  END IF;
END;
$$;
