-- ==============================================================================
-- Migration: Rename kolom kader_id menjadi anggota_id pada tabel pengurus
-- Tanggal: 03 November 2026
-- Deskripsi: Mengubah nama kolom foreign key 'kader_id' menjadi 'anggota_id' 
--            pada tabel 'pengurus' agar konsisten dengan nama tabel master 'anggota'.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Periksa apakah tabel pengurus ada
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengurus') THEN

    -- A. Jika kolom kader_id ada dan anggota_id belum ada, ubah namanya
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'kader_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'anggota_id'
    ) THEN
      ALTER TABLE public.pengurus RENAME COLUMN kader_id TO anggota_id;
      RAISE NOTICE 'Kolom kader_id pada tabel pengurus berhasil diubah menjadi anggota_id.';
    
    -- B. Jika anggota_id sama sekali belum ada dan kader_id juga tidak ada, buat kolom anggota_id baru
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'pengurus' AND column_name = 'anggota_id'
    ) THEN
      ALTER TABLE public.pengurus ADD COLUMN anggota_id UUID;
      RAISE NOTICE 'Kolom anggota_id berhasil ditambahkan pada tabel pengurus.';
    END IF;

    -- 2. Pastikan foreign key mengarah ke public.anggota(id) jika tabel anggota ada
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anggota') THEN
      -- Hapus foreign key lama jika ada
      ALTER TABLE public.pengurus DROP CONSTRAINT IF EXISTS fk_pengurus_kader;
      ALTER TABLE public.pengurus DROP CONSTRAINT IF EXISTS pengurus_kader_id_fkey;
      ALTER TABLE public.pengurus DROP CONSTRAINT IF EXISTS pengurus_anggota_id_fkey;

      -- Tambahkan foreign key baru yang valid
      ALTER TABLE public.pengurus 
        ADD CONSTRAINT pengurus_anggota_id_fkey 
        FOREIGN KEY (anggota_id) REFERENCES public.anggota(id) ON DELETE SET NULL;
    END IF;

    -- 3. Perbarui Index untuk anggota_id
    DROP INDEX IF EXISTS public.idx_pengurus_kader_id;
    CREATE INDEX IF NOT EXISTS idx_pengurus_anggota_id ON public.pengurus(anggota_id);

  END IF;
END $$;

