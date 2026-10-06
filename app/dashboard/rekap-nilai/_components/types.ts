import type { ParticipantEvaluation } from "@/lib/db";

export interface YudisiumStatsType {
  total: number;
  lulus: number;
  bersyarat: number;
  tidakLulus: number;
  belum: number;
  avgScore: number;
}
