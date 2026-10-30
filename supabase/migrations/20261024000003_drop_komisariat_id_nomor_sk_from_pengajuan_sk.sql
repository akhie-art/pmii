-- Migration: Drop redundant komisariat_id and nomor_sk_resmi from pengajuan_sk
ALTER TABLE public.pengajuan_sk
    DROP COLUMN IF EXISTS komisariat_id,
    DROP COLUMN IF EXISTS nomor_sk_resmi;
