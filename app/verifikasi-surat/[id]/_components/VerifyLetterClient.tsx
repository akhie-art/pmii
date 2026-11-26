"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";

export interface VerifiedLetterData {
  id: string;
  nomor: string;
  subject: string;
  senderOrRecipient: string;
  classification: string;
  status: string;
  date: string;
  dateIndo: string;
  senderTitle: string;
  senderLocation: string;
  commissariat: string;
  tenantLevel?: string;
  createdAt?: string;
}

type VerifyStatus = "valid" | "not_found" | "invalid_format" | "error" | "unconfigured";

interface VerifyLetterClientProps {
  letterId: string;
  initialStatus: VerifyStatus;
  initialLetter: VerifiedLetterData | null;
  supabaseReady: boolean;
}

export function VerifyLetterClient({
  letterId,
  initialStatus,
  initialLetter,
  supabaseReady,
}: VerifyLetterClientProps) {
  const [status, setStatus] = useState<VerifyStatus>(initialStatus);
  const [letter, setLetter] = useState<VerifiedLetterData | null>(initialLetter);
  const [copiedNomor, setCopiedNomor] = useState(false);

  // Fallback lokal (khusus mode demo/dev saat Supabase belum dikonfigurasi)
  useEffect(() => {
    if (supabaseReady || initialStatus !== "unconfigured" || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("PMII_SURAT_DATA");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const matched = list.find(
            (item: any) =>
              String(item?.id) === String(letterId) &&
              String(item?.type || "").toUpperCase() === "KELUAR"
          );
          if (matched) {
            queueMicrotask(() => {
              setLetter({
                id: matched.id,
                nomor: matched.nomor || "-",
                subject: matched.subject || "-",
                senderOrRecipient: matched.senderOrRecipient || "-",
                classification: matched.classification || "-",
                status: matched.status || "Terkirim",
                date: matched.date || "",
                dateIndo: matched.dateIndo || matched.date || "-",
                senderTitle: matched.senderTitle || "-",
                senderLocation: matched.senderLocation || "-",
                commissariat: matched.commissariat || "PMII",
                createdAt: matched.created_at,
              });
              setStatus("valid");
            });
            return;
          }
        }
      }
      queueMicrotask(() => setStatus("not_found"));
    } catch {
      queueMicrotask(() => setStatus("not_found"));
    }
  }, [supabaseReady, initialStatus, letterId]);

  const handleCopyNomor = () => {
    if (!letter?.nomor) return;
    navigator.clipboard?.writeText(letter.nomor).catch(() => {});
    setCopiedNomor(true);
    setTimeout(() => setCopiedNomor(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-2xl mx-auto space-y-5">
        {/* Official Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 shadow-xs flex items-center justify-center shrink-0">
            <SmartImage
              src="/image/logopmii.png"
              fallbackSrc="/image/logo_komsat.png"
              alt="Logo PMII"
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Pergerakan Mahasiswa Islam Indonesia
            </p>
             <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
             Kabupaten Grobogan
            </p>
            <h1 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Verifikasi Keaslian Surat Digital
            </h1>
          </div>
        </div>

        {/* Main Verification Card */}
        {status === "valid" && letter ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Valid Status Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-900/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Terverifikasi &amp; Sah
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 dark:text-emerald-100">
                  Surat Keluar Resmi Terdaftar di Sistem PMII
                </h2>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  Dokumen ini valid dan tercatat secara resmi pada arsip administrasi persuratan{" "}
                  <strong>{letter.commissariat}</strong>.
                </p>
              </div>
            </div>

            {/* Verified Letter Details */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Nomor & Perihal Highlight */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Nomor Surat Resmi
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-sm sm:text-base font-mono font-bold text-zinc-900 dark:text-zinc-100 break-all">
                        {letter.nomor}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyNomor}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-blue-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                        title="Salin nomor surat"
                      >
                        {copiedNomor ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase shrink-0 shadow-none">
                    {letter.classification}
                  </Badge>
                </div>

                <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Perihal / Hal Surat
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">
                    {letter.subject}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Lembaga Penerbit
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{letter.commissariat}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Tujuan / Penerima Surat
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {letter.senderOrRecipient}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Tanggal Terbit Surat
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {letter.dateIndo || letter.date || "-"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Penandatangan &amp; Wilayah
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {letter.senderTitle || "-"} • {letter.senderLocation || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-900/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                {status === "error" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-full">
                  {status === "error" ? "Kendala Verifikasi" : "Tidak Terverifikasi"}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-rose-950 dark:text-rose-100">
                  {status === "invalid_format"
                    ? "Kode QR Verifikasi Tidak Valid"
                    : status === "error"
                    ? "Layanan Verifikasi Sedang Mengalami Gangguan"
                    : "Surat Tidak Ditemukan dalam Arsip Resmi"}
                </h2>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                  {status === "invalid_format"
                    ? "Format tautan atau kode verifikasi pada QR Code tidak sesuai standar sistem PMII."
                    : status === "error"
                    ? "Terjadi kendala koneksi ke server verifikasi. Silakan muat ulang halaman beberapa saat lagi."
                    : "Kode verifikasi ini tidak terdaftar sebagai surat keluar resmi, telah dibatalkan, atau dihapus dari arsip sistem."}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                Pastikan Anda memindai QR Code langsung dari lembar surat resmi yang diterbitkan oleh
                Pengurus Cabang atau Pengurus Komisariat PMII. Jika Anda meragukan keaslian surat,
                hubungi sekretariat lembaga penerbit terkait.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
