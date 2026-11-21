-- ==============================================================================
-- Migration: Drop legacy compatibility views (role, komisariat, kader)
-- Tanggal: 21 November 2026
-- Deskripsi: Menghapus view kompatibilitas legacy 'role', 'komisariat', dan 'kader'
--            karena sistem sudah sepenuhnya menggunakan tabel fisik 'roles',
--            'tenant', dan 'anggota'. Ini juga membersihkan peringatan 'UNRESTRICTED'
--            pada Supabase Security Advisor.
-- ==============================================================================

DROP VIEW IF EXISTS public.role CASCADE;
DROP VIEW IF EXISTS public.komisariat CASCADE;
DROP VIEW IF EXISTS public.kader CASCADE;
