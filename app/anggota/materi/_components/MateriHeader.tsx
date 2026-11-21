"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  FileDown,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LevelId, LEVEL_ORDER, LEVEL_METAS } from "./types";

interface MateriHeaderProps {
  selectedLevelId: LevelId;
  userCadreLevel: LevelId;
  isAdminOrPengurus: boolean;
  totalSubjects: number;
  totalDurationMinutes: number;
  totalMaterials: number;
  totalQuizzes: number;
  onSelectLevel: (level: LevelId) => void;
  onSimulateLevelChange: (level: LevelId) => void;
}

export const MateriHeader: React.FC<MateriHeaderProps> = ({
  selectedLevelId,
  userCadreLevel,
  isAdminOrPengurus,
  totalSubjects,
  totalDurationMinutes,
  totalMaterials,
  totalQuizzes,
  onSelectLevel,
  onSimulateLevelChange,
}) => {
  const selectedMeta = LEVEL_METAS[selectedLevelId];
  const userMeta = LEVEL_METAS[userCadreLevel];

  const formatHours = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0 Jam";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} Menit`;
    if (mins === 0) return `${hrs} Jam`;
    return `${hrs} Jam ${mins}m`;
  };

  const levelKeys: LevelId[] = ["MAPABA", "PKD", "PKL", "PKN"];

  return (
    <div className="space-y-4">
      {/* Admin / Pengurus Testing Simulation Bar */}
      {isAdminOrPengurus && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Mode Pengurus: Uji Jenjang Kader</span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-normal">
              (Ganti level untuk melihat tampilan peserta)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {levelKeys.map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSimulateLevelChange(lvl)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  userCadreLevel === lvl
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 border border-amber-500/20"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-950/10 border border-blue-600/30">
        {/* Background decorative watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none select-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Title + User Status */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Pusat Kurikulum & Bahan Ajar
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Status Anda: {userCadreLevel}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Silabus & Materi Kaderisasi PMII
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed max-w-2xl font-normal">
                Eksplorasi silabus resmi, unduh modul literatur digital, dan ukur pemahaman Anda melalui evaluasi mandiri di setiap tahapan kaderisasi.
              </p>
            </div>

            {/* Quick Stats Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15 shrink-0">
              <div className="text-center px-3 py-1.5 rounded-lg bg-black/10">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-200">
                  <Layers className="w-3 h-3 text-blue-300" /> Silabus
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{totalSubjects}</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-black/10">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-200">
                  <Clock className="w-3 h-3 text-blue-300" /> Durasi
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{formatHours(totalDurationMinutes)}</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-black/10">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-200">
                  <FileDown className="w-3 h-3 text-blue-300" /> Modul
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{totalMaterials}</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-black/10">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-200">
                  <HelpCircle className="w-3 h-3 text-blue-300" /> Kuis
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{totalQuizzes}</div>
              </div>
            </div>
          </div>

          {/* Cadre Learning Journey Stepper */}
          <div className="pt-2 border-t border-white/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Alur Tahapan Kaderisasi Formal
              </span>
              <span className="text-[11px] text-blue-200/80">
                Pilih jenjang untuk meninjau materi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {levelKeys.map((lvl) => {
                const meta = LEVEL_METAS[lvl];
                const isSelected = selectedLevelId === lvl;
                const isUnlocked = LEVEL_ORDER[lvl] <= LEVEL_ORDER[userCadreLevel];
                const isPassed = LEVEL_ORDER[lvl] < LEVEL_ORDER[userCadreLevel];
                const isCurrent = lvl === userCadreLevel;

                return (
                  <button
                    key={lvl}
                    onClick={() => onSelectLevel(lvl)}
                    className={`relative text-left p-3 rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-white text-zinc-900 border-white shadow-lg scale-[1.02]"
                        : isUnlocked
                        ? "bg-white/15 hover:bg-white/25 text-white border-white/20"
                        : "bg-black/20 text-white/50 border-white/10 hover:bg-black/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : isUnlocked
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white/40"
                      }`}>
                        Tingkat {meta.order}
                      </span>

                      {isPassed && (
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isSelected ? "text-emerald-600" : "text-emerald-300"}`}>
                          <CheckCircle2 className="w-3 h-3" /> Lulus
                        </span>
                      )}
                      {isCurrent && (
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isSelected ? "text-blue-600" : "text-amber-300"}`}>
                          <Sparkles className="w-3 h-3" /> Aktif
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-[10px] font-medium flex items-center gap-0.5 text-white/40">
                          <Lock className="w-3 h-3" /> Terkunci
                        </span>
                      )}
                    </div>

                    <div className="font-black text-sm tracking-tight truncate">
                      {meta.title}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? "text-zinc-600" : "text-blue-100/70"}`}>
                      {meta.fullName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
