"use client";

import React, { useState } from "react";
import { Award, Download } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { DEFAULT_CERT_CONFIG, generateCertificatePdf, sanitizeCertFontSize } from "@/lib/services";
import type {
  EventActivity,
  ParticipantRegistration,
  CertificateLayoutConfig,
  CertificateFieldConfig
} from "./types";

interface CertificateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivity | null;
  registration: ParticipantRegistration | null;
  activeCadre: any | null;
  kaderisasiList: any[];
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onOpenChange,
  event,
  registration,
  activeCadre,
  kaderisasiList
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!event) return null;

  const matchedKaderisasi = kaderisasiList.find(
    (k) =>
      k.nama?.trim().toUpperCase() === event.level?.trim().toUpperCase() ||
      event.name?.trim().toUpperCase().includes(k.nama?.trim().toUpperCase())
  );
  const templateImage = matchedKaderisasi?.certificateTemplate;
  const certCfg: CertificateLayoutConfig =
    matchedKaderisasi?.certificateConfig || DEFAULT_CERT_CONFIG;
  const fontFam =
    certCfg.fontFamily || 'Poppins, var(--font-poppins), sans-serif';

  const formatIndonesianDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return "";

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return "";
      const day = String(dateInput.getDate()).padStart(2, "0");
      const month = months[dateInput.getMonth()];
      const year = dateInput.getFullYear();
      return `${day} ${month} ${year}`;
    }

    const raw = String(dateInput).trim();
    if (!raw) return "";

    // If string already contains comma, e.g. "Grobogan, 2026-09-11"
    if (raw.includes(",")) {
      const parts = raw.split(",");
      const place = parts[0].trim();
      const afterComma = parts.slice(1).join(",").trim();
      const formattedDate = formatIndonesianDate(afterComma);
      return formattedDate ? `${place}, ${formattedDate}` : raw;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10);
      const day = parseInt(ymdMatch[3], 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dayStr = String(day).padStart(2, "0");
        return `${dayStr} ${months[month - 1]} ${year}`;
      }
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      const year = parseInt(dmyMatch[3], 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dayStr = String(day).padStart(2, "0");
        return `${dayStr} ${months[month - 1]} ${year}`;
      }
    }

    return raw;
  };

  // Cadre data for Piagam
  const cadreName =
    activeCadre?.name || registration?.cadreName || "Kader PMII";
  const cadreNik =
    activeCadre?.nik ||
    (registration?.answers as any)?.["f-nik"] ||
    (registration?.answers as any)?.nik ||
    "3315082103980001";

  const rawBirthPlace =
    activeCadre?.tempatLahir ||
    (registration?.answers as any)?.["f-tempat-lahir"] ||
    (registration?.answers as any)?.tempatLahir ||
    "";

  const rawBirthDate =
    activeCadre?.tanggalLahir ||
    (registration?.answers as any)?.["f-tanggal-lahir"] ||
    (registration?.answers as any)?.tanggalLahir ||
    "";

  const rawTtlAnswer =
    (registration?.answers as any)?.["f-ttl"] ||
    (registration?.answers as any)?.ttl ||
    "";

  let cadreTtl = "Grobogan, 21 Maret 1998";
  if (rawBirthPlace || rawBirthDate) {
    const place = rawBirthPlace || "Grobogan";
    const dateFormatted = rawBirthDate ? formatIndonesianDate(rawBirthDate) : "21 Maret 1998";
    cadreTtl = `${place}, ${dateFormatted}`;
  } else if (rawTtlAnswer) {
    cadreTtl = formatIndonesianDate(rawTtlAnswer);
  }
  const cadreJurusan =
    activeCadre?.jurusan ||
    (registration?.answers as any)?.["f-jurusan"] ||
    (registration?.answers as any)?.jurusan ||
    "Teknik Informatika";
  const cadreKampus =
    activeCadre?.perguruanTinggi ||
    (registration?.answers as any)?.["f-kampus"] ||
    (registration?.answers as any)?.kampus ||
    activeCadre?.commissariat ||
    "Universitas An-Nur Purwodadi";

  const rawReg = registration?.registrationNumber || "091222.001.12.2026";
  const cleanReg = rawReg.replace(/[^0-9]/g, "") || "091222001122026";
  const configuredSegments = certCfg.numberSegments || ["010", "01", "091222", "001", "12", "2026"];
  const participantSeq = cleanReg.slice(6, 9) || configuredSegments[3] || "001";
  const certOfficialNumber = [
    configuredSegments[0] || "010",
    configuredSegments[1] || "01",
    configuredSegments[2] || "091222",
    participantSeq,
    configuredSegments[4] || "12",
    configuredSegments[5] || "2026"
  ].join(".");

  const getPdfFont = (fontFamilyStr?: string): "helvetica" | "times" | "courier" => {
    if (!fontFamilyStr) return "helvetica";
    const lower = fontFamilyStr.toLowerCase();
    if (lower.includes("times") || (lower.includes("serif") && !lower.includes("sans"))) {
      return "times";
    }
    if (lower.includes("courier") || lower.includes("mono")) {
      return "courier";
    }
    return "helvetica";
  };

  const handleDownloadPdf = async () => {
    if (!templateImage) {
      toast.error("Template piagam resmi belum diunggah panitia.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const renderFields = [
        {
          key: "nomor",
          text: certOfficialNumber,
          fallbackX: 50.0,
          fallbackY: 13.8,
          fallbackSize: 13,
          fallbackAlign: "center" as const,
          bold: false
        },
        {
          key: "nama",
          text: cadreName,
          fallbackX: 35.0,
          fallbackY: 29.2,
          fallbackSize: 13,
          fallbackAlign: "left" as const,
          bold: true
        },
        {
          key: "nik",
          text: cadreNik,
          fallbackX: 35.0,
          fallbackY: 31.4,
          fallbackSize: 12,
          fallbackAlign: "left" as const,
          bold: false
        },
        {
          key: "ttl",
          text: cadreTtl,
          fallbackX: 35.0,
          fallbackY: 33.6,
          fallbackSize: 12,
          fallbackAlign: "left" as const,
          bold: false
        },
        {
          key: "jurusan",
          text: cadreJurusan,
          fallbackX: 35.0,
          fallbackY: 35.8,
          fallbackSize: 12,
          fallbackAlign: "left" as const,
          bold: false
        },
        {
          key: "kampus",
          text: cadreKampus,
          fallbackX: 35.0,
          fallbackY: 38.0,
          fallbackSize: 12,
          fallbackAlign: "left" as const,
          bold: false
        }
      ];

      await generateCertificatePdf({
        templateUrl: templateImage,
        config: certCfg,
        fields: renderFields,
        outputType: "save",
        fileName: `Sertifikat_${event.level || "PMII"}_${cadreName.replace(/\s+/g, "_")}.pdf`
      });

      toast.success("Sertifikat resmi (PDF) berhasil diunduh!");
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      toast.error("Gagal memproses file PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderFieldElement = (
    fieldCfg: CertificateFieldConfig | undefined,
    fallbackX: number,
    fallbackY: number,
    fallbackSize: number,
    fallbackBold: boolean,
    text: string,
    fallbackAlign: "left" | "center" | "right" = "left"
  ) => {
    if (fieldCfg && fieldCfg.enabled === false) return null;

    let rawX = fieldCfg?.x ?? fallbackX;
    let rawY = fieldCfg?.y ?? fallbackY;
    if (rawX > 100) rawX = fallbackX;
    if (rawY > 100) rawY = fallbackY;

    const fontSize = sanitizeCertFontSize("", fieldCfg?.fontSize ?? fallbackSize, fallbackSize);
    const isBold = fieldCfg?.bold ?? fallbackBold;
    const align = fieldCfg?.align ?? fallbackAlign;

    return (
      <div
        style={{
          top: `${rawY}%`,
          left: `${rawX}%`,
          transform:
            align === "center"
              ? "translateX(-50%)"
              : align === "right"
              ? "translateX(-100%)"
              : "none",
          textAlign: align,
          fontSize: `calc(${fontSize} * 0.168cqw)`,
          fontWeight: isBold ? "bold" : "normal",
          lineHeight: 1,
          color: fieldCfg?.color || "#0f172a"
        }}
        className="absolute whitespace-nowrap p-0 select-none"
      >
        {text}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Sertifikat & Piagam Kelulusan Resmi</span>
          </DialogTitle>
          <DialogClose className="cursor-pointer" />
        </DialogHeader>

        <div className="p-5 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* PRINTABLE CERTIFICATE FRAME */}
          <div id="printable-certificate">
            {templateImage ? (
              /* FORMAT TEMPLATE GAMBAR DENGAN DATA POSISI PRESISI */
              <div
                className="relative w-full max-w-[620px] mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200"
                style={{ containerType: "inline-size" }}
              >
                <img
                  src={templateImage}
                  alt="Template Piagam Resmi PMII"
                  className="w-full h-auto block select-none pointer-events-none"
                />

                <div
                  className="absolute inset-0 pointer-events-none select-none text-slate-900"
                  style={{ fontFamily: fontFam }}
                >
                  {/* 1. Nomor Piagam */}
                  {renderFieldElement(certCfg.nomor, 50.0, 13.8, 13, false, certOfficialNumber, "center")}

                  {/* 2. Nama Peserta */}
                  {renderFieldElement(certCfg.nama, 35.0, 29.2, 13, true, cadreName, "left")}

                  {/* 3. NIK */}
                  {renderFieldElement(certCfg.nik, 35.0, 31.4, 12, false, cadreNik, "left")}

                  {/* 4. TTL */}
                  {renderFieldElement(certCfg.ttl, 35.0, 33.6, 12, false, cadreTtl, "left")}

                  {/* 5. Jurusan */}
                  {renderFieldElement(certCfg.jurusan, 35.0, 35.8, 12, false, cadreJurusan, "left")}

                  {/* 6. Perguruan Tinggi */}
                  {renderFieldElement(certCfg.kampus, 35.0, 38.0, 12, false, cadreKampus, "left")}
                </div>
              </div>
            ) : (
              /* EMPTY STATE: TEMPLATE RESMI BELUM DIUNGGAH */
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Template Piagam Resmi Belum Diunggah
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                    Panitia atau pengurus belum mengunggah berkas template piagam resmi untuk kegiatan kaderisasi ini. Silakan hubungi admin komisariat.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              disabled={isGeneratingPdf || !templateImage}
              onClick={handleDownloadPdf}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Dokumen PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Sertifikat Resmi (PDF)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
