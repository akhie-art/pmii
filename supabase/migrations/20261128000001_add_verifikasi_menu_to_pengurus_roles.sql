-- Migration: Pastikan role pengurus komisariat memiliki akses default ke menu /pengurus/verifikasi
-- Idempoten: hanya menambahkan '/pengurus/verifikasi' bila belum ada di allowed_menus.

UPDATE public.roles
SET allowed_menus = COALESCE(allowed_menus, '[]'::jsonb) || '["/pengurus/verifikasi"]'::jsonb
WHERE LOWER(TRIM(code)) IN ('pengurus', 'ketua_komisariat', 'pengurus_komisariat')
  AND NOT (COALESCE(allowed_menus, '[]'::jsonb) ? '/pengurus/verifikasi');
