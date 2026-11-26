import React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { Save, Brain, RotateCcw, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import type { ParticipantEvaluation } from "@/lib/db";
import type { ModalScoreCalculation } from "./types";

interface ScoringModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEval: ParticipantEvaluation | null;
  modalMateri: string;
  getParticipantAvatar: (item: ParticipantEvaluation) => string | undefined;
  currentModalCalc: ModalScoreCalculation;
  kognitif: number;
  setKognitif: (val: number) => void;
  afektif: number;
  setAfektif: (val: number) => void;
  psikomotorik: number;
  setPsikomotorik: (val: number) => void;
  sessionNotes: string;
  setSessionNotes: (val: string) => void;
  onSaveEvaluation: () => void;
  onResetPostTest?: (item: ParticipantEvaluation, materi: string) => void;
}

export const ScoringModal: React.FC<ScoringModalProps> = ({
  isOpen,
  onOpenChange,
  selectedEval,
  modalMateri,
  getParticipantAvatar,
  currentModalCalc,
  kognitif,
  setKognitif,
  afektif,
  setAfektif,
  psikomotorik,
  setPsikomotorik,
  sessionNotes,
  setSessionNotes,
  onSaveEvaluation,
  onResetPostTest
}) => {
  // Ambil nilai pre-test & post-test untuk materi ini jika tersedia
  const sessionQuiz = selectedEval?.quizResults?.[modalMateri];
  const sessionScoreObj = selectedEval?.sessionScores?.[modalMateri];
  const postTestScore = sessionScoreObj?.postTestScore ?? sessionQuiz?.postTest;
  const preTestScore = sessionScoreObj?.preTestScore ?? sessionQuiz?.preTest;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 overflow-hidden shadow-2xl"
      >
        {/* Header — sejajar rapi antara profil kader, live score, dan tombol close */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden relative border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
              <span className="select-none font-bold text-xs">
                {selectedEval?.participantName?.substring(0, 2).toUpperCase()}
              </span>
              {selectedEval && getParticipantAvatar(selectedEval) && (
                <SmartImage
                  src={getParticipantAvatar(selectedEval)}
                  alt={selectedEval.participantName}
                  width={48}
                  height={48}
                  className="absolute inset-0 w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                {selectedEval?.participantName}
              </DialogTitle>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5" title={modalMateri}>
                {modalMateri}
              </p>
            </div>
          </div>

          {/* Sisi Kanan Header: Live score & Tombol Close */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 leading-none">
                {currentModalCalc.finalScore}
              </span>
              <div className="text-right">
                <Badge className="block text-[9.5px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5 py-0.2">
                  {currentModalCalc.grade}
                </Badge>
                <span
                  className={`text-[9px] font-bold mt-0.5 block leading-none ${
                    currentModalCalc.status === "LULUS"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : currentModalCalc.status === "LULUS_BERSYARAT"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {currentModalCalc.status === "LULUS"
                    ? "Lulus"
                    : currentModalCalc.status === "LULUS_BERSYARAT"
                    ? "Bersyarat"
                    : "Tidak Lulus"}
                </span>
              </div>
            </div>

            {/* Tombol Close terintegrasi aman di header, tidak saling menimpa */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Tutup formulir penilaian"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />

        {/* Scoring Form Body */}
        <div className="flex-1 px-5 sm:px-6 py-4 space-y-3.5 max-h-[64vh] overflow-y-auto custom-scrollbar">
          {/* Profil Kognitif & Bakat Kader */}
          {selectedEval?.careerAssessment && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-900 dark:text-indigo-200">
                  <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  Profil Kognitif & Bakat Kader:
                </span>
                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white shrink-0">
                  {selectedEval.careerAssessment.mbtiCode}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight break-words">
                {selectedEval.careerAssessment.formulaResult}
              </p>
              {selectedEval.careerAssessment.strategicRole && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 break-words">
                  Peran di PMII: {selectedEval.careerAssessment.strategicRole}
                </p>
              )}
            </div>
          )}

          {/* Status Kuis Evaluasi Sesi Ini (Pre & Post Test) */}
          <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 min-w-0">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Evaluasi Kuis Sesi</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]" title={modalMateri}>
                {modalMateri}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-center min-w-[70px] shadow-2xs">
                  <span className="text-[9px] text-zinc-400 block font-medium">Pre-Test</span>
                  <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    {preTestScore !== undefined ? preTestScore : "-"}
                  </span>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-center min-w-[70px] shadow-2xs">
                  <span className="text-[9px] text-zinc-400 block font-medium">Post-Test</span>
                  <span className={`font-mono font-bold text-xs ${
                    postTestScore !== undefined ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  }`}>
                    {postTestScore !== undefined ? postTestScore : "-"}
                  </span>
                </div>
              </div>

              {postTestScore !== undefined && onResetPostTest && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPostTest(selectedEval!, modalMateri)}
                  className="h-7.5 px-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
                  title="Kosongkan nilai post-test dan izinkan peserta mengerjakan ulang"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Reset Post-Test</span>
                </Button>
              )}
            </div>
          </div>

          {/* Aspek 1: Kognitif */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Kognitif</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                  Bobot 30%
                </span>
              </div>
              <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 shadow-2xs focus-within:border-blue-500 transition-colors">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={kognitif}
                  onChange={(e) => setKognitif(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-8 text-center text-xs font-bold font-mono bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-[10px] font-mono text-zinc-400 select-none">/ 100</span>
              </div>
            </div>
            <div className="px-0.5">
              <input
                type="range"
                min={0}
                max={100}
                value={kognitif}
                onChange={(e) => setKognitif(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer block"
              />
            </div>
          </div>

          {/* Aspek 2: Afektif */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Afektif</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                  Bobot 35%
                </span>
              </div>
              <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 shadow-2xs focus-within:border-emerald-500 transition-colors">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={afektif}
                  onChange={(e) => setAfektif(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-8 text-center text-xs font-bold font-mono bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-[10px] font-mono text-zinc-400 select-none">/ 100</span>
              </div>
            </div>
            <div className="px-0.5">
              <input
                type="range"
                min={0}
                max={100}
                value={afektif}
                onChange={(e) => setAfektif(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer block"
              />
            </div>
          </div>

          {/* Aspek 3: Psikomotorik */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Motorik</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                  Bobot 35%
                </span>
              </div>
              <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 shadow-2xs focus-within:border-indigo-500 transition-colors">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={psikomotorik}
                  onChange={(e) => setPsikomotorik(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-8 text-center text-xs font-bold font-mono bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-[10px] font-mono text-zinc-400 select-none">/ 100</span>
              </div>
            </div>
            <div className="px-0.5">
              <input
                type="range"
                min={0}
                max={100}
                value={psikomotorik}
                onChange={(e) => setPsikomotorik(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer block"
              />
            </div>
          </div>

          {/* Catatan Observasi */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Catatan Observasi Instruktur
            </span>
            <textarea
              rows={2}
              placeholder="Catatan observasi peserta (opsional)..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
        <div className="px-5 sm:px-6 py-3.5 bg-zinc-50/80 dark:bg-zinc-950/60 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8.5 px-3.5 rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSaveEvaluation}
            className="text-xs h-8.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer flex items-center gap-1.5 px-4 shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Nilai</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
