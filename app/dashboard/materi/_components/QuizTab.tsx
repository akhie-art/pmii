import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, HelpCircle, Pencil, Trash2, Filter, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, KaderisasiLevel } from "./types";

interface QuizTabProps {
  selectedLevel: KaderisasiLevel;
  onOpenAddQuiz: () => void;
  onOpenEditSubject: (subject: string, questions: QuizQuestion[]) => void;
  onDeleteSubject: (subject: string) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  selectedLevel,
  onOpenAddQuiz,
  onOpenEditSubject,
  onDeleteSubject
}) => {
  const [filterCategory, setFilterCategory] = useState<"ALL" | "PRE" | "POST">("ALL");

  // Summary counts across all questions in this level
  const totalQuestions = selectedLevel.quiz.length;
  const totalPre = useMemo(
    () =>
      selectedLevel.quiz.filter(
        (q) => q.testType === "PRE" || q.testType === "BOTH" || !q.testType
      ).length,
    [selectedLevel.quiz]
  );
  const totalPost = useMemo(
    () =>
      selectedLevel.quiz.filter(
        (q) => q.testType === "POST" || q.testType === "BOTH" || !q.testType
      ).length,
    [selectedLevel.quiz]
  );

  // Group quiz questions by subject
  const groupedQuizzes = useMemo(() => {
    const groups: { [key: string]: QuizQuestion[] } = {};
    selectedLevel.quiz.forEach((q) => {
      const subject =
        q.subjectName ||
        q.materialTitle ||
        (selectedLevel.name ? `Materi ${selectedLevel.name}` : "Materi Umum");
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(q);
    });
    return groups;
  }, [selectedLevel.quiz, selectedLevel.name]);

  // Filtered entries according to Pre vs Post
  const filteredEntries = useMemo(() => {
    return Object.entries(groupedQuizzes).filter(([_, questions]) => {
      if (filterCategory === "ALL") return true;
      if (filterCategory === "PRE") {
        return questions.some(
          (q) => q.testType === "PRE" || q.testType === "BOTH" || !q.testType
        );
      }
      if (filterCategory === "POST") {
        return questions.some(
          (q) => q.testType === "POST" || q.testType === "BOTH" || !q.testType
        );
      }
      return true;
    });
  }, [groupedQuizzes, filterCategory]);

  return (
    <div className="space-y-4">
      {/* FILTER & STATS BAR */}
      {selectedLevel.quiz.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50/70 dark:bg-zinc-950/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Filter Kategori:
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-0.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterCategory === "ALL"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Semua ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("PRE")}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterCategory === "PRE"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Pre-Test ({totalPre})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("POST")}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterCategory === "POST"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Post-Test ({totalPost})
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {selectedLevel.quiz.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <HelpCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" />
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Belum ada bank soal untuk {selectedLevel.name}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4 max-w-sm mx-auto">
            Buat soal pre-test dan post-test untuk mengukur tingkat kelulusan dan pemahaman materi.
          </p>
          <Button
            onClick={onOpenAddQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Soal Pertama</span>
          </Button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500">
            Tidak ada butir soal dalam kategori {filterCategory === "PRE" ? "Pre-Test" : "Post-Test"}.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterCategory("ALL")}
            className="text-xs text-blue-600 hover:underline mt-2 cursor-pointer"
          >
            Tampilkan Semua Kategori
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredEntries.map(([subject, questions]) => {
            const preCount = questions.filter(
              (q) => q.testType === "PRE" || q.testType === "BOTH" || !q.testType
            ).length;
            const postCount = questions.filter(
              (q) => q.testType === "POST" || q.testType === "BOTH" || !q.testType
            ).length;

            return (
              <div
                key={subject}
                className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  {/* Header: Icon, Subject Title, Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                        <HelpCircle className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {subject}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Bank Soal {selectedLevel.name}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                      {questions.length} Butir Total
                    </span>
                  </div>

                  {/* Pre vs Post Breakdown Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                      Pre-Test: {preCount} Soal
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                      Post-Test: {postCount} Soal
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    Paket evaluasi butir soal pilihan ganda untuk menguji pemahaman materi kader.
                  </p>
                </div>

                {/* Action buttons at bottom: Button edit saja & trash */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-400">
                    {questions.length} butir pertanyaan tersimpan
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/admin/rekap-nilai"
                      className="h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Lihat Rekap Nilai Peserta"
                    >
                      <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>Nilai</span>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSubject(subject)}
                      className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 cursor-pointer"
                      title={`Hapus Bank Soal ${subject}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => onOpenEditSubject(subject, questions)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-7 px-3 cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Soal</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
