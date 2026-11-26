-- ==============================================================================
-- Migration: Security Hardening V2 (Evaluations Trigger, Public Registration,
--            Tokenized Profile Completion, Tenant-Scoped Storage & RPC Fixes)
-- File: supabase/migrations/20261124000003_security_hardening_v2.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 1. PROTEKSI KOLOM PRIVILEGED PADA public.evaluations (ANTI SELF-GRADING)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_evaluations_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_sanitized_sessions JSONB := '{}'::jsonb;
  v_key TEXT;
  v_new_val JSONB;
  v_old_val JSONB;
BEGIN
  IF current_setting('pmii.internal_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') AND auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Staf / Instruktur / Admin diizinkan mengelola seluruh kolom penilaian
  IF auth.uid() IS NOT NULL AND public.is_staff() THEN
    RETURN NEW;
  END IF;

  -- Peserta / Anggota biasa TIDAK BOLEH memanipulasi skor instruktur, grade, atau status kelulusan
  IF TG_OP = 'INSERT' THEN
    NEW.kognitif := 0;
    NEW.afektif := 0;
    NEW.psikomotorik := 0;
    NEW."finalScore" := 0;
    NEW.grade := 'E';
    NEW.status := 'BELUM_DINILAI';
    NEW."evaluatorId" := '';
    NEW."evaluatorName" := '';
    NEW.notes := '';

    -- Hanya izinkan metadata kuis pre/post-test di sessionScores saat INSERT oleh peserta
    IF NEW."sessionScores" IS NOT NULL AND jsonb_typeof(NEW."sessionScores") = 'object' THEN
      FOR v_key, v_new_val IN SELECT * FROM jsonb_each(NEW."sessionScores") LOOP
        IF jsonb_typeof(v_new_val) = 'object' THEN
          v_sanitized_sessions := jsonb_set(
            v_sanitized_sessions,
            ARRAY[v_key],
            jsonb_strip_nulls(jsonb_build_object(
              'materiId', v_new_val->'materiId',
              'materiTitle', v_new_val->'materiTitle',
              'kognitif', 0,
              'afektif', 0,
              'psikomotorik', 0,
              'score', 0,
              'preTestScore', CASE WHEN jsonb_typeof(v_new_val->'preTestScore') = 'number' THEN to_jsonb(LEAST(100, GREATEST(0, (v_new_val->>'preTestScore')::numeric))) ELSE NULL END,
              'postTestScore', CASE WHEN jsonb_typeof(v_new_val->'postTestScore') = 'number' THEN to_jsonb(LEAST(100, GREATEST(0, (v_new_val->>'postTestScore')::numeric))) ELSE NULL END
            ))
          );
        END IF;
      END LOOP;
      NEW."sessionScores" := v_sanitized_sessions;
    ELSE
      NEW."sessionScores" := '{}'::jsonb;
    END IF;

    -- Pastikan tenant_id diambil dari kegiatan agar tidak dimanipulasi
    IF NEW."activityId" IS NOT NULL THEN
      SELECT k.tenant_id INTO NEW.tenant_id
      FROM public.kegiatan k
      WHERE k.id::text = NEW."activityId"
      LIMIT 1;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Pertahankan seluruh kolom otoritatif penilaian dari OLD
    NEW."activityId" := OLD."activityId";
    NEW."cadreId" := OLD."cadreId";
    NEW.level := OLD.level;
    NEW.tenant_id := OLD.tenant_id;
    NEW.kognitif := OLD.kognitif;
    NEW.afektif := OLD.afektif;
    NEW.psikomotorik := OLD.psikomotorik;
    NEW."finalScore" := OLD."finalScore";
    NEW.grade := OLD.grade;
    NEW.status := OLD.status;
    NEW."evaluatorId" := OLD."evaluatorId";
    NEW."evaluatorName" := OLD."evaluatorName";
    NEW.notes := OLD.notes;

    -- Gabungkan hanya preTestScore & postTestScore baru ke OLD."sessionScores", skor instruktur tetap terkunci
    v_sanitized_sessions := COALESCE(OLD."sessionScores", '{}'::jsonb);
    IF NEW."sessionScores" IS NOT NULL AND jsonb_typeof(NEW."sessionScores") = 'object' THEN
      FOR v_key, v_new_val IN SELECT * FROM jsonb_each(NEW."sessionScores") LOOP
        IF jsonb_typeof(v_new_val) = 'object' THEN
          v_old_val := COALESCE(v_sanitized_sessions->v_key, jsonb_build_object(
            'materiId', COALESCE(v_new_val->'materiId', to_jsonb(v_key)),
            'materiTitle', COALESCE(v_new_val->'materiTitle', to_jsonb(v_key)),
            'kognitif', 0,
            'afektif', 0,
            'psikomotorik', 0,
            'score', 0
          ));
          IF jsonb_typeof(v_new_val->'preTestScore') = 'number' THEN
            v_old_val := jsonb_set(v_old_val, '{preTestScore}', to_jsonb(LEAST(100, GREATEST(0, (v_new_val->>'preTestScore')::numeric))));
          END IF;
          IF jsonb_typeof(v_new_val->'postTestScore') = 'number' THEN
            v_old_val := jsonb_set(v_old_val, '{postTestScore}', to_jsonb(LEAST(100, GREATEST(0, (v_new_val->>'postTestScore')::numeric))));
          END IF;
          v_sanitized_sessions := jsonb_set(v_sanitized_sessions, ARRAY[v_key], v_old_val);
        END IF;
      END LOOP;
    END IF;
    NEW."sessionScores" := v_sanitized_sessions;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_evaluations_privileged_columns ON public.evaluations;
CREATE TRIGGER trg_protect_evaluations_privileged_columns
BEFORE INSERT OR UPDATE ON public.evaluations
FOR EACH ROW
EXECUTE FUNCTION public.protect_evaluations_privileged_columns();

-- Narrow RPC agar peserta dapat menyimpan hasil kuis/asesmen karier sendiri secara atomik & aman (O(1))
CREATE OR REPLACE FUNCTION public.submit_my_evaluation_self_data(
  p_activity_id TEXT,
  p_quiz_results JSONB DEFAULT NULL,
  p_pre_avg NUMERIC DEFAULT NULL,
  p_post_avg NUMERIC DEFAULT NULL,
  p_session_quiz JSONB DEFAULT NULL,
  p_career_assessment JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_anggota RECORD;
  v_event RECORD;
  v_eval RECORD;
  v_sessions JSONB;
  v_key TEXT;
  v_val JSONB;
  v_entry JSONB;
  v_eval_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Login diperlukan.';
  END IF;
  IF p_activity_id IS NULL OR TRIM(p_activity_id) = '' THEN
    RAISE EXCEPTION 'activityId wajib diisi.';
  END IF;

  SELECT id, name, gender, "perguruanTinggi", tenant_id
  INTO v_anggota
  FROM public.anggota
  WHERE id = v_uid OR user_id = v_uid OR LOWER(email) = public.current_user_email()
  LIMIT 1;

  SELECT id, name, level, tenant_id
  INTO v_event
  FROM public.kegiatan
  WHERE id::text = p_activity_id
  LIMIT 1;

  SELECT *
  INTO v_eval
  FROM public.evaluations
  WHERE "activityId" = p_activity_id
    AND (
      "cadreId" = COALESCE(v_anggota.id::text, v_uid::text)
      OR "cadreId" = v_uid::text
      OR public.is_own_anggota_id("cadreId")
    )
  LIMIT 1;

  v_sessions := COALESCE(v_eval."sessionScores", '{}'::jsonb);
  IF p_session_quiz IS NOT NULL AND jsonb_typeof(p_session_quiz) = 'object' THEN
    FOR v_key, v_val IN SELECT * FROM jsonb_each(p_session_quiz) LOOP
      IF jsonb_typeof(v_val) = 'object' THEN
        v_entry := COALESCE(v_sessions->v_key, jsonb_build_object(
          'materiId', COALESCE(v_val->'materiId', to_jsonb(v_key)),
          'materiTitle', COALESCE(v_val->'materiTitle', to_jsonb(v_key)),
          'kognitif', 0,
          'afektif', 0,
          'psikomotorik', 0,
          'score', 0
        ));
        IF jsonb_typeof(v_val->'preTestScore') = 'number' THEN
          v_entry := jsonb_set(v_entry, '{preTestScore}', to_jsonb(LEAST(100, GREATEST(0, (v_val->>'preTestScore')::numeric))));
        END IF;
        IF jsonb_typeof(v_val->'postTestScore') = 'number' THEN
          v_entry := jsonb_set(v_entry, '{postTestScore}', to_jsonb(LEAST(100, GREATEST(0, (v_val->>'postTestScore')::numeric))));
        END IF;
        v_sessions := jsonb_set(v_sessions, ARRAY[v_key], v_entry);
      END IF;
    END LOOP;
  END IF;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  IF v_eval.id IS NOT NULL THEN
    v_eval_id := v_eval.id;
    UPDATE public.evaluations
    SET "sessionScores" = v_sessions,
        "quizResults" = COALESCE(p_quiz_results, "quizResults"),
        "preTestAverage" = COALESCE(p_pre_avg, "preTestAverage"),
        "postTestAverage" = COALESCE(p_post_avg, "postTestAverage"),
        "careerAssessment" = COALESCE(p_career_assessment, "careerAssessment"),
        "updatedAt" = now()
    WHERE id = v_eval.id;
  ELSE
    v_eval_id := gen_random_uuid();
    INSERT INTO public.evaluations (
      id, "activityId", "activityName", "cadreId", "participantName",
      gender, university, level, "sessionScores",
      kognitif, afektif, psikomotorik, "finalScore", grade, status,
      "quizResults", "preTestAverage", "postTestAverage", "careerAssessment",
      tenant_id, "updatedAt"
    )
    VALUES (
      v_eval_id,
      p_activity_id,
      COALESCE(v_event.name, 'Kegiatan Kaderisasi'),
      COALESCE(v_anggota.id::text, v_uid::text),
      COALESCE(v_anggota.name, 'Peserta'),
      v_anggota.gender,
      v_anggota."perguruanTinggi",
      COALESCE(v_event.level, 'MAPABA'),
      v_sessions,
      0, 0, 0, 0, 'E', 'BELUM_DINILAI',
      COALESCE(p_quiz_results, '{}'::jsonb),
      p_pre_avg,
      p_post_avg,
      p_career_assessment,
      COALESCE(v_event.tenant_id, v_anggota.tenant_id),
      now()
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_eval_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_my_evaluation_self_data(TEXT, JSONB, NUMERIC, NUMERIC, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_my_evaluation_self_data(TEXT, JSONB, NUMERIC, NUMERIC, JSONB, JSONB) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. PROTEKSI PENDAFTARAN: TRIGGER + HARDEN submit_public_registration
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_pendaftaran_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_event_tenant UUID;
BEGIN
  IF current_setting('pmii.internal_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') AND auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND public.is_staff() THEN
    RETURN NEW;
  END IF;

  -- Pengguna biasa tidak boleh memalsukan status APPROVED / isGraduated / attendance
  NEW.status := 'PENDING';
  NEW."isGraduated" := false;
  NEW.attendance := '[]'::jsonb;
  NEW."verificationStatus" := '{}'::jsonb;

  IF NEW."eventId" IS NOT NULL THEN
    SELECT tenant_id INTO v_event_tenant
    FROM public.kegiatan
    WHERE id::text = NEW."eventId"
    LIMIT 1;
    IF v_event_tenant IS NOT NULL THEN
      NEW.tenant_id := v_event_tenant;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_pendaftaran_privileged_columns ON public.pendaftaran;
CREATE TRIGGER trg_protect_pendaftaran_privileged_columns
BEFORE INSERT ON public.pendaftaran
FOR EACH ROW
EXECUTE FUNCTION public.protect_pendaftaran_privileged_columns();

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
  v_tenant_id UUID;
  v_level TEXT := 'MAPABA';
  v_cadre_id UUID;
BEGIN
  IF v_email = '' OR POSITION('@' IN v_email) = 0 OR v_name = '' THEN
    RAISE EXCEPTION 'Nama dan email wajib diisi.';
  END IF;

  -- Validasi kegiatan otoritatif dari DB (jangan percaya p_level atau p_tenant_id mentah dari klien)
  SELECT id, name, level, tenant_id, status
  INTO v_event
  FROM public.kegiatan
  WHERE id::text = p_event_id
  LIMIT 1;

  IF FOUND THEN
    IF UPPER(COALESCE(v_event.status, 'OPEN')) = 'CLOSED' THEN
      RAISE EXCEPTION 'Pendaftaran untuk kegiatan ini telah ditutup.';
    END IF;
    v_level := COALESCE(NULLIF(TRIM(v_event.level), ''), 'MAPABA');
    v_tenant_id := v_event.tenant_id;
  ELSE
    -- Hanya izinkan fallback jika tenant valid & level default MAPABA
    v_level := 'MAPABA';
    IF p_tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tenant WHERE id = p_tenant_id) THEN
      v_tenant_id := p_tenant_id;
    END IF;
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

  -- Tautkan anggota eksisting jika sudah terdaftar
  SELECT id INTO v_cadre_id
  FROM public.anggota
  WHERE (auth.uid() IS NOT NULL AND (id = auth.uid() OR user_id = auth.uid()))
     OR LOWER(email) = v_email
  LIMIT 1;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

  -- Selalu mulai dengan status PENDING dan isGraduated = false (anti pemalsuan kelulusan oleh anon)
  INSERT INTO public.pendaftaran (
    id, "eventId", "cadreName", "cadreEmail", "dateApplied", status, notes,
    answers, "verificationStatus", attendance, "isGraduated", "registrationNumber", tenant_id
  )
  VALUES (
    v_reg_id, p_event_id, v_name, v_email, CURRENT_DATE, 'PENDING',
    COALESCE(NULLIF(TRIM(p_notes), ''), 'Pendaftaran berhasil direkam dan menunggu verifikasi panitia.'),
    COALESCE(p_answers, '{}'::jsonb),
    '{}'::jsonb,
    '[]'::jsonb,
    false,
    p_registration_number,
    v_tenant_id
  );

  -- Buat entri evaluasi awal (BELUM_DINILAI) jika belum ada
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
      v_level, 'BELUM_DINILAI', v_tenant_id, now()
    );
  END IF;

  RETURN jsonb_build_object(
    'alreadyRegistered', false,
    'id', v_reg_id,
    'registrationNumber', p_registration_number,
    'status', 'PENDING'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_registration(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. TOKENISASI & KUNCI /lengkapi-data/[id] (ANTI PII SCRAPING & OVERWRITE)
-- ------------------------------------------------------------------------------
ALTER TABLE public.anggota
  ADD COLUMN IF NOT EXISTS completion_token TEXT,
  ADD COLUMN IF NOT EXISTS completion_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_anggota_completion_token
  ON public.anggota (completion_token)
  WHERE completion_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_anggota_completion_token(p_anggota_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_member RECORD;
  v_token TEXT;
  v_expires TIMESTAMPTZ := now() + INTERVAL '7 days';
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff() THEN
    RAISE EXCEPTION 'Forbidden: Hanya pengurus/admin yang dapat membuat tautan pemutakhiran data.';
  END IF;

  SELECT id, tenant_id, user_id, completion_token, completion_token_expires_at
  INTO v_member
  FROM public.anggota
  WHERE id = p_anggota_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data anggota tidak ditemukan.';
  END IF;

  IF NOT public.can_access_tenant(v_member.tenant_id) THEN
    RAISE EXCEPTION 'Forbidden: Anggota berada di luar komisariat Anda.';
  END IF;

  -- Pakai ulang token aktif jika masa berlakunya masih > 24 jam, atau terbitkan baru
  IF v_member.completion_token IS NOT NULL
     AND v_member.completion_token_expires_at IS NOT NULL
     AND v_member.completion_token_expires_at > now() + INTERVAL '24 hours'
  THEN
    v_token := v_member.completion_token;
    v_expires := v_member.completion_token_expires_at;
  ELSE
    v_token := encode(extensions.gen_random_bytes(24), 'hex');
    PERFORM set_config('pmii.internal_rpc', 'on', true);
    UPDATE public.anggota
    SET completion_token = v_token,
        completion_token_expires_at = v_expires
    WHERE id = p_anggota_id;
  END IF;

  RETURN jsonb_build_object(
    'token', v_token,
    'expiresAt', v_expires,
    'hasAccount', (v_member.user_id IS NOT NULL)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_anggota_completion_token(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_anggota_completion_token(UUID) TO authenticated, service_role;

-- Hapus overload lama tanpa parameter token agar tidak bisa dibypass
DROP FUNCTION IF EXISTS public.get_anggota_for_completion(UUID);
DROP FUNCTION IF EXISTS public.complete_anggota_profile(UUID, JSONB, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_anggota_for_completion(
  p_id UUID,
  p_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_member RECORD;
  v_is_authorized_user BOOLEAN := false;
  v_has_valid_token BOOLEAN := false;
BEGIN
  IF p_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT a.*, COALESCE(t.name, '') AS resolved_commissariat
  INTO v_member
  FROM public.anggota a
  LEFT JOIN public.tenant t ON t.id = a.tenant_id
  WHERE a.id = p_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Izinkan jika login sebagai pemilik akun sendiri atau staf komisariat/cabang terkait
  IF auth.uid() IS NOT NULL THEN
    v_is_authorized_user := (
      v_member.id = auth.uid()
      OR v_member.user_id = auth.uid()
      OR (public.is_staff() AND public.can_access_tenant(v_member.tenant_id))
    );
  END IF;

  -- Jika akun sudah diaktivasi dan pemanggil bukan pemilik/staf, blokir akses anon!
  IF v_member.user_id IS NOT NULL AND NOT v_is_authorized_user THEN
    RETURN jsonb_build_object('error', 'ALREADY_ACTIVATED');
  END IF;

  v_has_valid_token := (
    p_token IS NOT NULL
    AND LENGTH(TRIM(p_token)) >= 16
    AND v_member.completion_token IS NOT NULL
    AND v_member.completion_token = TRIM(p_token)
    AND v_member.completion_token_expires_at IS NOT NULL
    AND v_member.completion_token_expires_at > now()
  );

  IF NOT v_is_authorized_user AND NOT v_has_valid_token THEN
    RETURN jsonb_build_object('error', 'INVALID_OR_EXPIRED_TOKEN');
  END IF;

  RETURN jsonb_build_object(
    'id', v_member.id,
    'hasAccount', (v_member.user_id IS NOT NULL),
    'name', v_member.name,
    'nim', v_member.nim,
    'tempatLahir', v_member."tempatLahir",
    'tanggalLahir', v_member."tanggalLahir",
    'gender', v_member.gender,
    'golonganDarah', v_member."golonganDarah",
    'phone', v_member.phone,
    'email', v_member.email,
    'alamatRumah', COALESCE(v_member."alamatRumah", v_member.address),
    'alamatDomisili', v_member."alamatDomisili",
    'perguruanTinggi', v_member."perguruanTinggi",
    'fakultas', v_member.fakultas,
    'jurusan', v_member.jurusan,
    'angkatan', v_member.angkatan,
    'level', v_member.level,
    'tenant_id', v_member.tenant_id,
    'commissariat', v_member.resolved_commissariat,
    'avatar', v_member.avatar
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_anggota_for_completion(UUID, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_anggota_profile(
  p_id UUID,
  p_payload JSONB,
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_member RECORD;
  v_is_authorized_user BOOLEAN := false;
  v_has_valid_token BOOLEAN := false;
  v_clean_email TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
  v_new_uid UUID;
  v_encrypted_pw TEXT;
  v_role_id UUID := 'b0000000-0000-0000-0000-000000000005'::uuid;
BEGIN
  SELECT * INTO v_member FROM public.anggota WHERE id = p_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data anggota tidak ditemukan.';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_is_authorized_user := (
      v_member.id = auth.uid()
      OR v_member.user_id = auth.uid()
      OR (public.is_staff() AND public.can_access_tenant(v_member.tenant_id))
    );
  END IF;

  IF v_member.user_id IS NOT NULL AND NOT v_is_authorized_user THEN
    RAISE EXCEPTION 'Akun anggota ini sudah aktif. Silakan login untuk memperbarui biodata di menu Profil.';
  END IF;

  v_has_valid_token := (
    p_token IS NOT NULL
    AND LENGTH(TRIM(p_token)) >= 16
    AND v_member.completion_token IS NOT NULL
    AND v_member.completion_token = TRIM(p_token)
    AND v_member.completion_token_expires_at IS NOT NULL
    AND v_member.completion_token_expires_at > now()
  );

  IF NOT v_is_authorized_user AND NOT v_has_valid_token THEN
    RAISE EXCEPTION 'Tautan pemutakhiran data tidak valid atau sudah kedaluwarsa. Minta tautan baru ke pengurus.';
  END IF;

  PERFORM set_config('pmii.internal_rpc', 'on', true);

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
      avatar = COALESCE(NULLIF(TRIM(p_payload->>'avatar'), ''), avatar),
      -- Single-use: cabut token setelah pemutakhiran berhasil
      completion_token = NULL,
      completion_token_expires_at = NULL
  WHERE id = p_id;

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

GRANT EXECUTE ON FUNCTION public.complete_anggota_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. TUTUP CELAH LINTAS-TENANT DI update_auth_user, delete_user_from_auth,
--    kurikulum, DAN PERKETAT resolve_login_email
-- ------------------------------------------------------------------------------
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
  v_filtered_menus JSONB;
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

  v_target_role := LOWER(TRIM(COALESCE(NULLIF(v_user.raw_app_meta_data->>'role', ''), 'anggota')));
  v_target_tenant := CASE WHEN (v_user.raw_app_meta_data->>'tenant_id') ~ '^[0-9a-fA-F-]{36}$' THEN (v_user.raw_app_meta_data->>'tenant_id')::uuid ELSE NULL END;

  -- Proteksi hirarki & tenant KETAT untuk staf komisariat (termasuk menolak target tenant NULL!)
  IF v_caller_is_staff AND NOT v_caller_is_cabang THEN
    IF v_target_role IN ('superadmin', 'admin', 'ketua_cabang', 'pengurus_cabang') OR v_target_role LIKE '%cabang%' THEN
      RAISE EXCEPTION 'Forbidden: Pengurus komisariat tidak dapat mengubah akun Cabang/Superadmin.';
    END IF;
    IF p_user_id <> v_caller_uid AND (v_target_tenant IS NULL OR v_target_tenant <> public.current_user_tenant_id()) THEN
      RAISE EXCEPTION 'Forbidden: Akun berada di luar komisariat Anda.';
    END IF;
    -- Staf komisariat tidak boleh memindahkan akun ke tenant lain
    p_komisariat_id := NULL;
    p_commissariat := NULL;
    v_resolved_tenant_id := NULL;
    -- Saring menu khusus cabang dari p_allowed_menus
    IF p_allowed_menus IS NOT NULL AND jsonb_typeof(p_allowed_menus) = 'array' THEN
      SELECT COALESCE(jsonb_agg(m), '[]'::jsonb)
      INTO v_filtered_menus
      FROM jsonb_array_elements_text(p_allowed_menus) AS m
      WHERE m NOT ILIKE '%/tenant%'
        AND m NOT ILIKE '%/admin%';
      p_allowed_menus := v_filtered_menus;
    END IF;
  END IF;

  IF v_target_role = 'superadmin' AND NOT v_caller_is_super AND p_user_id <> v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: Hanya Superadmin yang dapat mengubah akun Superadmin lain.';
  END IF;

  -- Non-staf hanya boleh memperbarui nama & kata sandi sendiri (bukan email/role/status/tenant/menus)
  IF NOT v_caller_is_staff THEN
    p_email := NULL;
    p_role := NULL;
    p_status := NULL;
    p_allowed_menus := NULL;
    p_komisariat_id := NULL;
    p_commissariat := NULL;
    v_resolved_tenant_id := NULL;
  END IF;

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

  IF v_caller_uid IS NOT NULL AND v_target_id = v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: Tidak dapat menghapus akun Anda sendiri.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_id AND LOWER(email) = 'admin@pmii.org') THEN
    RAISE EXCEPTION 'Master Administrator tidak dapat dihapus.';
  END IF;

  SELECT
    LOWER(TRIM(COALESCE(NULLIF(raw_app_meta_data->>'role', ''), 'anggota'))),
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
      -- Wajib cocok dengan tenant pemanggil (menolak target tenant NULL!)
      IF v_target_tenant IS NULL OR v_target_tenant <> public.current_user_tenant_id() THEN
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

-- Kurikulum RLS: hanya Cabang Admin / Instruktur untuk tulis, dan hanya Cabang Admin untuk hapus
DROP POLICY IF EXISTS "kurikulum_staff_manage" ON public.kurikulum;
DROP POLICY IF EXISTS "kurikulum_cabang_or_instruktur_write" ON public.kurikulum;
DROP POLICY IF EXISTS "kurikulum_cabang_or_instruktur_update" ON public.kurikulum;
DROP POLICY IF EXISTS "kurikulum_cabang_delete" ON public.kurikulum;

CREATE POLICY "kurikulum_cabang_or_instruktur_write" ON public.kurikulum
  FOR INSERT TO authenticated
  WITH CHECK (public.is_cabang_admin() OR public.current_user_role() LIKE '%instruktur%');

CREATE POLICY "kurikulum_cabang_or_instruktur_update" ON public.kurikulum
  FOR UPDATE TO authenticated
  USING (public.is_cabang_admin() OR public.current_user_role() LIKE '%instruktur%')
  WITH CHECK (public.is_cabang_admin() OR public.current_user_role() LIKE '%instruktur%');

CREATE POLICY "kurikulum_cabang_delete" ON public.kurikulum
  FOR DELETE TO authenticated
  USING (public.is_cabang_admin());

-- Perketat resolve_login_email: hanya kecocokan eksak NIM/NIPA/NTA atau username (>= 4 char), tanpa harvesting nama/HP
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean TEXT := LOWER(TRIM(COALESCE(p_identifier, '')));
  v_email TEXT;
BEGIN
  IF LENGTH(v_clean) < 4 THEN
    RETURN NULL;
  END IF;

  IF v_clean = 'admin' THEN
    RETURN 'admin@pmii.org';
  END IF;

  IF POSITION('@' IN v_clean) > 0 THEN
    RETURN v_clean;
  END IF;

  SELECT LOWER(TRIM(a.email))
  INTO v_email
  FROM public.anggota a
  WHERE a.email IS NOT NULL AND TRIM(a.email) <> ''
    AND (
      LOWER(TRIM(COALESCE(a.nim, ''))) = v_clean
      OR LOWER(TRIM(COALESCE(a.nipa, ''))) = v_clean
      OR LOWER(TRIM(COALESCE(a.nta, ''))) = v_clean
      OR LOWER(split_part(a.email, '@', 1)) = v_clean
    )
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  SELECT LOWER(TRIM(u.email))
  INTO v_email
  FROM auth.users u
  WHERE u.deleted_at IS NULL
    AND LOWER(split_part(u.email, '@', 1)) = v_clean
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. STORAGE HARDENING: MIME ALLOWLIST KETAT & TENANT-PATH ISOLATION
-- ------------------------------------------------------------------------------
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]
WHERE id = 'materials';

-- Hapus image/svg+xml dari bucket komisariat (anti stored XSS)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]
WHERE id = 'komisariat';

-- Perbarui allowed_mime_types private-docs agar mendukung CSV/XLSX juga untuk berkas SK/Arsip
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]
WHERE id = 'private-docs';

CREATE OR REPLACE FUNCTION public.can_access_storage_object(p_owner UUID, p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (auth.uid() IS NOT NULL AND p_owner = auth.uid())
    OR public.is_cabang_admin()
    OR (
      public.is_staff()
      AND (
        split_part(COALESCE(p_object_name, ''), '/', 1) = COALESCE(public.current_user_tenant_id()::text, '')
        -- Kompatibilitas mundur untuk objek lama yang belum berprefiks UUID tenant
        OR split_part(COALESCE(p_object_name, ''), '/', 1) !~ '^[0-9a-fA-F-]{36}$'
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_storage_object(UUID, TEXT) TO authenticated, service_role;

DROP POLICY IF EXISTS "Private Docs Staff Or Owner Select" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Materials Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Update Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete Storage Objects" ON storage.objects;

CREATE POLICY "Private Docs Staff Or Owner Select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'private-docs'
  AND public.can_access_storage_object(owner, name)
);

-- Batasi upload anon hanya ke folder registrations/% (MIME sudah dikunci di level bucket)
CREATE POLICY "Allow Upload Materials Objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND (
    auth.role() = 'authenticated'
    OR name LIKE 'registrations/%'
  )
);

CREATE POLICY "Allow Authenticated Update Storage Objects"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND public.can_access_storage_object(owner, name)
)
WITH CHECK (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND public.can_access_storage_object(owner, name)
);

CREATE POLICY "Allow Authenticated Delete Storage Objects"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('materials', 'komisariat', 'pas-foto', 'galeri', 'private-docs')
  AND public.can_access_storage_object(owner, name)
);
