"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import type { QuizQuestion, KaderisasiLevel } from "./types";
import type { KaderisasiMateri } from "@/lib/db";

interface QuestionDraft {
  tempId: string;
  subjectName: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
  testType: "BOTH" | "PRE" | "POST";
}

interface QuizModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuiz?: QuizQuestion | null;
  editingSubject?: string | null;
  editingQuizzes?: QuizQuestion[] | null;
  selectedLevel: KaderisasiLevel;
  kaderisasiMateriList: KaderisasiMateri[];
  onSaveQuizzes: (
    quizzes: Array<{
      id?: number;
      subjectName: string;
      question: string;
      options: string[];
      correctAnswer: number;
      testType?: "PRE" | "POST" | "BOTH";
    }>
  ) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onOpenChange,
  editingQuiz,
  editingSubject,
  editingQuizzes,
  selectedLevel,
  kaderisasiMateriList,
  onSaveQuizzes
}) => {
  const defaultSubject =
    editingSubject ||
    kaderisasiMateriList[0]?.judul ||
    (selectedLevel.name ? `Materi ${selectedLevel.name}` : "Materi Umum");

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [globalSubject, setGlobalSubject] = useState<string>(defaultSubject);
  const [globalTestType, setGlobalTestType] = useState<"BOTH" | "PRE" | "POST">("BOTH");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (editingQuizzes && editingQuizzes.length > 0) {
        const sub =
          editingSubject ||
          editingQuizzes[0].subjectName ||
          editingQuizzes[0].materialTitle ||
          defaultSubject;
        setDrafts(
          editingQuizzes.map((q, idx) => ({
            tempId: `draft-${q.id || idx}`,
            subjectName: q.subjectName || q.materialTitle || sub,
            question: q.question || "",
            optionA: q.options?.[0] || "",
            optionB: q.options?.[1] || "",
            optionC: q.options?.[2] || "",
            optionD: q.options?.[3] || "",
            correctAnswer: q.correctAnswer ?? 0,
            testType: q.testType || "BOTH"
          }))
        );
        setGlobalSubject(sub);
      } else if (editingQuiz) {
        const sub =
          editingQuiz.subjectName || editingQuiz.materialTitle || defaultSubject;
        setDrafts([
          {
            tempId: `draft-${editingQuiz.id}`,
            subjectName: sub,
            question: editingQuiz.question || "",
            optionA: editingQuiz.options?.[0] || "",
            optionB: editingQuiz.options?.[1] || "",
            optionC: editingQuiz.options?.[2] || "",
            optionD: editingQuiz.options?.[3] || "",
            correctAnswer: editingQuiz.correctAnswer ?? 0,
            testType: editingQuiz.testType || "BOTH"
          }
        ]);
        setGlobalSubject(sub);
      } else {
        setDrafts([
          {
            tempId: `draft-${Date.now()}-0`,
            subjectName: defaultSubject,
            question: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctAnswer: 0,
            testType: globalTestType || "BOTH"
          }
        ]);
        setGlobalSubject(defaultSubject);
      }
    }
  }, [isOpen, editingQuiz, editingQuizzes, editingSubject, defaultSubject]);

  const updateDraft = (index: number, field: keyof QuestionDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleApplyGlobalSubject = (subject: string) => {
    setGlobalSubject(subject);
    setDrafts((prev) => prev.map((d) => ({ ...d, subjectName: subject })));
  };

  const handleApplyGlobalTestType = (type: "BOTH" | "PRE" | "POST") => {
    setGlobalTestType(type);
    setDrafts((prev) => prev.map((d) => ({ ...d, testType: type })));
  };

  const handleAddQuestion = () => {
    setErrorMsg(null);
    const newDraft: QuestionDraft = {
      tempId: `draft-${Date.now()}-${drafts.length}`,
      subjectName: globalSubject || defaultSubject,
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: 0,
      testType: globalTestType || "BOTH"
    };
    setDrafts((prev) => [...prev, newDraft]);
  };

  const handleDuplicateQuestion = (index: number) => {
    setErrorMsg(null);
    const source = drafts[index];
    const duplicated: QuestionDraft = {
      ...source,
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    const updated = [...drafts];
    updated.splice(index + 1, 0, duplicated);
    setDrafts(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (drafts.length <= 1) return;
    setErrorMsg(null);
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setErrorMsg(null);
    if (drafts.length === 0) return;

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.question.trim()) {
        setErrorMsg(`Soal #${i + 1}: Pertanyaan belum diisi!`);
        return;
      }
      if (!d.optionA.trim() || !d.optionB.trim()) {
        setErrorMsg(`Soal #${i + 1}: Minimal Pilihan A dan B wajib diisi!`);
        return;
      }

      const opts = [
        d.optionA.trim(),
        d.optionB.trim(),
        d.optionC.trim(),
        d.optionD.trim()
      ];
      if (!opts[d.correctAnswer]) {
        const letters = ["A", "B", "C", "D"];
        setErrorMsg(
          `Soal #${i + 1}: Kunci jawaban terpilih (Pilihan ${letters[d.correctAnswer]}) masih kosong!`
        );
        return;
      }
    }

    const payload = drafts.map((d, idx) => ({
      id:
        editingQuizzes && editingQuizzes[idx]
          ? editingQuizzes[idx].id
          : editingQuiz
          ? editingQuiz.id
          : undefined,
      subjectName: d.subjectName.trim() || globalSubject || "Materi Umum",
      question: d.question.trim(),
      options: [
        d.optionA.trim(),
        d.optionB.trim(),
        d.optionC.trim(),
        d.optionD.trim()
      ].filter(Boolean),
      correctAnswer: d.correctAnswer,
      testType: d.testType || "BOTH"
    }));

    onSaveQuizzes(payload);
  };

  const isSingleEdit = Boolean(editingQuiz && (!editingQuizzes || editingQuizzes.length === 0));
  const isEditMode = Boolean(editingQuiz || (editingQuizzes && editingQuizzes.length > 0));

  const availableSubjectOptions = Array.from(
    new Set([
      ...kaderisasiMateriList.map((m) => m.judul).filter(Boolean),
      ...(globalSubject ? [globalSubject] : []),
      ...drafts.map((d) => d.subjectName).filter(Boolean)
    ])
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-none shadow-none flex flex-col z-50 focus:outline-none"
      >
        {/* HEADER BAR */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 shrink-0 shadow-xs">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate">
                  {isEditMode
                    ? editingSubject
                      ? `Edit Soal Evaluasi - ${editingSubject}`
                      : "Edit Butir Soal Evaluasi"
                    : "Kelola Soal Evaluasi Pre-Test & Post-Test"}
                </DialogTitle>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 text-[10px] font-semibold shrink-0">
                  {selectedLevel.name}
                </Badge>
                {drafts.length > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-semibold shrink-0">
                    {drafts.length} Butir Soal
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                Formulir bank soal pilihan ganda untuk Pre-Test & Post-Test {selectedLevel.name}.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 cursor-pointer hidden sm:flex items-center gap-1.5"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 cursor-pointer shadow-xs border-none"
              >
                {isEditMode
                  ? drafts.length > 1
                    ? `Simpan Perubahan (${drafts.length} Soal)`
                    : "Simpan Perubahan"
                  : drafts.length > 1
                  ? `Simpan Semua (${drafts.length} Soal)`
                  : "Simpan Soal"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8.5 w-8.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>
          </div>
        </div>

        {/* DIALOG BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
          {/* GLOBAL SUBJECT & TEST CATEGORY SELECTION (FOR BATCH CREATION) */}
          {!isEditMode && (
            <div className="p-3 bg-zinc-50/80 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                  Pengaturan Global:
                </span>
                <span className="text-zinc-400 text-[11px] truncate">
                  (Materi & kategori otomatis diterapkan ke semua butir soal baru)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="w-full sm:w-56 shrink-0">
                  {availableSubjectOptions.length > 0 ? (
                    <Select
                      value={globalSubject}
                      onValueChange={(val: string | null) => {
                        if (val) handleApplyGlobalSubject(val);
                      }}
                    >
                      <SelectTrigger className="w-full text-xs h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 shadow-none">
                        <SelectValue placeholder="Pilih Materi Pokok">
                          {globalSubject || "Pilih Materi Pokok"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                        {availableSubjectOptions.map((mName, idx) => (
                          <SelectItem key={idx} value={mName}>
                            {mName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={globalSubject}
                      onChange={(e) => handleApplyGlobalSubject(e.target.value)}
                      placeholder="Nama materi pokok..."
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  )}
                </div>

                {/* Global Test Type Selector */}
                <div className="flex items-center p-0.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleApplyGlobalTestType("BOTH")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      globalTestType === "BOTH"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Pre & Post
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyGlobalTestType("PRE")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      globalTestType === "PRE"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Pre-Test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyGlobalTestType("POST")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      globalTestType === "POST"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Post-Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ERROR ALERT BANNER */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* DRAFTS LIST */}
          <div className="space-y-4">
            {drafts.map((d, index) => {
              const letterLabels = ["A", "B", "C", "D"];

              return (
                <div
                  key={d.tempId}
                  className="p-4 border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 rounded-xl space-y-3.5 shadow-2xs relative"
                >
                  {/* Card Header: Number, Subject, Category, Action buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50 px-2.5 py-0.5 rounded-lg shrink-0">
                        Soal #{index + 1}
                      </span>

                      {/* Per-question subject */}
                      <div className="w-full sm:w-52 shrink-0 mt-1 sm:mt-0">
                        <Select
                          value={d.subjectName}
                          onValueChange={(val: string | null) => {
                            if (val) updateDraft(index, "subjectName", val);
                          }}
                        >
                          <SelectTrigger className="w-full text-[11px] h-7 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 shadow-none">
                            <SelectValue placeholder="Materi">
                              {d.subjectName || "Pilih Materi"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            {availableSubjectOptions.map((mName, sIdx) => (
                              <SelectItem key={sIdx} value={mName}>
                                {mName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Per-question Test Category (Pre vs Post vs Both) */}
                      <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-[10.5px]">
                        <button
                          type="button"
                          onClick={() => updateDraft(index, "testType", "BOTH")}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                            (d.testType || "BOTH") === "BOTH"
                              ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          Pre & Post
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft(index, "testType", "PRE")}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                            d.testType === "PRE"
                              ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          Pre-Test
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft(index, "testType", "POST")}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                            d.testType === "POST"
                              ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          Post-Test
                        </button>
                      </div>
                    </div>

                    {/* Actions: Duplicate & Delete */}
                    {!isSingleEdit && (
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateQuestion(index)}
                          className="h-7 px-2 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md gap-1"
                          title="Duplikasi Butir Soal Ini"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Duplikasi</span>
                        </Button>

                        {drafts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(index)}
                            className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md gap-1"
                            title="Hapus Butir Soal Ini"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Pertanyaan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={d.question}
                      onChange={(e) => updateDraft(index, "question", e.target.value)}
                      placeholder={`Tuliskan butir pertanyaan untuk Soal #${index + 1}...`}
                      rows={2}
                      className="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 focus:outline-none placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 resize-none"
                    />
                  </div>

                  {/* Options (A, B, C, D) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Pilihan Jawaban (A & B Wajib, C & D Opsional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-xs font-bold text-zinc-400 shrink-0">A.</span>
                        <Input
                          value={d.optionA}
                          onChange={(e) => updateDraft(index, "optionA", e.target.value)}
                          placeholder="Pilihan A..."
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-xs font-bold text-zinc-400 shrink-0">B.</span>
                        <Input
                          value={d.optionB}
                          onChange={(e) => updateDraft(index, "optionB", e.target.value)}
                          placeholder="Pilihan B..."
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-xs font-bold text-zinc-400 shrink-0">C.</span>
                        <Input
                          value={d.optionC}
                          onChange={(e) => updateDraft(index, "optionC", e.target.value)}
                          placeholder="Pilihan C (opsional)..."
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-xs font-bold text-zinc-400 shrink-0">D.</span>
                        <Input
                          value={d.optionD}
                          onChange={(e) => updateDraft(index, "optionD", e.target.value)}
                          placeholder="Pilihan D (opsional)..."
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Correct Answer Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Tentukan Kunci Jawaban Benar
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { idx: 0, letter: "A", text: d.optionA },
                        { idx: 1, letter: "B", text: d.optionB },
                        { idx: 2, letter: "C", text: d.optionC },
                        { idx: 3, letter: "D", text: d.optionD }
                      ].map((item) => {
                        const isSelected = d.correctAnswer === item.idx;
                        const isFilled = item.text.trim().length > 0;

                        return (
                          <button
                            key={item.idx}
                            type="button"
                            disabled={!isFilled && item.idx >= 2}
                            onClick={() => updateDraft(index, "correctAnswer", item.idx)}
                            className={`h-9 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                {item.letter}
                              </span>
                              <span className="truncate text-[11px]">Pilihan {item.letter}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BUTTON: TAMBAH BUTIR SOAL BERIKUTNYA */}
          {!isSingleEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion}
              className="w-full h-11 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-none transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Soal Berikutnya (Soal #{drafts.length + 1})</span>
            </Button>
          )}
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3 shrink-0">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Total {drafts.length} butir soal terdaftar
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 cursor-pointer shadow-xs border-none"
              >
                {isEditMode
                  ? drafts.length > 1
                    ? `Simpan Perubahan (${drafts.length} Soal)`
                    : "Simpan Perubahan"
                  : drafts.length > 1
                  ? `Simpan Semua (${drafts.length} Soal)`
                  : "Simpan Soal"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
