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
    <div className="relative overflow-hidden rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      {/* Decorative Top Banner Strip - Clean Flat Neutral */}
      <div className="h-20 sm:h-24 w-full bg-zinc-900 dark:bg-zinc-950 border-b border-zinc-800 relative">
        {/* Subtle Right Watermark */}
        <div className="absolute right-4 top-3 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 text-[11px] font-medium tracking-wide">
          <Building className="w-3 h-3 text-zinc-400" />
          <span>PMII Ki Ageng Getas Pendawa</span>
        </div>
      </div>

      {/* Profile Info Bar */}
      <div className="px-4 sm:px-6 pb-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar & Main Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 sm:gap-4 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group flex-shrink-0 -mt-10 sm:-mt-12 z-10">
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
                className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-xl border-4 border-white dark:border-zinc-900 shadow-xs overflow-hidden cursor-pointer relative select-none"
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
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-medium mt-0.5">Ubah</span>
                </div>

                {/* Loading Spinner */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera button in bottom-right corner */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Ubah foto profil"
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs cursor-pointer transition-colors"
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
                  className="absolute bottom-0 left-0 w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs cursor-pointer transition-colors"
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
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {currentCadre.name}
                </h1>

                {/* Status Badge on Mobile */}
                <div className="sm:hidden">
                  <Badge
                    variant="outline"
                    className="h-6 px-2 text-[11px] font-medium rounded-md shadow-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  >
                    <ShieldCheck className="w-3 h-3 mr-1 text-zinc-500 dark:text-zinc-400" />
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
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-md sm:rounded-none">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[210px] sm:max-w-none">{currentCadre.email}</span>
                  </span>
                )}
                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-md sm:rounded-none">
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
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <span>NTA: {memberNTA}</span>
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400" />
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
              variant="outline"
              className="h-7 px-2.5 text-xs font-medium rounded-md shadow-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" />
              {currentCadre.isGraduated
                ? "Kader Resmi"
                : hasMapabaRegistration
                ? "Peserta MAPABA"
                : "Calon Kader"}
            </Badge>

            {/* Profile Completion Bar */}
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                {completionScore}%
              </span>
              <span className="text-[10px] text-zinc-400">Lengkap</span>
              <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500"
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
