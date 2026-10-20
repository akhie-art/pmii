-- ==============================================================================
-- Migration: Drop commissariat column from operational tables
-- Timestamp: 20261015000002
-- Description:
-- Menghapus kolom redundan 'commissariat' dari 8 tabel operasional:
-- 1. public.kegiatan
-- 2. public.pengurus
-- 3. public.surat
-- 4. public.arsip
-- 5. public.articles
-- 6. public.evaluations
-- 7. public.surat_templates
-- 8. public.anggota
-- Relasi tenant kini sepenuhnya dan secara murni menggunakan Foreign Key 'komisariat_id'.
-- ==============================================================================

-- 1. Backfill sinkronisasi terakhir sebelum kolom dihapus (data-safety)
UPDATE public.kegiatan k
SET komisariat_id = km.id
FROM public.komisariat km
WHERE k.komisariat_id IS NULL AND (
  k.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(k.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.pengurus pg
SET komisariat_id = km.id
FROM public.komisariat km
WHERE pg.komisariat_id IS NULL AND (
  pg.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(pg.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.surat s
SET komisariat_id = km.id
FROM public.komisariat km
WHERE s.komisariat_id IS NULL AND (
  s.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(s.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.arsip a
SET komisariat_id = km.id
FROM public.komisariat km
WHERE a.komisariat_id IS NULL AND (
  a.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(a.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.articles ar
SET komisariat_id = km.id
FROM public.komisariat km
WHERE ar.komisariat_id IS NULL AND (
  ar.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(ar.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.evaluations e
SET komisariat_id = km.id
FROM public.komisariat km
WHERE e.komisariat_id IS NULL AND (
  e.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(e.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.surat_templates st
SET komisariat_id = km.id
FROM public.komisariat km
WHERE st.komisariat_id IS NULL AND (
  st.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(st.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

UPDATE public.anggota ag
SET komisariat_id = km.id
FROM public.komisariat km
WHERE ag.komisariat_id IS NULL AND (
  ag.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(ag.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
  OR km.university ILIKE '%' || TRIM(COALESCE(ag."perguruanTinggi", '')) || '%'
);

-- 2. Drop index lama pada kolom commissariat
DROP INDEX IF EXISTS public.idx_kader_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_anggota_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_kegiatan_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_pengurus_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_surat_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_arsip_commissariat CASCADE;
DROP INDEX IF EXISTS public.idx_articles_commissariat CASCADE;

-- 3. Hapus kolom commissariat dari 8 tabel operasional
ALTER TABLE public.kegiatan DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.pengurus DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.surat DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.arsip DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.articles DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.evaluations DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.surat_templates DROP COLUMN IF EXISTS commissariat CASCADE;
ALTER TABLE public.anggota DROP COLUMN IF EXISTS commissariat CASCADE;

-- 4. Perbarui fungsi update_auth_user agar tidak lagi mencoba mengupdate public.anggota.commissariat
CREATE OR REPLACE FUNCTION public.update_auth_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'anggota',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  p_status TEXT DEFAULT 'AKTIF',
  p_allowed_menus JSONB DEFAULT '[]'::jsonb,
  p_password TEXT DEFAULT NULL,
  p_komisariat_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_hashed_password TEXT;
  v_resolved_komisariat_id UUID := p_komisariat_id;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Cari komisariat_id dari nama jika tidak diberikan
  IF v_resolved_komisariat_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_komisariat_id 
    FROM public.komisariat 
    WHERE name = p_commissariat 
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(p_commissariat, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
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
        'komisariat_id', v_resolved_komisariat_id,
        'status', p_status,
        'allowedMenus', COALESCE(p_allowed_menus, '[]'::jsonb)
      ),
      updated_at = now()
  WHERE id = p_user_id;

  -- Update identitas login
  UPDATE auth.identities
  SET identity_data = jsonb_build_object('sub', p_user_id::text, 'email', v_clean_email, 'email_verified', true),
      provider_id = v_clean_email,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Selaraskan ke tabel anggota jika ada (menggunakan Foreign Key komisariat_id)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota
    SET email = v_clean_email,
        name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name) ELSE name END,
        komisariat_id = COALESCE(v_resolved_komisariat_id, komisariat_id)
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) TO anon, authenticated, service_role;
