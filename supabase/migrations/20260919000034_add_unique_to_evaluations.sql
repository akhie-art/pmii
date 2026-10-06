-- Migration: Add unique index to evaluations table to prevent duplicate participants per activity
-- Description: Memastikan satu peserta hanya memiliki 1 record penilaian per kegiatan

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_unique_activity_cadre 
ON evaluations ("activityId", "cadreId") 
WHERE "cadreId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_unique_activity_participant 
ON evaluations ("activityId", LOWER(TRIM("participantName")));
