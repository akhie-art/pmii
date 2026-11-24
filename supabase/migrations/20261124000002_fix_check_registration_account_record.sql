-- Fix: avoid unassigned RECORD access in check_registration_account when p_event_id is NULL
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
  v_reg_id UUID := NULL;
  v_reg_status TEXT := NULL;
  v_reg_number TEXT := NULL;
  v_reg_date DATE := NULL;
BEGIN
  IF v_email = '' OR POSITION('@' IN v_email) = 0 THEN
    RETURN jsonb_build_object('accountExists', false, 'alreadyRegistered', false, 'registration', NULL);
  END IF;

  SELECT (
    EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM public.anggota WHERE LOWER(email) = v_email)
  ) INTO v_exists;

  IF p_event_id IS NOT NULL AND TRIM(p_event_id) <> '' THEN
    SELECT id, status, "registrationNumber", "dateApplied"
    INTO v_reg_id, v_reg_status, v_reg_number, v_reg_date
    FROM public.pendaftaran
    WHERE "eventId" = p_event_id
      AND LOWER("cadreEmail") = v_email
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'accountExists', v_exists,
    'alreadyRegistered', (v_reg_id IS NOT NULL),
    'registration', CASE WHEN v_reg_id IS NOT NULL THEN jsonb_build_object(
      'id', v_reg_id,
      'status', v_reg_status,
      'registrationNumber', v_reg_number,
      'dateApplied', v_reg_date
    ) ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_registration_account(TEXT, TEXT) TO anon, authenticated, service_role;
