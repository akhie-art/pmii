"use client";

import React from "react";
import { Brain, Target, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CareerAssessmentResult, CareerQuestion } from "@/lib/careerAssessment";

interface CareerAssessmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isReviewingCareer: boolean;
  setIsReviewingCareer: (reviewing: boolean) => void;
  careerResult:
    | (Omit<CareerAssessmentResult, "answers" | "dimensionScores"> & {
        answers?: Record<number, string>;
        dimensionScores?: CareerAssessmentResult["dimensionScores"];
      })
    | null;
  careerQuestions: CareerQuestion[];
  careerAnswers: Record<number, string>;
  setCareerAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onSubmitCareerTest: () => void;
}

export function CareerAssessmentModal({
  isOpen,
  onOpenChange,
  isReviewingCareer,
  setIsReviewingCareer,
  careerResult,
  careerQuestions,
  careerAnswers,
  setCareerAnswers,
  onSubmitCareerTest,
}: CareerAssessmentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col">
          <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                    Instrumen Mahasiswa
                  </span>
                  {careerResult && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Selesai
                    </span>
                  )}
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Analisis Preferensi Kognitif & Arah Karier Mahasiswa
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pemetaan gaya berpikir, bakat alamiah, dan rekomendasi arah profesi berbasis
                  situasi sehari-hari.
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>
          </div>

          {isReviewingCareer && careerResult ? (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 sm:p-5 rounded-lg bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold">
                      Tipe: {careerResult.mbtiCode}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Hasil Analisis Kognitif
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {careerResult.submittedAt}
                  </span>
                </div>

                <div className="pt-1">
                  <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {careerResult.formulaResult}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                    <Brain className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Bakat Dominan</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {careerResult.talent}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Kekuatan alamiah dalam pola berpikir konseptual, logika pemecahan masalah, dan
                    pendekatan kerja.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                    <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Minat & Orientasi Karier</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {careerResult.interest}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Sektor profesi dan ragam bidang kerja yang paling selaras dengan motivasi
                    berkarya Anda.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-850/40 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                  <Target className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span>Rekomendasi Penugasan di PMII</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {careerResult.strategicRole}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {careerResult.description}
                </p>
              </div>

              {careerResult.dimensionScores && (
                <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                    Breakdown 4 Polarisasi Preferensi:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Energi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        E: {careerResult.dimensionScores.E} | I: {careerResult.dimensionScores.I}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Informasi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        S: {careerResult.dimensionScores.S} | N: {careerResult.dimensionScores.N}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Keputusan</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        T: {careerResult.dimensionScores.T} | F: {careerResult.dimensionScores.F}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Eksekusi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        J: {careerResult.dimensionScores.J} | P: {careerResult.dimensionScores.P}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsReviewingCareer(false);
                    setCareerAnswers({});
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Isi Ulang Form
                </Button>

                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-8.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Progres Pengisian
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                    {Object.keys(careerAnswers).length} / {careerQuestions.length} Terjawab
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(Object.keys(careerAnswers).length / careerQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                {careerQuestions.map((q, qIdx) => {
                  const selectedKey = careerAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            No. {qIdx + 1 < 10 ? `0${qIdx + 1}` : qIdx + 1} • {q.category}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {q.question}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                        {q.options.map((opt) => {
                          const isSelected = selectedKey === opt.key;

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setCareerAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: opt.key,
                                }));
                              }}
                              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
                                  : "border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isSelected
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="text-xs leading-relaxed flex-1">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-8.5 text-xs px-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitCareerTest}
                  disabled={Object.keys(careerAnswers).length < careerQuestions.length}
                  className="h-8.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-5 rounded-xl cursor-pointer shadow-xs disabled:opacity-40"
                >
                  Simpan & Analisis Hasil
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
