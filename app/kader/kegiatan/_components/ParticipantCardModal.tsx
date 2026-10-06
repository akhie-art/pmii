"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { QrCode, Download, CheckCircle2, WifiOff } from "lucide-react";
import { exportCardAsImage } from "@/lib/cardExporter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import type { EventActivity, ParticipantRegistration } from "./types";

interface ParticipantCardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivity | null;
  registration: ParticipantRegistration | null;
  activeCadre: any | null;
}

export const ParticipantCardModal: React.FC<ParticipantCardModalProps> = ({
  isOpen,
  onOpenChange,
  event,
  registration,
  activeCadre
}) => {
  const [cardQrDataUrl, setCardQrDataUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCachedOffline, setIsCachedOffline] = useState(false);

  useEffect(() => {
    if (!isOpen || !event || !registration) return;

    const qrData =
      registration.registrationNumber ||
      activeCadre?.name ||
      "PMII";

    const cacheKey = `PMII_CARD_QR_${event.id}_${registration.registrationNumber || registration.id}`;

    // 1. Check offline cache first for instantaneous rendering
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCardQrDataUrl(cached);
        setIsCachedOffline(true);
      }
    } catch (e) {
      console.warn("Could not read QR from localStorage cache", e);
    }

    // 2. Generate/re-validate QR code
    QRCode.toDataURL(qrData, {
      width: 400,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff"
      }
    })
      .then((url) => {
        setCardQrDataUrl(url);
        setIsCachedOffline(true);
        try {
          localStorage.setItem(cacheKey, url);
        } catch (e) {
          console.warn("Could not save QR to localStorage cache", e);
        }
      })
      .catch((e) => {
        console.error("QR generation error:", e);
      });
  }, [isOpen, event, registration, activeCadre]);

  const handleDownloadCard = async () => {
    if (!event || !registration) return;
    setIsDownloading(true);
    try {
      await exportCardAsImage({
        type: "peserta",
        name: activeCadre?.name || registration.cadreName,
        idNumber: registration.registrationNumber || "TERVERIFIKASI",
        commissariat:
          event.commissariat || "PK PMII Ki Ageng Getas Pendawa",
        level: event.level,
        eventName: event.name,
        eventDate: event.date
      });
      toast.success("Kartu peserta berhasil diunduh!");
    } catch (error) {
      console.error("Gagal mendownload kartu:", error);
      toast.error("Gagal mendownload kartu peserta. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Kartu Peserta Resmi Kegiatan</span>
          </DialogTitle>
          <DialogClose className="cursor-pointer" />
        </DialogHeader>

        {event && registration && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Offline Cache Status Pill */}
            {isCachedOffline && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 text-[11px] text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Tersimpan Offline
                </span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400">
                  Siap dipindai tanpa kuota internet
                </span>
              </div>
            )}

            {/* Card Container for Canvas Capture */}
            <div
              id="kartu-peserta-render-target"
              className="relative overflow-hidden rounded-2xl border-2 border-blue-600/30 bg-gradient-to-b from-white via-zinc-50 to-blue-50/20 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20 p-5 shadow-sm text-zinc-900 dark:text-zinc-100"
            >
              <div className="space-y-4">
                {/* Top Bar Card */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="/image/logo_komsat.png"
                      alt="Logo PMII"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        KARTU PESERTA RESMI
                      </span>
                      <span className="text-[9px] text-zinc-400 block font-medium">
                        PK PMII Ki Ageng Getas Pendawa
                      </span>
                    </div>
                  </div>

                  <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] px-2 py-0.5">
                    {event.level}
                  </Badge>
                </div>

                {/* QR Code and Details */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-40 h-40 rounded-xl bg-white p-2.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                    {cardQrDataUrl ? (
                      <img
                        src={cardQrDataUrl}
                        alt="QR Peserta"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-16 h-16 text-zinc-400 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-2 text-xs flex-1 w-full">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Nama Peserta
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {activeCadre?.name || registration.cadreName}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Nomor Registrasi
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {registration.registrationNumber || "TERVERIFIKASI"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Kegiatan
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 block truncate max-w-[200px]">
                        {event.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <p className="text-[9.5px] text-zinc-400 uppercase tracking-widest font-mono">
                    TUNJUKKAN KARTU INI SAAT KEGIATAN UNTUK PRESENSI
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-xs h-9 rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadCard}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Unduh Kartu (PNG)</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
