"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Sparkles,
  Trophy,
  AlertCircle,
  ChevronRight,
  Check,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/lib/db";
import { LevelId } from "./types";

interface QuizSectionProps {
  levelId: LevelId;
  quizList: QuizQuestion[];
  selectedAnswers: Record<number, number>;
  quizSubmitted: boolean;
  score: number;
  onAnswerSelect: (questionId: number, optionIndex: number) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({
  levelId,
  quizList,
  selectedAnswers,
  quizSubmitted,
  score,
  onAnswerSelect,
  onSubmit,
  onReset,
}) => {
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quizList.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const allAnswered = answeredCount >= totalQuestions && totalQuestions > 0;

  // Evaluation criteria
  const getGradeInfo = (val: number) => {
    if (val >= 90) {
      return {
        label: "Mumtaz (Istimewa)",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        icon: Trophy,
        desc: "Luar biasa! Pemahaman Anda terhadap materi jenjang ini sudah sangat mendalam dan matang.",
      };
    }
    if (val >= 75) {
      return {
        label: "Jayyid Jiddan (Sangat Baik)",
        color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
        icon: Award,
        desc: "Sangat baik! Sebagian besar substansi materi telah Anda kuasai dengan baik.",
      };
    }
    if (val >= 60) {
      return {
        label: "Maqbul (Cukup)",
        color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: BookOpen,
        desc: "Cukup baik. Namun kami sarankan untuk membaca ulang modul rujukan pada beberapa pokok bahasan.",
      };
    }
    return {
      label: "Perlu Pendalaman",
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
      icon: AlertCircle,
      desc: "Jangan berkecil hati. Pelajari kembali materi silabus dan modul ajar di atas, lalu ulangi kuis ini kapan saja.",
    };
  };

  const grade = getGradeInfo(score);
  const GradeIcon = grade.icon;

  if (totalQuestions === 0) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
        <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Belum Ada Soal Kuis
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Bank soal evaluasi pemahaman mandiri untuk jenjang {levelId} sedang disiapkan oleh tim instruktur kaderisasi.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Intro & Progress Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Evaluasi Pemahaman Mandiri — Jenjang {levelId}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
              Uji sejauh mana Anda memahami materi pokok {levelId}. Latihan ini bersifat mandiri, tanpa batasan waktu maupun percobaan, dan dapat diulang kapan pun untuk mengasah pemahaman Anda.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
              {quizSubmitted ? "Kuis Selesai Dinilai" : `Progres Pengisian (${answeredCount} dari ${totalQuestions} soal)`}
            </span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {quizSubmitted ? `Skor: ${score}%` : `${progressPercent}%`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                quizSubmitted
                  ? score >= 70
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${quizSubmitted ? score : progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Results Card (when submitted) */}
      {quizSubmitted && (
        <Card className="overflow-hidden bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Circular Score Pod */}
            <div className="relative w-28 h-28 shrink-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border-4 border-blue-600 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {score}%
              </span>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Nilai Akhir
              </span>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${grade.color}`}>
                  <GradeIcon className="w-3.5 h-3.5" />
                  <span>{grade.label}</span>
                </Badge>
              </div>

              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {score >= 70 ? "Selamat, Anda Lulus Evaluasi Mandiri!" : "Hasil Evaluasi Pemahaman Mandiri"}
              </h4>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                {grade.desc}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Benar: {Math.round((score / 100) * totalQuestions)} Soal
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                  Salah: {totalQuestions - Math.round((score / 100) * totalQuestions)} Soal
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onReset}
                variant="outline"
                className="px-4 py-2 text-xs font-bold rounded-lg border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ulangi Kuis
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {quizList.map((q, qIndex) => {
          const isSelected = selectedAnswers[q.id] !== undefined;
          const userAns = selectedAnswers[q.id];

          return (
            <Card
              key={q.id}
              className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 shadow-xs"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  {qIndex + 1}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed flex-1">
                  {q.question}
                </h4>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2 pl-0 sm:pl-9">
                {q.options.map((optionText, optIdx) => {
                  const isCurrentSelected = userAns === optIdx;
                  const isCorrect = q.correctAnswer === optIdx;
                  const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  let btnStyle =
                    "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300";
                  let badgeStyle = "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";

                  if (isCurrentSelected && !quizSubmitted) {
                    btnStyle = "bg-blue-500/10 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500";
                    badgeStyle = "bg-blue-600 text-white";
                  } else if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500";
                      badgeStyle = "bg-emerald-600 text-white";
                    } else if (isCurrentSelected && !isCorrect) {
                      btnStyle = "bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300 font-semibold ring-1 ring-rose-500";
                      badgeStyle = "bg-rose-600 text-white";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={quizSubmitted}
                      onClick={() => onAnswerSelect(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}>
                          {optionLetter}
                        </span>
                        <span className="leading-snug">{optionText}</span>
                      </div>

                      {quizSubmitted && isCorrect && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Kunci Jawaban
                        </span>
                      )}
                      {quizSubmitted && isCurrentSelected && !isCorrect && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          <XCircle className="w-4 h-4" /> Jawaban Anda
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
          {quizSubmitted ? (
            <span>
              Ingin memperbaiki pemahaman? Klik <strong className="text-blue-600 dark:text-blue-400">Ulangi Kuis</strong> untuk mencoba lagi.
            </span>
          ) : allAnswered ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Seluruh {totalQuestions} pertanyaan telah dijawab. Siap kirim!
            </span>
          ) : (
            <span>
              Tersisa <strong className="text-zinc-900 dark:text-zinc-100">{totalQuestions - answeredCount}</strong> pertanyaan yang belum dipilih.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {quizSubmitted ? (
            <Button
              onClick={onReset}
              variant="outline"
              className="px-5 py-2 text-xs font-bold rounded-lg border-zinc-300 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Ulangi Kuis
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={!allAnswered}
              className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4" /> Kirim Jawaban
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
