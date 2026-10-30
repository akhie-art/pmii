-- Migration: Add Berita Acara Formatur, LPJ, and CV Pengurus to pengajuan_sk table
ALTER TABLE public.pengajuan_sk
    ADD COLUMN IF NOT EXISTS berkas_berita_acara_formatur TEXT,
    ADD COLUMN IF NOT EXISTS berkas_lpj TEXT,
    ADD COLUMN IF NOT EXISTS berkas_cv_pengurus TEXT;
