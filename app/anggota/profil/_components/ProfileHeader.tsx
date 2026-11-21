"use client";

import React, { useState } from "react";
import { Camera, Trash2, ShieldCheck, Mail, Building, Copy, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProfileHeaderProps } from "./types";

export function ProfileHeader({
  currentCadre,
  avatar,
  isUploadingPhoto,
  hasMapabaRegistration,
  completionScore = 0,
  memberNTA,
  fileInputRef,
  onPhotoUpload,
  onRemovePhoto
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNta = () => {
    if (!memberNTA || memberNTA === "-") return;
    navigator.clipboard.writeText(memberNTA);
    setCopied(true);
    toast.success("Nomor NTA berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      {/* Decorative Top Banner Strip - Rich Modern PMII Gradient */}
      <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 dark:from-blue-950 dark:via-blue-900/60 dark:to-zinc-950 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/4 w-36 h-36 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

        {/* Subtle Right Watermark */}
        <div className="absolute right-4 top-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 dark:bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-semibold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>PMII Ki Ageng Getas Pendawa</span>
        </div>
      </div>

      {/* Profile Info Bar */}
      <div className="px-4 sm:px-6 pb-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar & Main Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 sm:gap-4 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group flex-shrink-0 -mt-12 sm:-mt-14 z-10">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                title="Klik untuk mengubah foto profil"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-zinc-900 shadow-md overflow-hidden cursor-pointer relative select-none transition-transform hover:scale-102"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={currentCadre.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {currentCadre.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "KD"}
                  </span>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">Ubah</span>
                </div>

                {/* Loading Spinner */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera button in bottom-right corner */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Ubah foto profil"
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white dark:border-zinc-900 shadow-sm cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {/* Trash button in bottom-left corner */}
              {avatar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto();
                  }}
                  disabled={isUploadingPhoto}
                  title="Hapus foto profil"
                  className="absolute bottom-0 left-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={onPhotoUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
              />
            </div>

            {/* Name, Status Badge & Basic Info */}
            <div className="space-y-1.5 sm:space-y-1 pt-1 sm:pt-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {currentCadre.name}
                </h1>

                {/* Status Badge on Mobile */}
                <div className="sm:hidden">
                  <Badge
                    className={`h-6 px-2.5 text-[11px] font-semibold rounded-full shadow-none ${
                      currentCadre.isGraduated
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : hasMapabaRegistration
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    {currentCadre.isGraduated
                      ? "Kader Resmi"
                      : hasMapabaRegistration
                      ? "Peserta MAPABA"
                      : "Calon Kader"}
                  </Badge>
                </div>
              </div>

              {/* Email, Commissariat, and NTA copy chip */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                {currentCadre.email && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[210px] sm:max-w-none">{currentCadre.email}</span>
                  </span>
                )}
                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                  <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{currentCadre.commissariat}</span>
                </span>
                {memberNTA && memberNTA !== "-" && (
                  <>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={handleCopyNta}
                      title="Salin Nomor Tanda Anggota (NTA)"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <span>NTA: {memberNTA}</span>
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Status Badge & Completion Progress (Desktop Only) */}
          <div className="hidden sm:flex flex-col items-end justify-center shrink-0 space-y-2">
            <Badge
              className={`h-7 px-3 text-[11px] font-semibold rounded-full shadow-none ${
                currentCadre.isGraduated
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : hasMapabaRegistration
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {currentCadre.isGraduated
                ? "Kader Resmi"
                : hasMapabaRegistration
                ? "Peserta MAPABA"
                : "Calon Kader"}
            </Badge>

            {/* Profile Completion Bar */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {completionScore}%
              </span>
              <span className="text-[10px] text-zinc-400">Lengkap</span>
              <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
