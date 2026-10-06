-- Migration: Create evaluations table and update pendaftaran
-- Description: Tabel Penilaian Peserta Kaderisasi (Role Instruktur) dan relasi pendaftaran tanpa ketergantungan localStorage

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "activityId" TEXT NOT NULL,
  "activityName" TEXT NOT NULL,
  "cadreId" TEXT,
  "participantName" TEXT NOT NULL,
  gender TEXT DEFAULT 'Laki-laki',
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  university TEXT,
  level TEXT DEFAULT 'MAPABA',
  "sessionScores" JSONB NOT NULL DEFAULT '{}'::jsonb,
  kognitif NUMERIC(5,2) DEFAULT 0,
  afektif NUMERIC(5,2) DEFAULT 0,
  psikomotorik NUMERIC(5,2) DEFAULT 0,
  "finalScore" NUMERIC(5,2) DEFAULT 0,
  grade TEXT DEFAULT 'E',
  status TEXT NOT NULL DEFAULT 'BELUM_DINILAI',
  "evaluatorId" TEXT,
  "evaluatorName" TEXT,
  notes TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_evaluations_activity_id ON evaluations ("activityId");
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations (status);
CREATE INDEX IF NOT EXISTS idx_evaluations_participant_name ON evaluations ("participantName");

-- 3. Relax eventId on pendaftaran to TEXT so it seamlessly supports both string IDs and UUIDs
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pendaftaran' AND column_name = 'eventId'
  ) THEN
    ALTER TABLE pendaftaran ALTER COLUMN "eventId" TYPE TEXT;
  END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if any
DROP POLICY IF EXISTS "allow_select" ON evaluations;
DROP POLICY IF EXISTS "allow_insert" ON evaluations;
DROP POLICY IF EXISTS "allow_update" ON evaluations;
DROP POLICY IF EXISTS "allow_delete" ON evaluations;

-- 6. Apply CRUD policies for evaluations
CREATE POLICY "allow_select" ON evaluations FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON evaluations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON evaluations FOR DELETE USING (true);

-- 7. Grant access to anon and authenticated roles
GRANT ALL ON TABLE evaluations TO anon, authenticated;
