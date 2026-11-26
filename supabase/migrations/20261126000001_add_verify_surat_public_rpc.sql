-- ==============================================================================
-- Migration: Public Letter Verification RPC (QR Code Footer Verifikasi Surat)
-- File: supabase/migrations/20261126000001_add_verify_surat_public_rpc.sql
--
-- Deskripsi:
-- Menyediakan RPC publik sempit (SECURITY DEFINER) untuk memverifikasi keaslian
-- surat keluar (type = 'KELUAR') melalui pemindaian QR Code di footer surat,
-- tanpa membuka akses langsung ke tabel public.surat dan tanpa membocorkan
-- konten isi surat maupun tautan berkas privat (private-docs).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_surat_public(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  IF p_id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT
    s.id,
    s.nomor,
    s.type,
    s."senderOrRecipient" AS recipient,
    s.subject,
    s.date,
    s."dateIndo" AS date_indo,
    s.classification,
    s.status,
    s."senderTitle" AS sender_title,
    s."senderLocation" AS sender_location,
    s.created_at,
    COALESCE(t.name, 'Pengurus Cabang PMII Grobogan') AS tenant_name,
    COALESCE(t.level, t.type, 'KOMISARIAT') AS tenant_level
  INTO v_row
  FROM public.surat s
  LEFT JOIN public.tenant t ON t.id = s.tenant_id
  WHERE s.id = p_id
    AND UPPER(COALESCE(s.type, '')) = 'KELUAR'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', v_row.id,
    'nomor', v_row.nomor,
    'subject', v_row.subject,
    'senderOrRecipient', v_row.recipient,
    'classification', v_row.classification,
    'status', v_row.status,
    'date', v_row.date,
    'dateIndo', COALESCE(NULLIF(TRIM(v_row.date_indo), ''), v_row.date::text),
    'senderTitle', COALESCE(NULLIF(TRIM(v_row.sender_title), ''), '-'),
    'senderLocation', COALESCE(NULLIF(TRIM(v_row.sender_location), ''), '-'),
    'commissariat', v_row.tenant_name,
    'tenantLevel', v_row.tenant_level,
    'createdAt', v_row.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_surat_public(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_surat_public(UUID) TO anon, authenticated, service_role;

-- Segarkan schema cache PostgREST agar RPC langsung dikenali tanpa delay
NOTIFY pgrst, 'reload schema';
