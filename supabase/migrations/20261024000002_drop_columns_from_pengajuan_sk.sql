-- Migration: Drop redundant columns from pengajuan_sk
ALTER TABLE public.pengajuan_sk
    DROP COLUMN IF EXISTS nomor_pengajuan,
    DROP COLUMN IF EXISTS nama_komisariat,
    DROP COLUMN IF EXISTS tingkat_kepengurusan,
    DROP COLUMN IF EXISTS nama_rayon,
    DROP COLUMN IF EXISTS ketua_terpilih,
    DROP COLUMN IF EXISTS kontak_pemohon,
    DROP COLUMN IF EXISTS tanggal_rtk;
