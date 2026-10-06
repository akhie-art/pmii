-- Migration: Sync kader and auth schema
-- Description: Menghapus allowedMenus dari tabel kader (dialihkan ke metadata autentikasi user), 
--              menambahkan kolom ktpFileUrl dan ktmFileUrl pada tabel kader, serta optimasi indeks pencarian.

-- 1. Bersihkan kolom hak akses menu dari tabel kader (hak akses dikelola pada level pengguna/auth)
ALTER TABLE IF EXISTS kader DROP COLUMN IF EXISTS "allowedMenus";
ALTER TABLE IF EXISTS kader DROP COLUMN IF EXISTS allowed_menus;

-- 2. Tambahkan kolom berkas digital KTP dan KTM jika belum ada
ALTER TABLE IF EXISTS kader ADD COLUMN IF NOT EXISTS "ktpFileUrl" TEXT;
ALTER TABLE IF EXISTS kader ADD COLUMN IF NOT EXISTS "ktmFileUrl" TEXT;

-- 3. Tambahkan indeks pencarian untuk login dan filter data kader
CREATE INDEX IF NOT EXISTS idx_kader_name ON kader(name);
CREATE INDEX IF NOT EXISTS idx_kader_nik ON kader(nik);
