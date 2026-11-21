-- ==============================================================================
-- Migration: High-Performance Database Indexes & Optimization
-- Tanggal: 21 November 2026
-- Deskripsi: Menerapkan paket optimasi index PostgreSQL untuk mempercepat:
--            1. Validasi login & pencarian email (Expression Index LOWER(email))
--            2. Pencarian cepat nama & NIM berbasis trigram GIN (pg_trgm)
--            3. Filter dashboard multi-tenant (tenant_id, status, created_at)
--            4. Query relasional pendaftaran, evaluasi, dan arsip
-- ==============================================================================

-- 1. Ekstensi Trigram untuk pencarian teks super cepat
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Optimasi Tabel Anggota
CREATE INDEX IF NOT EXISTS idx_anggota_lower_email 
  ON public.anggota (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_anggota_lower_name 
  ON public.anggota (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_anggota_name_trgm 
  ON public.anggota USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_anggota_nim_trgm 
  ON public.anggota USING gin (nim gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_anggota_user_id 
  ON public.anggota (user_id);

CREATE INDEX IF NOT EXISTS idx_anggota_tenant_status 
  ON public.anggota (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_anggota_created_at_desc 
  ON public.anggota (created_at DESC);

-- 3. Optimasi Tabel Pendaftaran
CREATE INDEX IF NOT EXISTS idx_pendaftaran_cadre_email 
  ON public.pendaftaran (LOWER("cadreEmail"));

CREATE INDEX IF NOT EXISTS idx_pendaftaran_event_status 
  ON public.pendaftaran ("eventId", status);

-- 4. Optimasi Tabel Evaluasi
CREATE INDEX IF NOT EXISTS idx_evaluations_cadre_id 
  ON public.evaluations ("cadreId");

-- 5. Optimasi Pengurutan Waktu (Arsip, Surat, Kegiatan, Galeri)
CREATE INDEX IF NOT EXISTS idx_arsip_created_at_desc 
  ON public.arsip (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_surat_created_at_desc 
  ON public.surat (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kegiatan_created_at_desc 
  ON public.kegiatan (created_at DESC);
