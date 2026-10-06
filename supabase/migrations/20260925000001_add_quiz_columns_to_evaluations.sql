-- Migration: Add quiz columns to evaluations table
-- Description: Menambahkan kolom preTestAverage, postTestAverage, dan quizResults pada tabel evaluations

ALTER TABLE IF EXISTS evaluations 
  ADD COLUMN IF NOT EXISTS "preTestAverage" NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS "postTestAverage" NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS "quizResults" JSONB DEFAULT '{}'::jsonb;
