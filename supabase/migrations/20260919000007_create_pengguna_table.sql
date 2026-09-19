-- Migration: Create pengguna table
-- Description: Akun Pengguna Sistem dengan ID UUID

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'peserta', -- 'admin', 'pengurus', 'anggota', 'peserta'
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'AKTIF', -- 'AKTIF', 'NONAKTIF'
  "allowedMenus" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
