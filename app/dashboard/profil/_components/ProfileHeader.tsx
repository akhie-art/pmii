"use client";

import React from "react";
import { Camera, Trash2, ShieldCheck, Mail, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileHeaderProps } from "./types";

export function ProfileHeader({
  currentCadre,
  isAdmin,
  avatar,
  isUploadingPhoto,
  fileInputRef,
  onPhotoUpload,
  onRemovePhoto
}: ProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-none relative overflow-hidden">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full sm:w-auto">
            {/* Photo Avatar with Camera Button */}
            <div className="relative group shrink-0">
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
                  <span>{currentCadre.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "PK"}</span>
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
                  <Badge className={`h-6 px-2.5 text-[11px] font-semibold rounded-full shadow-none ${
                    isAdmin
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    {isAdmin ? "Administrator" : "Pengurus Komisariat"}
                  </Badge>
                </div>
              </div>
              
              {/* Email & Commissariat info chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                {currentCadre.email && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[210px] sm:max-w-none">{currentCadre.email}</span>
                  </span>
                )}
                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                  <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{currentCadre.commissariat || "Ki Ageng Getas Pendawa"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Status Badge (Desktop Only) */}
          <div className="hidden sm:flex items-center justify-end shrink-0">
            <Badge className={`h-7 px-3 text-[11px] font-semibold rounded-full shadow-none ${
              isAdmin
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {isAdmin ? "Administrator" : "Pengurus Komisariat"}
            </Badge>
          </div>

        </div>
      </div>
    </div>
  );
}
