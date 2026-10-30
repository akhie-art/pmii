-- Migration: Create pengajuan_sk table for dual-direction SK approval workflow
CREATE TABLE IF NOT EXISTS public.pengajuan_sk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE,
    periode VARCHAR(50) NOT NULL,
    tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'DIAJUKAN',
    
    -- Berkas kelengkapan persyaratan (URLs in storage)
    berkas_surat_permohonan TEXT,
    berkas_berita_acara TEXT,
    berkas_susunan_pengurus TEXT,
    berkas_presensi TEXT,
    berkas_tambahan TEXT,

    -- Verifikasi oleh Pengurus Cabang
    catatan_revisi TEXT,
    diverifikasi_oleh VARCHAR(255),
    tanggal_verifikasi TIMESTAMP WITH TIME ZONE,
    
    -- Penerbitan SK Resmi
    tanggal_sk_terbit DATE,
    file_sk_resmi TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pengajuan_sk_status ON public.pengajuan_sk(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_sk_tenant_id ON public.pengajuan_sk(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_sk_created_at ON public.pengajuan_sk(created_at DESC);

-- Enable RLS
ALTER TABLE public.pengajuan_sk ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated & anon staff users
DROP POLICY IF EXISTS "pengajuan_sk_all" ON public.pengajuan_sk;
CREATE POLICY "pengajuan_sk_all" ON public.pengajuan_sk
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON TABLE public.pengajuan_sk TO anon, authenticated, service_role;
