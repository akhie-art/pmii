-- ==============================================================================
-- Migration: Rename komisariat table to tenant and standardize foreign keys
-- Timestamp: 20261015000003
-- Description:
-- 1. Mengubah nama tabel 'komisariat' menjadi 'tenant'.
-- 2. Menambahkan kolom 'type' dan 'level' pada tabel tenant ('CABANG' vs 'KOMISARIAT').
-- 3. Mendaftarkan 'Pengurus Cabang PMII Grobogan' sebagai tenant resmi tingkat CABANG.
-- 4. Mengubah nama kolom foreign key 'komisariat_id' menjadi 'tenant_id' pada seluruh tabel operasional.
-- 5. Melakukan backfill: data cabang yang sebelumnya NULL kini memiliki tenant_id Cabang.
-- 6. Memperbarui foreign key constraint ke public.tenant(id).
-- 7. Memperbarui RPC helper functions (create_auth_user, update_auth_user).
-- 8. Membuat VIEW public.komisariat untuk kompatibilitas penuh.
-- ==============================================================================

-- 1. Rename table komisariat menjadi tenant jika tabel tenant belum ada
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'komisariat')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant') THEN
    ALTER TABLE public.komisariat RENAME TO tenant;
    RAISE NOTICE 'Tabel komisariat berhasil di-rename menjadi tenant.';
  END IF;
END $$;

-- 2. Tambahkan kolom level dan type pada tabel tenant jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN level TEXT DEFAULT 'KOMISARIAT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN type TEXT DEFAULT 'KOMISARIAT';
  END IF;
END $$;

-- 3. Daftarkan Pengurus Cabang Grobogan sebagai Tenant Resmi Level CABANG
INSERT INTO public.tenant (
  id,
  name,
  university,
  level,
  type,
  "contactEmail",
  "establishedYear",
  structure,
  rayons,
  created_at
)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Pengurus Cabang PMII Grobogan',
  'Kabupaten Grobogan',
  'CABANG',
  'CABANG',
  'pcpmiigrobogan@gmail.com',
  1960,
  '{"period": "2026 - 2027"}'::jsonb,
  '[]'::jsonb,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  level = 'CABANG',
  type = 'CABANG',
  university = EXCLUDED.university,
  "contactEmail" = EXCLUDED."contactEmail";

-- Pastikan 4 komisariat memiliki level KOMISARIAT
UPDATE public.tenant
SET level = 'KOMISARIAT', type = 'KOMISARIAT'
WHERE id != 'c0000000-0000-0000-0000-000000000001';

-- 4. Ubah nama kolom komisariat_id menjadi tenant_id pada seluruh tabel operasional
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'kegiatan',
    'pengurus',
    'surat',
    'arsip',
    'articles',
    'evaluations',
    'surat_templates',
    'anggota',
    'pendaftaran',
    'persyaratan',
    'kaderisasi'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Cek jika kolom komisariat_id ada dan tenant_id belum ada, rename kolom
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'komisariat_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN komisariat_id TO tenant_id;', tbl);
      RAISE NOTICE 'Kolom komisariat_id pada % berhasil diubah menjadi tenant_id.', tbl;
    -- Jika kolom tenant_id belum ada sama sekali, tambahkan
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE;', tbl);
      RAISE NOTICE 'Kolom tenant_id pada % berhasil ditambahkan.', tbl;
    END IF;
  END LOOP;
END $$;

-- 5. Backfill data Cabang: data yang sebelumnya tenant_id IS NULL kini dikaitkan ke UUID Cabang
UPDATE public.kegiatan SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.surat SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.surat_templates SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.arsip SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.articles SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.persyaratan SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.kaderisasi SET tenant_id = 'c0000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;

-- 6. Buat indeks performa untuk tenant_id
CREATE INDEX IF NOT EXISTS idx_kegiatan_tenant_id ON public.kegiatan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pengurus_tenant_id ON public.pengurus (tenant_id);
CREATE INDEX IF NOT EXISTS idx_surat_tenant_id ON public.surat (tenant_id);
CREATE INDEX IF NOT EXISTS idx_arsip_tenant_id ON public.arsip (tenant_id);
CREATE INDEX IF NOT EXISTS idx_articles_tenant_id ON public.articles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_tenant_id ON public.evaluations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_surat_templates_tenant_id ON public.surat_templates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_anggota_tenant_id ON public.anggota (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tenant_id ON public.pendaftaran (tenant_id);
CREATE INDEX IF NOT EXISTS idx_persyaratan_tenant_id ON public.persyaratan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_kaderisasi_tenant_id ON public.kaderisasi (tenant_id);

-- 7. Perbarui fungsi create_auth_user & update_auth_user untuk mendukung tenant_id
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
  v_resolved_tenant_id UUID := p_komisariat_id;
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Format email tidak valid: %', p_email;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'Email % sudah terdaftar dalam sistem.', v_clean_email;
  END IF;

  -- Cari tenant_id jika tidak diberikan
  IF v_resolved_tenant_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_tenant_id 
    FROM public.tenant 
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
      'tenant_id', v_resolved_tenant_id,
      'komisariat_id', v_resolved_tenant_id,
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
    'tenant_id', v_resolved_tenant_id,
    'komisariat_id', v_resolved_tenant_id,
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
  v_resolved_tenant_id UUID := p_komisariat_id;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Cari tenant_id jika tidak diberikan
  IF v_resolved_tenant_id IS NULL AND p_commissariat IS NOT NULL AND p_commissariat != '' THEN
    SELECT id INTO v_resolved_tenant_id 
    FROM public.tenant 
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
        'tenant_id', v_resolved_tenant_id,
        'komisariat_id', v_resolved_tenant_id,
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
        tenant_id = COALESCE(v_resolved_tenant_id, tenant_id)
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_auth_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID) TO anon, authenticated, service_role;

-- 8. Buat VIEW public.komisariat untuk kompatibilitas penuh kode lama
CREATE OR REPLACE VIEW public.komisariat AS
SELECT * FROM public.tenant;

-- 9. Berikan izin akses penuh pada tabel tenant dan view komisariat
GRANT ALL ON TABLE public.tenant TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.komisariat TO anon, authenticated, service_role;
