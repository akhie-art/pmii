-- Migration: Drop kehadiran column from evaluations
-- Description: Menghapus kolom kehadiran dari tabel evaluations sesuai format penilaian terbaru (Kognitif 30%, Afektif 35%, Psikomotorik 35%)

ALTER TABLE evaluations DROP COLUMN IF EXISTS kehadiran;
