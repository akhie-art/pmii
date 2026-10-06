"use client";

import React, { useState } from "react";
import {
  Compass,
  Brain,
  TrendingUp,
  Sparkles,
  X,
  Target,
  ArrowRight,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CAREER_QUESTIONS,
  calculateCareerMBTI,
  CareerAssessmentResult
} from "@/lib/careerAssessment";
import { CharacterTabProps } from "./types";

export function CharacterTab({
  isEditing,
  setIsEditing,
  isGraduated,
  angkatan,
  setAngkatan,
  jabatan,
  orientasiProfetik,
  setOrientasiProfetik,
  minatPassion,
  setMinatPassion,
  motivasiMapaba,
  setMotivasiMapaba,
  careerProfile,
  onSaveCareerProfile
}: CharacterTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Auto-apply recommendation to inputs
  const handleApplyToForm = (profileToApply = careerProfile) => {
    if (!profileToApply) return;

    if (!isEditing && setIsEditing) {
      setIsEditing(true);
    }

    const suggestedOrientasi = profileToApply.strategicRole
      ? `${profileToApply.talent} • ${profileToApply.strategicRole}`
      : profileToApply.talent;

    setOrientasiProfetik(suggestedOrientasi);
    setMinatPassion(profileToApply.interest);

    toast.success("Rekomendasi diterapkan ke form! Anda tetap bebas mengedit teksnya.");
  };

  // Submit test from modal
  const handleSubmitTest = async () => {
    const totalQuestions = CAREER_QUESTIONS.length;
    if (Object.keys(answers).length < totalQuestions) {
      toast.error(`Mohon jawab seluruh ${totalQuestions} pertanyaan pilihan.`);
      return;
    }

    const result = calculateCareerMBTI(answers);

    if (onSaveCareerProfile) {
      await onSaveCareerProfile(result);
    }

    // Auto apply to form
    handleApplyToForm(result);
    setIsReviewing(true);
    toast.success("Tes berhasil diselesaikan! Rekomendasi telah diterapkan ke profil Anda.");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. INFORMASI KEPENGURUSAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Tahun Angkatan PMII
          </label>
          <Input
            placeholder="Contoh: 2026"
            value={isGraduated ? angkatan : ""}
            disabled={!isEditing || !isGraduated}
            onChange={(e) => {
              if (isGraduated) {
                setAngkatan(e.target.value);
              }
            }}
            className={`h-8.5 text-xs rounded-lg ${
              !isGraduated
                ? "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
            }`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Jabatan Kepengurusan
          </label>
          <Input
            disabled
            placeholder="Misal: Anggota, Pengurus Komisariat"
            value={jabatan}
            className="h-8.5 text-xs bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* 2. INPUT: ORIENTASI PROFETIK / JALUR PENGEMBANGAN */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Orientasi Profetik / Jalur Pengembangan
            </label>
            {isEditing && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Bebas disunting
              </span>
            )}
          </div>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Intelektual, Akademik, Advokasi, Keagamaan"
            value={orientasiProfetik}
            onChange={(e) => setOrientasiProfetik(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        {/* 3. REKOMENDASI PREFERENSI KOGNITIF & ARAH KARIER - ULTRA CLEAN & MINIMALIST */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 sm:p-3.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Preferensi Kognitif & Arah Karier
                  </span>
                  {careerProfile ? (
                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {careerProfile.mbtiCode}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400">
                      12 Soal Relate Gen Z
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate pt-0.5">
                  {careerProfile
                    ? `${careerProfile.talent} • ${careerProfile.interest}`
                    : "Ikuti tes singkat untuk rekomendasi otomatis orientasi & minat."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {careerProfile ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyToForm(careerProfile)}
                    className="h-7.5 px-3 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 cursor-pointer shadow-none gap-1.5"
                    title="Terapkan hasil bakat & minat ke form"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Terapkan</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReviewing(true);
                      setIsModalOpen(true);
                    }}
                    className="h-7.5 px-2.5 text-xs text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    Detail
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsReviewing(false);
                    setIsModalOpen(true);
                  }}
                  className="h-7.5 px-3 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 cursor-pointer shadow-none gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Mulai Tes</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 pt-0.5">
            <span className="w-1 h-1 rounded-full bg-zinc-400 shrink-0"></span>
            <span>Dapat disunting bebas • Tidak memengaruhi data tabel evaluasi</span>
          </div>
        </div>

        {/* 4. INPUT: MINAT & PASSION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Minat & Passion
            </label>
            {isEditing && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Bebas disunting
              </span>
            )}
          </div>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Kepenulisan, Desain Grafis, Riset, Wirausaha"
            value={minatPassion}
            onChange={(e) => setMinatPassion(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        {/* 5. INPUT: MOTIVASI BERGABUNG PMII (TEXTAREA) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Motivasi Bergabung PMII
          </label>
          <textarea
            disabled={!isEditing}
            rows={2}
            placeholder="Alasan, komitmen & cita-cita berkhidmat di PMII"
            value={motivasiMapaba}
            onChange={(e) => setMotivasiMapaba(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default resize-none"
          />
        </div>
      </div>

      {/* MODAL KUESIONER & HASIL ANALISIS KOGNITIF */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                      Instrumen Mahasiswa
                    </span>
                    {careerProfile && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Tercatat
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Analisis Preferensi Kognitif & Arah Karier Mahasiswa
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pemetaan gaya berpikir, bakat alamiah, dan rekomendasi arah profesi berbasis situasi sehari-hari.
                  </DialogDescription>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Tutup</span>
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            {isReviewing && careerProfile ? (
              /* VIEW LAPORAN HASIL */
              <div className="p-5 sm:p-6 space-y-4">
                {/* Result Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold">
                        Tipe: {careerProfile.mbtiCode}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Hasil Analisis Kognitif
                      </span>
                    </div>
                    {careerProfile.submittedAt && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {careerProfile.submittedAt}
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {careerProfile.formulaResult}
                    </p>
                  </div>
                </div>

                {/* Grid 2 Kolom: Bakat & Minat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <Brain className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      <span>Bakat Dominan</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {careerProfile.talent}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Kekuatan alamiah dalam pola berpikir konseptual, logika pemecahan masalah, dan pendekatan kerja.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      <span>Minat & Orientasi Karier</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {careerProfile.interest}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Sektor profesi dan ragam bidang kerja yang paling selaras dengan motivasi berkarya Anda.
                    </p>
                  </div>
                </div>

                {/* Rekomendasi Penugasan PMII */}
                {careerProfile.strategicRole && (
                  <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-850/40 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <Target className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      <span>Rekomendasi Penugasan di PMII</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {careerProfile.strategicRole}
                    </p>
                    {careerProfile.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {careerProfile.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsReviewing(false);
                      setAnswers({});
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Tes Ulang Kuesioner
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleApplyToForm(careerProfile);
                        setIsModalOpen(false);
                      }}
                      className="h-8.5 px-3.5 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Terapkan ke Form Profil
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-8.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl cursor-pointer"
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* FORM KUESIONER 12 SOAL */
              <div className="p-5 sm:p-6 space-y-5">
                {/* Progress Bar */}
                <div className="space-y-1.5 pb-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      Progres Pengisian
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                      {Object.keys(answers).length} / {CAREER_QUESTIONS.length} Terjawab
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                      style={{
                        width: `${(Object.keys(answers).length / CAREER_QUESTIONS.length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  {CAREER_QUESTIONS.map((q, qIdx) => {
                    const selectedKey = answers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            No. {qIdx + 1 < 10 ? `0${qIdx + 1}` : qIdx + 1} • {q.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                          {q.options.map((opt) => {
                            const isSelected = selectedKey === opt.key;

                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: opt.key
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
                                <span className="text-xs leading-relaxed flex-1">
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Form Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="h-8.5 text-xs px-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitTest}
                    disabled={Object.keys(answers).length < CAREER_QUESTIONS.length}
                    className="h-8.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-5 rounded-xl cursor-pointer shadow-xs disabled:opacity-40"
                  >
                    Simpan & Terapkan Hasil
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
