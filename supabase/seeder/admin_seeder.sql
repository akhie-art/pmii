-- ==============================================================================
-- SUPABASE SEEDER & CLEANUP: 1 AKUN SUPERADMIN & BERSIHKAN SELURUH DATA
-- File: supabase/seeder/admin_seeder.sql
-- Deskripsi: 
-- 1. Mengosongkan (WIPE) seluruh data operasional, transaksi, profil, dan user auth lama.
-- 2. Memastikan master data 6 roles dan 5 tenant resmi (Cabang + 4 Komisariat) tersedia.
-- 3. Membuat tepat 1 akun resmi Super Administrator (role: superadmin, global access).
--
-- Kredensial Akun Superadmin:
-- Email    : admin@pmii.org
-- Password : admin123
-- Role     : superadmin
-- Nama     : Super Administrator PMII
-- Lingkup  : Seluruh Sistem & Seluruh Tenant (Global Multi-Tenancy)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

DO $$
DECLARE
  v_admin_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
  v_role_id UUID := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_email TEXT := 'admin@pmii.org';
  v_password TEXT := 'admin123';
  v_name TEXT := 'Super Administrator PMII';
  v_role TEXT := 'superadmin';
  v_commissariat TEXT := 'Pusat / Super Administrator';
  v_level TEXT := 'SUPERADMIN';
  v_hashed_password TEXT;
BEGIN
  RAISE NOTICE '🧹 [1/4] Membersihkan seluruh data operasional dan akun pengguna lama...';

  -- Lepas relasi pemilik objek storage ke auth.users agar DELETE auth.users tidak terblokir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    UPDATE storage.objects SET owner = NULL WHERE owner IS NOT NULL;
  END IF;

  -- 1. BERSIHKAN SEMUA DATA OPERASIONAL & TRANSAKSIONAL
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluations') THEN
    DELETE FROM public.evaluations;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pendaftaran') THEN
    DELETE FROM public.pendaftaran;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kegiatan') THEN
    DELETE FROM public.kegiatan;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN
    DELETE FROM public.pengurus;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surat') THEN
    DELETE FROM public.surat;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'arsip') THEN
    DELETE FROM public.arsip;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
    DELETE FROM public.articles;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kaderisasi') THEN
    DELETE FROM public.kaderisasi;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kurikulum') THEN
    DELETE FROM public.kurikulum;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'persyaratan') THEN
    DELETE FROM public.persyaratan;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surat_templates') THEN
    DELETE FROM public.surat_templates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengaturan') THEN
    DELETE FROM public.pengaturan;
  END IF;

  -- Bersihkan tabel-tabel profil / pengguna lama
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
    DELETE FROM public.anggota;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kader') THEN
    DELETE FROM public.kader;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengguna') THEN
    DELETE FROM public.pengguna;
  END IF;

  -- Bersihkan seluruh user dari Supabase Auth
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
    DELETE FROM auth.identities;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DELETE FROM auth.users;
  END IF;

  RAISE NOTICE '🛡️ [2/4] Memastikan master entitas 6 roles standar tersedia...';

  -- -------------------------------------------------------------
  -- 2. PASTIKAN 6 MASTER ROLES TERSEDIA
  -- -------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    INSERT INTO public.roles (id, code, allowed_menus)
    VALUES
      (
        'b0000000-0000-0000-0000-000000000001'::uuid,
        'superadmin',
        '["/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi", "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel", "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi", "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000002'::uuid,
        'admin',
        '["/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi", "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel", "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi", "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000003'::uuid,
        'pengurus',
        '["/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi", "/pengurus/pengurus", "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel", "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000004'::uuid,
        'instruktur',
        '["/instruktur", "/instruktur/penilaian", "/instruktur/rekap-nilai", "/instruktur/materi", "/instruktur/kegiatan", "/instruktur/anggota", "/instruktur/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000005'::uuid,
        'anggota',
        '["/kader", "/kader/kegiatan", "/kader/tugas", "/kader/sertifikat", "/kader/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000006'::uuid,
        'peserta',
        '["/peserta", "/peserta/status", "/peserta/berkas", "/peserta/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000011'::uuid,
        'ketua_cabang',
        '["/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi", "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel", "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi", "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000012'::uuid,
        'ketua_komisariat',
        '["/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi", "/pengurus/pengurus", "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel", "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000013'::uuid,
        'pengurus_cabang',
        '["/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi", "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel", "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi", "/admin/komisariat", "/admin/profil"]'::jsonb
      ),
      (
        'b0000000-0000-0000-0000-000000000014'::uuid,
        'pengurus_komisariat',
        '["/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi", "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel", "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"]'::jsonb
      )
    ON CONFLICT (id) DO UPDATE
    SET code = EXCLUDED.code,
        allowed_menus = EXCLUDED.allowed_menus;
  END IF;

  RAISE NOTICE '🏢 [3/4] Memastikan master entitas 5 tenant resmi (Cabang + 4 Komisariat)...';

  -- -------------------------------------------------------------
  -- 3. PASTIKAN 5 MASTER TENANT TERSEDIA DENGAN BERSIH
  -- -------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant') THEN
    INSERT INTO public.tenant (id, name, university, status, contactEmail, establishedYear, level, type, structure)
    VALUES
      (
        'c0000000-0000-0000-0000-000000000001'::uuid,
        'Pengurus Cabang PMII Grobogan',
        'PC PMII Kabupaten Grobogan',
        'AKTIF',
        'cabang.grobogan@pmii.org',
        2015,
        'CABANG',
        'CABANG',
        '{}'::jsonb
      ),
      (
        '13aea81b-ca8c-43c2-b44f-7d70cdc11f7f'::uuid,
        'Komisariat Ki Ageng Getas Pendawa',
        'Universitas An Nuur',
        'AKTIF',
        'getaspendawa@pmii.org',
        2018,
        'KOMISARIAT',
        'KOMISARIAT',
        '{}'::jsonb
      ),
      (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'Komisariat Ki Ageng Tarub',
        'Universitas Bahrul Ulum',
        'AKTIF',
        'tarub@pmii.org',
        2019,
        'KOMISARIAT',
        'KOMISARIAT',
        '{}'::jsonb
      ),
      (
        '33333333-3333-3333-3333-333333333333'::uuid,
        'Komisariat Ajisaka',
        'STAI Grobogan',
        'AKTIF',
        'ajisaka@pmii.org',
        2020,
        'KOMISARIAT',
        'KOMISARIAT',
        '{}'::jsonb
      ),
      (
        '44444444-4444-4444-4444-444444444444'::uuid,
        'Komisariat Joko Suro',
        'Universitas Karya Bangsa',
        'AKTIF',
        'jokosuro@pmii.org',
        2021,
        'KOMISARIAT',
        'KOMISARIAT',
        '{}'::jsonb
      )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        university = EXCLUDED.university,
        status = EXCLUDED.status,
        contactEmail = EXCLUDED.contactEmail,
        establishedYear = EXCLUDED.establishedYear,
        level = EXCLUDED.level,
        type = EXCLUDED.type;
  END IF;

  RAISE NOTICE '👤 [4/4] Membuat 1 akun resmi Super Administrator (admin@pmii.org / admin123)...';

  -- Hash password menggunakan blowfish (kompatibel Supabase GoTrue / pgcrypto)
  BEGIN
    v_hashed_password := extensions.crypt(v_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      v_hashed_password := crypt(v_password, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_hashed_password := '$2a$10$wT8KskY6jE64cZg3y.51f.gWvE4Ufq/QkZ0N42z32s5k6G0y4xK7S';
    END;
  END;

  -- -------------------------------------------------------------
  -- 4. SEED KE SUPABASE AUTH (auth.users & auth.identities)
  -- -------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
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
      v_admin_id,
      'authenticated',
      'authenticated',
      v_email,
      v_hashed_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', v_name,
        'role', v_role,
        'role_id', v_role_id,
        'role_name', 'Super Administrator',
        'commissariat', v_commissariat,
        'tenant_id', null
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = now();

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
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
        v_admin_id,
        v_admin_id,
        jsonb_build_object(
          'sub', v_admin_id::text,
          'email', v_email,
          'email_verified', true
        ),
        'email',
        v_email,
        now(),
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET identity_data = EXCLUDED.identity_data,
          updated_at = now();
    END IF;
  END IF;

  -- -------------------------------------------------------------
  -- 5. SEED KE TABEL public.anggota (Tabel profil utama)
  -- -------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
    INSERT INTO public.anggota (
      id,
      user_id,
      name,
      email,
      role,
      role_id,
      commissariat,
      tenant_id,
      status,
      level
    ) VALUES (
      v_admin_id,
      v_admin_id,
      v_name,
      v_email,
      v_role,
      v_role_id,
      v_commissariat,
      null,
      'AKTIF',
      v_level
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        role_id = EXCLUDED.role_id,
        commissariat = EXCLUDED.commissariat,
        tenant_id = EXCLUDED.tenant_id,
        status = EXCLUDED.status,
        level = EXCLUDED.level;
  END IF;

  RAISE NOTICE '=======================================================';
  RAISE NOTICE '🎉 DATABASE BERHASIL DI-RESET & DI-SEED!';
  RAISE NOTICE '👑 Akun Super Administrator:';
  RAISE NOTICE '   - Email    : %', v_email;
  RAISE NOTICE '   - Password : %', v_password;
  RAISE NOTICE '   - Role     : %', v_role;
  RAISE NOTICE '   - Role ID  : %', v_role_id;
  RAISE NOTICE '   - Tenant   : Global / Super Admin (tenant_id = null)';
  RAISE NOTICE '=======================================================';
END $$;
