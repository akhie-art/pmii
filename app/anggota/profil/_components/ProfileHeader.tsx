"use client";

import React, { useState } from "react";
import {
  Camera,
  Trash2,
  Mail,
  Building,
  Copy,
  Check,
  ChevronDown,
  FileText,
  Building2,
  FileCheck,
  ImageUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ProfileHeaderProps } from "./types";

const menuItemClass =
  "px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800";

export function ProfileHeader({
  currentCadre,
  avatar,
  isUploadingPhoto,
  hasMapabaRegistration,
  completionScore = 0,
  memberNTA,
  fileInputRef,
  onPhotoUpload,
  onRemovePhoto,
  onDownloadOrganisasiCV,
  onDownloadAtsCV
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNta = () => {
    if (!memberNTA || memberNTA === "-") return;
    navigator.clipboard.writeText(memberNTA);
    setCopied(true);
    toast.success("Nomor NTA berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel = currentCadre.isGraduated
    ? "Kader Resmi"
    : hasMapabaRegistration
    ? "Peserta MAPABA"
    : "Calon Kader";

  const statusDot = currentCadre.isGraduated
    ? "bg-emerald-500"
    : hasMapabaRegistration
    ? "bg-amber-500"
    : "bg-zinc-400";

  const initials =
    currentCadre.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "KD";

  const hasCvActions = Boolean(onDownloadOrganisasiCV || onDownloadAtsCV);
  const score = Math.min(100, Math.max(0, completionScore));

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Identity row */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Avatar */}
        <div className="relative shrink-0 self-center sm:self-auto">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            title="Klik untuk mengubah foto profil"
            className="group relative w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-semibold text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-200 dark:ring-zinc-700 cursor-pointer select-none"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={currentCadre.name} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}

            <div className="absolute inset-0 bg-zinc-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>

            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Photo menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              title="Kelola foto profil"
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors outline-none"
            >
              <Camera className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-44 p-1 rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md"
            >
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                <ImageUp className="w-3.5 h-3.5 text-zinc-500" />
                <span>{avatar ? "Ganti foto" : "Unggah foto"}</span>
              </DropdownMenuItem>
              {avatar && (
                <DropdownMenuItem
                  onClick={() => onRemovePhoto()}
                  disabled={isUploadingPhoto}
                  className="px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus foto</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onPhotoUpload}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
          />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {currentCadre.name}
            </h1>
            <div className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
              <span className="font-medium">{statusLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {currentCadre.email && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">{currentCadre.email}</span>
              </span>
            )}
            {currentCadre.commissariat && (
              <span className="inline-flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>{currentCadre.commissariat}</span>
              </span>
            )}
            {memberNTA && memberNTA !== "-" && (
              <button
                type="button"
                onClick={handleCopyNta}
                title="Salin Nomor Tanda Anggota (NTA)"
                className="inline-flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <span>NTA {memberNTA}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        {hasCvActions && (
          <div className="shrink-0 flex justify-center sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                title="Pilih format CV"
                className="h-9 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors outline-none"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Curriculum Vitae</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 p-1 rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                  Pilih format CV
                </DropdownMenuLabel>
                {onDownloadOrganisasiCV && (
                  <DropdownMenuItem onClick={onDownloadOrganisasiCV} className={menuItemClass}>
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>CV Organisasi</span>
                  </DropdownMenuItem>
                )}
                {onDownloadAtsCV && (
                  <DropdownMenuItem onClick={onDownloadAtsCV} className={menuItemClass}>
                    <FileCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>CV ATS Friendly</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Completion row */}
      <div className="px-5 sm:px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Kelengkapan profil</span>
        <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-100 shrink-0">{score}%</span>
      </div>
    </div>
  );
}
