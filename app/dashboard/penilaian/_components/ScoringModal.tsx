import React from "react";
import { Save, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onSaveEvaluation
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 overflow-hidden shadow-xl">
        {/* Header — compact */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden relative">
                <span className="select-none font-bold text-xs">
                  {selectedEval?.participantName?.substring(0, 2).toUpperCase()}
                </span>
                {selectedEval && getParticipantAvatar(selectedEval) && (
                  <img
                    src={getParticipantAvatar(selectedEval)}
                    alt={selectedEval.participantName}
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                  {selectedEval?.participantName}
                </DialogTitle>
                <p className="text-[11px] text-zinc-400 truncate">{modalMateri}</p>
              </div>
            </div>

            {/* Live score pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {currentModalCalc.finalScore}
              </span>
              <div className="text-right">
                <Badge className="block text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5">
                  {currentModalCalc.grade}
                </Badge>
                <span
                  className={`text-[10px] font-medium mt-0.5 block ${
                    currentModalCalc.status === "LULUS"
                      ? "text-emerald-600"
                      : currentModalCalc.status === "LULUS_BERSYARAT"
                      ? "text-amber-600"
                      : "text-rose-600"
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
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Scoring Sliders */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {selectedEval?.careerAssessment && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-900 dark:text-indigo-200">
                  <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  Profil Kognitif & Bakat Kader:
                </span>
                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                  {selectedEval.careerAssessment.mbtiCode}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {selectedEval.careerAssessment.formulaResult}
              </p>
              {selectedEval.careerAssessment.strategicRole && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Peran di PMII: {selectedEval.careerAssessment.strategicRole}
                </p>
              )}
            </div>
          )}

          {/* Kognitif */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Kognitif <span className="text-zinc-400 font-normal text-[11px] ml-1">(Nilai 1-100 • Bobot 30%)</span>
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                value={kognitif}
                onChange={(e) => setKognitif(Number(e.target.value) || 0)}
                className="w-16 h-7 text-xs text-center font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={kognitif}
              onChange={(e) => setKognitif(Number(e.target.value))}
              className="w-full accent-blue-600 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full cursor-pointer"
            />
          </div>

          {/* Afektif */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Afektif <span className="text-zinc-400 font-normal text-[11px] ml-1">(Nilai 1-100 • Bobot 35%)</span>
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                value={afektif}
                onChange={(e) => setAfektif(Number(e.target.value) || 0)}
                className="w-16 h-7 text-xs text-center font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={afektif}
              onChange={(e) => setAfektif(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full cursor-pointer"
            />
          </div>

          {/* Psikomotorik */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Motorik <span className="text-zinc-400 font-normal text-[11px] ml-1">(Nilai 1-100 • Bobot 35%)</span>
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                value={psikomotorik}
                onChange={(e) => setPsikomotorik(Number(e.target.value) || 0)}
                className="w-16 h-7 text-xs text-center font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={psikomotorik}
              onChange={(e) => setPsikomotorik(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Catatan
            </span>
            <textarea
              rows={2}
              placeholder="Catatan observasi peserta (opsional)..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-hidden focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
        <div className="px-5 py-3 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onSaveEvaluation}
            className="text-xs h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer flex items-center gap-1.5 px-4"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
