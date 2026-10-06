-- Migration: Migrate to Supabase Auth (auth.users) as master and drop pengguna table
-- Description: Removes plaintext passwords, connects kader and pengurus to auth.users, and drops obsolete pengguna table

-- 1. Drop plaintext password column from kader if it exists (passwords are handled by auth.users)
ALTER TABLE IF EXISTS kader DROP COLUMN IF EXISTS password;

-- 2. Add user_id and allowed_menus to kader table
ALTER TABLE IF EXISTS kader 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS allowed_menus JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_kader_user_id ON kader(user_id);

-- 3. Add user_id and kader_id to pengurus table
ALTER TABLE IF EXISTS pengurus 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kader_id UUID REFERENCES kader(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pengurus_user_id ON pengurus(user_id);
CREATE INDEX IF NOT EXISTS idx_pengurus_kader_id ON pengurus(kader_id);

-- 4. Drop obsolete pengguna table and its associated triggers/policies/indexes
DROP TRIGGER IF EXISTS trg_pengguna_created_at ON pengguna;
DROP POLICY IF EXISTS "allow_select" ON pengguna;
DROP POLICY IF EXISTS "allow_insert" ON pengguna;
DROP POLICY IF EXISTS "allow_update" ON pengguna;
DROP POLICY IF EXISTS "allow_delete" ON pengguna;
DROP TABLE IF EXISTS pengguna CASCADE;
