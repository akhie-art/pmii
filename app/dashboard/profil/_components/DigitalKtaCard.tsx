"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalKtaCardProps } from "./types";

export function DigitalKtaCard({
  currentCadre,
  isAdmin,
  memberNTA,
  memberStartDate,
  jabatan,
  qrCodeDataUrl,
  isDownloading,
  onDownloadCard
}: DigitalKtaCardProps) {
  return (
    <div className="space-y-3">
      <div 
        id="digital-kta-card"
        className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-zinc-950 dark:via-[#0c101a] dark:to-zinc-950 border border-amber-200 dark:border-amber-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-sm flex flex-col justify-between"
      >
        {/* Watermark */}
        <div className="absolute right-3 bottom-2 text-[64px] sm:text-[90px] font-black text-amber-900/[0.04] dark:text-white/[0.02] tracking-tighter select-none pointer-events-none leading-none z-0 max-w-[75%] truncate">
          {isAdmin ? "ADMIN" : "PENGURUS"}
        </div>

        <div className="space-y-4 relative z-10">
          {/* Card Top */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-xs p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/logo_komsat.png"
                  alt="Logo Komisariat"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  PMII {currentCadre.commissariat || "Komisariat"}
                </h4>
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  PK KI AGENG GETAS PENDAWA
                </p>
              </div>
            </div>
            <span className="border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
              {isAdmin ? "ADMIN" : "PENGURUS"}
            </span>
          </div>

          {/* Card Body */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            {/* QR Code Container */}
            <div className="flex flex-col items-center shrink-0 w-full sm:w-auto">
              <div className="w-48 h-48 sm:w-36 sm:h-36 bg-white dark:bg-white border border-zinc-200 dark:border-transparent rounded-2xl p-3 flex items-center justify-center shadow-md dark:shadow-black/40">
                {qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={qrCodeDataUrl}
                    alt="QR NTA"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm tracking-wider text-center mt-2.5">
                {memberNTA}
              </p>
              <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider text-center">
                QR DIGITAL NTA
              </p>
            </div>

            {/* Member Details */}
            <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                  Nama Pengurus
                </span>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                  {currentCadre.name.startsWith("Sahabat") ? currentCadre.name : `Sahabat ${currentCadre.name}`}
                </h3>
              </div>

              <div>
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                  Jabatan / Posisi
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-200 truncate font-medium">
                  {jabatan || (isAdmin ? "Administrator Sistem" : "Pengurus Komisariat")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                    Jenjang
                  </span>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {currentCadre.level || "PKL"}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                    Masa Khidmat
                  </span>
                  <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    {memberStartDate !== "-" ? memberStartDate.slice(0, 4) : "2026"} - 2027
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Bottom Notice */}
          <div className="border-t border-zinc-100 dark:border-white/[0.08] pt-2.5">
            <p className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest text-center">
              TEREGISTRASI RESMI &nbsp;|&nbsp; PK PMII KI AGENG GETAS PENDAWA
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-2.5">
        <Button
          type="button"
          onClick={onDownloadCard}
          disabled={isDownloading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs h-9 rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          {isDownloading ? (
            <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Unduh KTA Digital (PNG)</span>
        </Button>
      </div>
    </div>
  );
}
