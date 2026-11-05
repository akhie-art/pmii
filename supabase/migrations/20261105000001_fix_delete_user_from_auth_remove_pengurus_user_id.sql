-- ==============================================================================
-- Migration: Perbaiki fungsi delete_user_from_auth & delete_users_from_auth
-- Tanggal: 05 November 2026
-- Deskripsi: Menghapus referensi ke kolom 'pengurus.user_id' yang sudah tidak ada
--            (telah dihapus pada migrasi 20261103000009). Menggunakan pemeriksaan
--            skema dinamis agar aman dan tidak memicu:
--            "column 'user_id' does not exist".
-- ==============================================================================

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
  v_target_id UUID := p_user_id;
  v_clean_email TEXT;
BEGIN
  IF p_email IS NOT NULL AND TRIM(p_email) != '' THEN
    v_clean_email := LOWER(TRIM(p_email));
  END IF;

  IF v_target_id IS NULL AND v_clean_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Cari user_id di auth.users berdasarkan email jika p_user_id kosong atau belum valid
  IF v_target_id IS NULL AND v_clean_email IS NOT NULL THEN
    SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
  END IF;

  -- 2. Jika p_user_id tidak ditemukan di auth.users, coba cari di anggota jika kolom user_id tersedia
  IF v_target_id IS NULL AND v_clean_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'user_id'
    ) THEN
      EXECUTE 'SELECT user_id FROM public.anggota WHERE LOWER(email) = $1 AND user_id IS NOT NULL LIMIT 1'
      INTO v_target_id USING v_clean_email;
    END IF;
  END IF;

  IF v_target_id IS NULL THEN
    IF p_user_id IS NOT NULL THEN
      v_target_id := p_user_id;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  -- 3. Keamanan: Cegah penghapusan akun Master Administrator resmi
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_id AND LOWER(email) = 'admin@pmii.org') THEN
    RAISE NOTICE 'Master Administrator tidak dapat dihapus.';
    RETURN FALSE;
  END IF;

  -- 4. Hapus entri terkait di auth.identities
  DELETE FROM auth.identities WHERE user_id = v_target_id;

  -- 5. Lepaskan relasi user_id dari tabel anggota secara dinamis jika kolomnya tersedia
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'anggota' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'UPDATE public.anggota SET user_id = NULL WHERE user_id = $1' USING v_target_id;
  END IF;

  -- 6. Hapus akun dari auth.users
  DELETE FROM auth.users WHERE id = v_target_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_from_auth(UUID, TEXT) TO anon, authenticated, service_role;

-- Perbarui juga fungsi delete_users_from_auth (Bulk Delete)
CREATE OR REPLACE FUNCTION public.delete_users_from_auth(
  p_user_ids UUID[] DEFAULT '{}',
  p_emails TEXT[] DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_count INTEGER := 0;
  v_id UUID;
  v_email TEXT;
BEGIN
  IF p_user_ids IS NOT NULL THEN
    FOREACH v_id IN ARRAY p_user_ids LOOP
      IF v_id IS NOT NULL AND public.delete_user_from_auth(v_id, NULL) THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  IF p_emails IS NOT NULL THEN
    FOREACH v_email IN ARRAY p_emails LOOP
      IF v_email IS NOT NULL AND TRIM(v_email) != '' AND public.delete_user_from_auth(NULL, v_email) THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_users_from_auth(UUID[], TEXT[]) TO anon, authenticated, service_role;

