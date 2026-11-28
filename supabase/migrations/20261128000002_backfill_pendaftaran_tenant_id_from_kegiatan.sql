-- ==============================================================================
-- Migration: 20261128000002_backfill_pendaftaran_tenant_id_from_kegiatan.sql
-- Deskripsi:
--   1. Backfill tenant_id pada public.pendaftaran & public.evaluations agar
--      selaras dengan tenant_id kegiatan (memulihkan pendaftar manual/lama yang
--      sebelumnya ter-stamp CABANG_TENANT_ID atau NULL sehingga tersembunyi RLS).
--   2. Memperketat trigger protect_pendaftaran_privileged_columns agar setiap
--      INSERT pada pendaftaran (baik publik maupun staf) selalu menyelaraskan
--      NEW.tenant_id dengan public.kegiatan.tenant_id sebelum evaluasi RLS.
-- ==============================================================================

-- 1. Backfill tenant_id pendaftaran berdasarkan kegiatan terkait
UPDATE public.pendaftaran p
SET tenant_id = k.tenant_id
FROM public.kegiatan k
WHERE TRIM(COALESCE(p."eventId", '')) = k.id::text
  AND k.tenant_id IS NOT NULL
  AND p.tenant_id IS DISTINCT FROM k.tenant_id;

-- 2. Backfill tenant_id evaluations berdasarkan kegiatan terkait
UPDATE public.evaluations e
SET tenant_id = k.tenant_id
FROM public.kegiatan k
WHERE TRIM(COALESCE(e."activityId", '')) = k.id::text
  AND k.tenant_id IS NOT NULL
  AND e.tenant_id IS DISTINCT FROM k.tenant_id;

-- 3. Pastikan trigger BEFORE INSERT pendaftaran selalu menyelaraskan tenant_id
--    dari tabel kegiatan sebelum policy RLS WITH CHECK dievaluasi
CREATE OR REPLACE FUNCTION public.protect_pendaftaran_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_event_tenant UUID;
BEGIN
  IF NEW."eventId" IS NOT NULL AND TRIM(NEW."eventId") <> '' THEN
    SELECT tenant_id INTO v_event_tenant
    FROM public.kegiatan
    WHERE id::text = TRIM(NEW."eventId")
    LIMIT 1;
    IF v_event_tenant IS NOT NULL THEN
      NEW.tenant_id := v_event_tenant;
    END IF;
  END IF;

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

  RETURN NEW;
END;
$$;
