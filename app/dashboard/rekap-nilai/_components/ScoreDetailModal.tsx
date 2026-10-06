import React from "react";
import { BookOpen, Brain, Sparkles, TrendingUp, Target, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import type { ParticipantEvaluation } from "@/lib/db";

interface ScoreDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participant: ParticipantEvaluation | null;
}

export const ScoreDetailModal: React.FC<ScoreDetailModalProps> = ({
  isOpen,
  onOpenChange,
  participant
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        {/* Header — Clean & Minimalist */}
        <DialogHeader className="space-y-1 text-left pb-1">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {participant?.participantName}
            </DialogTitle>
            {participant?.grade && (
              <Badge
                variant="outline"
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60"
              >
                Predikat {participant.grade}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {participant?.university ? `${participant.university} • ` : ""}
            {participant?.commissariat || "PMII"} • Skor Kumulatif:{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {participant?.finalScore ?? 0}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* 1. UNIFIED STATS STRIP (No Rainbow Boxes) */}
        <div className="grid grid-cols-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/70 divide-x divide-zinc-200/60 dark:divide-zinc-800 text-center py-2.5">
          <div className="px-2">
            <span className="text-[10px] text-zinc-400 font-medium block">Pre-Test</span>
            <span className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono">
              {participant?.preTestAverage !== undefined ? participant.preTestAverage : "-"}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[10px] text-zinc-400 font-medium block">Post-Test</span>
            <span className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono">
              {participant?.postTestAverage !== undefined ? participant.postTestAverage : "-"}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[10px] text-zinc-400 font-medium block">Rata Kognitif</span>
            <span className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono">
              {participant?.kognitif ?? "-"}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[10px] text-zinc-400 font-medium block">Skor Akhir</span>
            <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 font-mono">
              {participant?.finalScore ?? "-"}
            </span>
          </div>
        </div>

        {/* 2. HASIL ANALISIS KOGNITIF & ARAH KARIER (Minimalist, No Nested Boxes) */}
        {participant?.careerAssessment ? (
          <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
            {/* Header MBTI */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Analisis Kognitif & Arah Karier
                </span>
              </div>
              <Badge className="font-mono text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-md shadow-none">
                {participant.careerAssessment.mbtiCode}
              </Badge>
            </div>

            {/* Bakat & Minat Inline */}
            <div className="text-xs space-y-1 pt-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-zinc-500 dark:text-zinc-400">Bakat:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {participant.careerAssessment.talent}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">Minat:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {participant.careerAssessment.interest}
                </span>
              </div>

              {participant.careerAssessment.strategicRole && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pt-0.5">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Penugasan PMII:</span>{" "}
                  {participant.careerAssessment.strategicRole}
                </p>
              )}
            </div>

            {/* Polarisasi Skor Dimensi (Clean Subtle Pills) */}
            {participant.careerAssessment.dimensionScores && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                  E:{participant.careerAssessment.dimensionScores.E} I:{participant.careerAssessment.dimensionScores.I}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                  S:{participant.careerAssessment.dimensionScores.S} N:{participant.careerAssessment.dimensionScores.N}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                  T:{participant.careerAssessment.dimensionScores.T} F:{participant.careerAssessment.dimensionScores.F}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                  J:{participant.careerAssessment.dimensionScores.J} P:{participant.careerAssessment.dimensionScores.P}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-850/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-zinc-400" />
              Tes Kognitif & Karier
            </span>
            <span className="text-[10px] italic">Belum dikerjakan</span>
          </div>
        )}

        {/* 3. RINCIAN SESI MATERI */}
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {(!participant?.sessionScores || Object.keys(participant.sessionScores).length === 0) &&
          (!participant?.quizResults || Object.keys(participant.quizResults).length === 0) ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              Belum ada data sesi materi yang dinilai.
            </div>
          ) : (
            (() => {
              const allMateriNames = Array.from(
                new Set([
                  ...Object.keys(participant?.sessionScores || {}),
                  ...Object.keys(participant?.quizResults || {})
                ])
              );

              return allMateriNames.map((materiName) => {
                const session = participant?.sessionScores?.[materiName];
                const quiz = participant?.quizResults?.[materiName];

                return (
                  <div
                    key={materiName}
                    className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {materiName}
                        </span>
                      </div>
                      {session?.score !== undefined && (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono shrink-0">
                          Skor: {session.score}
                        </span>
                      )}
                    </div>

                    {/* Pre & Post Test + Nilai 3 Dimensi */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5 text-[11px]">
                      {quiz && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                            Pre: <strong className="font-mono">{quiz.preTest ?? "-"}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                            Post: <strong className="font-mono">{quiz.postTest ?? "-"}</strong>
                          </span>
                        </div>
                      )}

                      {session && (
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[10px]">
                          <span>Kognitif: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{session.kognitif}</strong></span>
                          <span>Afektif: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{session.afektif}</strong></span>
                          <span>Motorik: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{session.psikomotorik}</strong></span>
                        </div>
                      )}
                    </div>

                    {session?.notes && (
                      <p className="text-[10.5px] text-zinc-500 italic bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                        &ldquo;{session.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              });
            })()
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
