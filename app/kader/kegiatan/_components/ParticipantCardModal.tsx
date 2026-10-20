"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { QrCode, Download, CheckCircle2, Calendar, ShieldCheck, Sparkles, Building2 } from "lucide-react";
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
import { getTenantNameById } from "@/lib/tenancy";
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

  // Resolusi nama penyelenggara/komisariat secara dinamis (Multi-Tenant)
  const organizerName = useMemo(() => {
    if (!event) return "Pengurus Cabang PMII Grobogan";
    const fromTenant = event.tenant_id ? getTenantNameById(event.tenant_id) : null;
    const fromKomsatId = (event as any).komisariat_id ? getTenantNameById((event as any).komisariat_id) : null;
    return (
      event.commissariat ||
      fromTenant ||
      fromKomsatId ||
      activeCadre?.commissariat ||
      "Pengurus Cabang PMII Grobogan"
    );
  }, [event, activeCadre]);

  const participantName = useMemo(() => {
    return activeCadre?.name || registration?.cadreName || "Peserta Kegiatan";
  }, [activeCadre, registration]);

  const regNumber = useMemo(() => {
    return registration?.registrationNumber || registration?.id || "TERVERIFIKASI";
  }, [registration]);

  useEffect(() => {
    if (!isOpen || !event || !registration) return;

    // Payload QR code: memprioritaskan nomor registrasi resmi yang kompatibel scanner
    const qrData = regNumber;
    const cacheKey = `PMII_CARD_QR_${event.id}_${regNumber}`;

    // 1. Cek cache offline terlebih dahulu untuk render instan
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCardQrDataUrl(cached);
        setIsCachedOffline(true);
      }
    } catch (e) {
      console.warn("Could not read QR from localStorage cache", e);
    }

    // 2. Generate / perbarui QR code resolusi tinggi
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
  }, [isOpen, event, registration, regNumber]);

  const handleDownloadCard = async () => {
    if (!event || !registration) return;
    setIsDownloading(true);
    try {
      await exportCardAsImage({
        type: "peserta",
        name: participantName,
        idNumber: regNumber,
        commissariat: organizerName,
        level: event.level,
        eventName: event.name,
        eventDate: event.date
      });
      toast.success("Kartu peserta berhasil diunduh dalam resolusi tinggi!");
    } catch (error) {
      console.error("Gagal mendownload kartu:", error);
      toast.error("Gagal mendownload kartu peserta. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <QrCode className="w-4 h-4" />
            </div>
            <span>Kartu Peserta Resmi Kegiatan</span>
          </DialogTitle>
          <DialogClose className="cursor-pointer" />
        </DialogHeader>

        {event && registration && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Offline Cache Status Pill */}
            {isCachedOffline && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Tersimpan Offline
                </span>
                <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
                  Siap dipindai tanpa internet
                </span>
              </div>
            )}

            {/* Kartu Peserta - Tampilan Premium Menyelaraskan dengan Hasil Ekspor */}
            <div
              id="kartu-peserta-render-target"
              className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-slate-950 via-zinc-900 to-blue-950 p-5 shadow-lg text-white"
            >
              {/* Subtle ambient lighting effect */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Watermark level */}
              <div className="absolute -bottom-4 right-2 text-[80px] font-black text-white/[0.03] select-none pointer-events-none tracking-tighter uppercase">
                {event.level}
              </div>

              <div className="relative space-y-4">
                {/* Header Kartu */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/95 p-1 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-xs">
                      <img
                        src="/image/logo_komsat.png"
                        alt="Logo PMII"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        KARTU PESERTA RESMI
                      </span>
                      <span className="text-[10px] text-zinc-300 block font-semibold truncate max-w-[210px]">
                        {organizerName}
                      </span>
                    </div>
                  </div>

                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold text-[10px] px-2.5 py-0.5 tracking-wider shadow-xs">
                    {event.level}
                  </Badge>
                </div>

                {/* Bagian QR Code & Informasi Peserta */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Wadah QR Code dengan corner guide visual */}
                  <div className="relative w-36 h-36 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
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

                  <div className="space-y-2.5 text-xs flex-1 w-full min-w-0">
                    <div>
                      <span className="text-[9.5px] text-zinc-400 uppercase font-semibold tracking-wider block">
                        Nama Peserta
                      </span>
                      <h4 className="font-extrabold text-white text-sm truncate">
                        {participantName}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[9.5px] text-zinc-400 uppercase font-semibold tracking-wider block">
                        Nomor Registrasi
                      </span>
                      <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono font-bold text-amber-300 text-[11px] tracking-wide">
                        {regNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9.5px] text-zinc-400 uppercase font-semibold tracking-wider block">
                        Kegiatan
                      </span>
                      <span className="font-semibold text-zinc-200 block truncate" title={event.name}>
                        {event.name}
                      </span>
                      {event.date && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-amber-400/80" />
                          {event.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Kartu Peserta */}
                <div className="pt-2.5 border-t border-white/10 text-center flex items-center justify-center gap-1 text-[9.5px] text-zinc-400 font-mono tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>TUNJUKKAN KARTU INI SAAT KEGIATAN UNTUK PRESENSI</span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-xs h-10 rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer font-medium"
              >
                Tutup
              </Button>
              <Button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadCard}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
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
