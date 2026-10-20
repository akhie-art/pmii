-- ==============================================================================
-- Migration: Add Komisariat Foreign Keys to All Operational Tables
-- Timestamp: 20261015000001
-- Description:
-- Mengimplementasikan relasi Foreign Key (komisariat_id -> public.komisariat(id))
-- secara komprehensif pada SEMUA tabel operasional untuk mendukung arsitektur multi-tenant:
-- 1. kegiatan (Agenda & Acara)
-- 2. surat (Persuratan Digital)
-- 3. surat_templates (Template Surat Resmi)
-- 4. arsip (Dokumen & Berkas Digital)
-- 5. evaluations (Penilaian Peserta Kaderisasi)
-- 6. articles (Warta & Opini Pergerakan)
-- 7. pendaftaran (Registrasi Peserta Kegiatan)
-- 8. persyaratan (Syarat Penugasan & Follow Up)
-- 9. kaderisasi (Modul Pelatihan Formal/Informal)
-- Serta backfill otomatis data lama yang masih bertipe TEXT ke relasi UUID Foreign Key.
-- ==============================================================================

-- 1. Pastikan 4 Komisariat Resmi PMII Cabang Grobogan Tersedia
INSERT INTO public.komisariat (id, name, university, "contactEmail", "establishedYear", structure, rayons, created_at)
VALUES
  (
    '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f',
    'Komisariat Ki Ageng Getas Pendawa',
    'Universitas An Nuur',
    'getaspendawa@pmii.org',
    2018,
    '{"period": "2026 - 2027"}'::jsonb,
    '[]'::jsonb,
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Komisariat Ki Ageng Tarub',
    'Sekolah Tinggi Agama Islam Walisembilan Semarang',
    'kiagengtarub@pmii.org',
    2019,
    '{"period": "2026 - 2027"}'::jsonb,
    '[]'::jsonb,
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Komisariat Ajisaka',
    'Sekolah Tinggi Agama Islam Grobogan',
    'ajisaka@pmii.org',
    2020,
    '{"period": "2026 - 2027"}'::jsonb,
    '[]'::jsonb,
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Komisariat Joko Suro',
    'Sekolah Tinggi Agama Islam Walisembilan Semarang',
    'jokosuro@pmii.org',
    2021,
    '{"period": "2026 - 2027"}'::jsonb,
    '[]'::jsonb,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  "contactEmail" = EXCLUDED."contactEmail";

-- 2. Tambahkan Kolom Foreign Key ke Setiap Tabel Operasional
DO $$
BEGIN
  -- A. kegiatan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kegiatan' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.kegiatan 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- B. surat
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'surat' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.surat 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- C. surat_templates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'surat_templates' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.surat_templates 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- D. arsip
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'arsip' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.arsip 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- E. evaluations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.evaluations 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- F. articles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.articles 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- G. pendaftaran
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'pendaftaran' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.pendaftaran 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- H. persyaratan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'persyaratan' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.persyaratan 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;

  -- I. kaderisasi (NULL untuk kurikulum/modul tingkat Cabang)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kaderisasi' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.kaderisasi 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE SET NULL;
  END IF;

  -- J. anggota (Pastikan Foreign Key terpasang)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.anggota 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE SET NULL;
  END IF;

  -- K. pengurus (Pastikan Foreign Key terpasang)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'komisariat_id'
  ) THEN
    ALTER TABLE public.pengurus 
    ADD COLUMN komisariat_id UUID REFERENCES public.komisariat(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Backfill Otomatis Data Lama Berdasarkan Nama Komisariat
-- A. Backfill tabel kegiatan
UPDATE public.kegiatan k
SET komisariat_id = km.id
FROM public.komisariat km
WHERE k.komisariat_id IS NULL AND (
  k.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(k.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- B. Backfill tabel surat
UPDATE public.surat s
SET komisariat_id = km.id
FROM public.komisariat km
WHERE s.komisariat_id IS NULL AND (
  s.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(s.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- C. Backfill tabel surat_templates
UPDATE public.surat_templates st
SET komisariat_id = km.id
FROM public.komisariat km
WHERE st.komisariat_id IS NULL AND (
  st.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(st.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- D. Backfill tabel arsip
UPDATE public.arsip a
SET komisariat_id = km.id
FROM public.komisariat km
WHERE a.komisariat_id IS NULL AND (
  a.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(a.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- E. Backfill tabel evaluations
UPDATE public.evaluations e
SET komisariat_id = km.id
FROM public.komisariat km
WHERE e.komisariat_id IS NULL AND (
  e.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(e.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- F. Backfill tabel articles
UPDATE public.articles ar
SET komisariat_id = km.id
FROM public.komisariat km
WHERE ar.komisariat_id IS NULL AND (
  ar.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(ar.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- G. Backfill tabel pendaftaran dari event (kegiatan)
UPDATE public.pendaftaran p
SET komisariat_id = k.komisariat_id
FROM public.kegiatan k
WHERE p.komisariat_id IS NULL 
  AND p."eventId"::text = k.id::text
  AND k.komisariat_id IS NOT NULL;

-- H. Backfill tabel anggota
UPDATE public.anggota ag
SET komisariat_id = km.id
FROM public.komisariat km
WHERE ag.komisariat_id IS NULL AND (
  ag.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(ag.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
  OR km.university ILIKE '%' || TRIM(COALESCE(ag."perguruanTinggi", '')) || '%'
);

-- I. Backfill tabel pengurus
UPDATE public.pengurus pg
SET komisariat_id = km.id
FROM public.komisariat km
WHERE pg.komisariat_id IS NULL AND (
  pg.commissariat = km.name 
  OR km.name ILIKE '%' || TRIM(REPLACE(REPLACE(COALESCE(pg.commissariat, ''), 'Komisariat', ''), 'PK PMII', '')) || '%'
);

-- J. Fallback untuk data default 'Ki Ageng Getas Pendawa' yang belum terpetakan
UPDATE public.kegiatan SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.surat SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.surat_templates SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.arsip SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.evaluations SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.articles SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.pendaftaran SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;
UPDATE public.persyaratan SET komisariat_id = '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid WHERE komisariat_id IS NULL;

-- 4. Indeks Performa Query Berdasarkan Foreign Key
CREATE INDEX IF NOT EXISTS idx_kegiatan_komisariat_id ON public.kegiatan (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_surat_komisariat_id ON public.surat (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_surat_templates_komisariat_id ON public.surat_templates (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_arsip_komisariat_id ON public.arsip (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_komisariat_id ON public.evaluations (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_articles_komisariat_id ON public.articles (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_komisariat_id ON public.pendaftaran (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_persyaratan_komisariat_id ON public.persyaratan (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_kaderisasi_komisariat_id ON public.kaderisasi (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_anggota_komisariat_id ON public.anggota (komisariat_id);
CREATE INDEX IF NOT EXISTS idx_pengurus_komisariat_id ON public.pengurus (komisariat_id);

-- 5. Perbarui Fungsi create_auth_user & update_auth_user untuk Menyimpan komisariat_id
CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'pengurus',
  p_commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  p_status TEXT DEFAULT 'AKTIF',
  p_allowed_menus JSONB DEFAULT '[]'::jsonb,
  p_komisariat_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_resolved_komisariat_id UUID := p_komisariat_id;
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Format email tidak valid: %', p_email;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'Email % sudah terdaftar dalam sistem.', v_clean_email;
  END IF;

  -- Cari komisariat_id dari nama jika tidak diberikan secara langsung
  IF v_resolved_komisariat_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_komisariat_id 
    FROM public.komisariat 
    WHERE name = p_commissariat 
       OR name ILIKE '%' || TRIM(REPLACE(REPLACE(p_commissariat, 'Komisariat', ''), 'PK PMII', '')) || '%'
    LIMIT 1;
  END IF;

  BEGIN
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
  END;

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_clean_email,
    v_encrypted_pw,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'name', COALESCE(NULLIF(p_name, ''), split_part(v_clean_email, '@', 1)),
      'role', COALESCE(p_role, 'pengurus'),
      'commissariat', COALESCE(p_commissariat, 'Ki Ageng Getas Pendawa'),
      'komisariat_id', v_resolved_komisariat_id,
      'status', COALESCE(p_status, 'AKTIF'),
      'allowedMenus', COALESCE(p_allowed_menus, '[]'::jsonb)
    ),
    'authenticated',
    'authenticated',
    now(),
    now()
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
  )
  VALUES (
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
    'user_id', v_user_id,
    'email', v_clean_email,
    'name', p_name,
    'role', p_role,
    'commissariat', p_commissariat,
    'komisariat_id', v_resolved_komisariat_id,
    'status', p_status,
    'allowed_menus', p_allowed_menus,
    'created_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_auth_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO anon, authenticated, service_role;

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

  -- Selaraskan ke tabel anggota jika ada
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'anggota') THEN
    UPDATE public.anggota
    SET email = v_clean_email,
        name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name) ELSE name END,
        komisariat_id = COALESCE(v_resolved_komisariat_id, komisariat_id),
        commissariat = COALESCE(p_commissariat, commissariat)
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) TO anon, authenticated, service_role;
