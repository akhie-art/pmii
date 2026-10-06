-- Migration: Drop password column from pengguna table
-- Description: Passwords are now securely managed by Supabase Auth (auth.users)

-- Drop password column from pengguna if it exists
ALTER TABLE IF EXISTS pengguna DROP COLUMN IF EXISTS password;
