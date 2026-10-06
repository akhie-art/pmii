"use client";

import React, { useState } from "react";
import { Award, Download, Printer } from "lucide-react";
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
import { DEFAULT_CERT_CONFIG } from "@/lib/db";
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
    certCfg.fontFamily || '"Arial Narrow", "Helvetica Neue Condensed", Arial, sans-serif';

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

  const eventDateText =
    formatIndonesianDate(event.date) ||
    formatIndonesianDate(new Date());


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

  const handleDownloadPdf = () => {
    if (!templateImage) {
      window.print();
      return;
    }

    setIsGeneratingPdf(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const orientation = img.width > img.height ? "l" : "p";
        const pdf = new jsPDF({
          orientation,
          unit: "mm",
          format: "a4",
          compress: true
        });

        const pdfWidth = orientation === "l" ? 297 : 210;
        const pdfHeight = orientation === "l" ? 210 : 297;

        // Render background template
        pdf.addImage(img, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        const baseFont = getPdfFont(fontFam);

        // Render vector text directly into PDF (crisp, selectable, correct point size)
        const drawVectorField = (
          fieldCfg: CertificateFieldConfig | undefined,
          fallbackX: number,
          fallbackY: number,
          fallbackSize: number,
          fallbackBold: boolean,
          text: string,
          fallbackAlign: "left" | "center" | "right" = "left",
          underline = false
        ) => {
          if (fieldCfg && fieldCfg.enabled === false) return;

          const posX = ((fieldCfg?.x ?? fallbackX) / 100) * pdfWidth;
          const posY = ((fieldCfg?.y ?? fallbackY) / 100) * pdfHeight;
          const configSize = fieldCfg?.fontSize ?? fallbackSize;
          const ptSize = Math.max(8, configSize);
          const isBold = fieldCfg?.bold ?? fallbackBold;
          const align = fieldCfg?.align ?? fallbackAlign;

          pdf.setFont(baseFont, isBold ? "bold" : "normal");
          pdf.setFontSize(ptSize);
          pdf.setTextColor(15, 23, 42); // #0f172a
          pdf.text(text, posX, posY, { align, baseline: "top" });

          if (underline) {
            const textW = pdf.getTextWidth(text);
            const startX =
              align === "center"
                ? posX - textW / 2
                : align === "right"
                ? posX - textW
                : posX;
            pdf.setDrawColor(15, 23, 42);
            pdf.setLineWidth(0.35); // mm
            const lineY = posY + (ptSize * 0.352778) + 0.8;
            pdf.line(startX, lineY, startX + textW, lineY);
          }
        };

        drawVectorField(certCfg.nomor, 43.5, 12.5, 13, false, certOfficialNumber);
        drawVectorField(certCfg.nama, 35.0, 29.5, 13, true, cadreName);
        drawVectorField(certCfg.nik, 35.0, 31.8, 13, false, cadreNik);
        drawVectorField(certCfg.ttl, 35.0, 34.0, 13, false, cadreTtl);
        drawVectorField(certCfg.jurusan, 35.0, 36.2, 13, false, cadreJurusan);
        drawVectorField(certCfg.kampus, 35.0, 38.3, 13, false, cadreKampus);

        pdf.save(`Sertifikat_${event.level}_${cadreName.replace(/\s+/g, "_")}.pdf`);
        toast.success("Sertifikat resmi (PDF) berhasil diunduh!");
      } catch (err) {
        console.error("Gagal membuat PDF:", err);
        toast.error("Gagal memproses file PDF. Silakan coba lagi.");
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    img.onerror = () => {
      setIsGeneratingPdf(false);
      toast.error("Gagal memuat template gambar sertifikat.");
    };

    img.src = templateImage;
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

    const x = fieldCfg?.x ?? fallbackX;
    const y = fieldCfg?.y ?? fallbackY;
    const fontSize = fieldCfg?.fontSize ?? fallbackSize;
    const isBold = fieldCfg?.bold ?? fallbackBold;
    const align = fieldCfg?.align ?? fallbackAlign;

    return (
      <div
        style={{
          top: `${y}%`,
          left: `${x}%`,
          transform:
            align === "center"
              ? "translateX(-50%)"
              : align === "right"
              ? "translateX(-100%)"
              : "none",
          textAlign: align,
          fontSize: `clamp(9px, calc(${fontSize} * (100cqw / 450)), 32px)`,
          fontWeight: isBold ? "bold" : "normal",
          lineHeight: 1
        }}
        className="absolute whitespace-nowrap"
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
                  {renderFieldElement(certCfg.nomor, 43.5, 12.5, 13, false, certOfficialNumber)}

                  {/* 2. Nama Peserta */}
                  {renderFieldElement(certCfg.nama, 35.0, 29.5, 13, true, cadreName)}

                  {/* 3. NIK */}
                  {renderFieldElement(certCfg.nik, 35.0, 31.8, 13, false, cadreNik)}

                  {/* 4. TTL */}
                  {renderFieldElement(certCfg.ttl, 35.0, 34.0, 13, false, cadreTtl)}

                  {/* 5. Jurusan */}
                  {renderFieldElement(certCfg.jurusan, 35.0, 36.2, 13, false, cadreJurusan)}

                  {/* 6. Perguruan Tinggi */}
                  {renderFieldElement(certCfg.kampus, 35.0, 38.3, 13, false, cadreKampus)}
                </div>
              </div>
            ) : (
              /* FORMAT DIGITAL CARD MODERN */
              <div className="relative p-6 sm:p-10 rounded-2xl border-4 border-double border-amber-500/60 bg-gradient-to-br from-amber-50/40 via-white to-blue-50/40 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 text-center text-zinc-900 dark:text-zinc-100 space-y-6 shadow-sm overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <img
                      src="/image/logo_komsat.png"
                      alt="Logo PMII"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                    PENGURUS KOMISARIAT
                  </h3>
                  <h2 className="text-sm sm:text-base font-black tracking-wider text-blue-700 dark:text-blue-400 uppercase">
                    PERGERAKAN MAHASISWA ISLAM INDONESIA
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-serif">
                    KOMISARIAT KI AGENG GETAS PENDAWA
                  </p>
                </div>

                <div className="py-2">
                  <span className="text-[10px] font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold block uppercase">
                    No. Sertifikat: SERT-PMII-{event.level}-{registration?.registrationNumber || "LULUS-2026"}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black font-serif text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-1">
                    SERTIFIKAT KELULUSAN
                  </h1>
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <p className="text-xs text-zinc-500 font-serif italic">
                    Diberikan dengan penuh kehormatan kepada:
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 border-b-2 border-amber-500/40 pb-2 inline-block px-6">
                    {cadreName}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-serif pt-1 leading-relaxed">
                    Telah mengikuti secara aktif dan dinyatakan <strong>LULUS</strong> dalam kegiatan kaderisasi formal:
                  </p>
                  <div className="text-sm font-extrabold text-blue-700 dark:text-blue-400 uppercase pt-0.5">
                    {event.name} ({event.level})
                  </div>
                  <p className="text-[11px] text-zinc-500 font-serif">
                    Diselenggarakan pada tanggal {eventDateText} oleh PK PMII Ki Ageng Getas Pendawa.
                  </p>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-6 max-w-md mx-auto text-center text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 block font-serif">Ketua Komisariat</span>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-xs font-script font-bold text-blue-700 dark:text-blue-400">
                        [ Tanda Tangan Digital ]
                      </span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block border-t border-zinc-300 dark:border-zinc-700 pt-1">
                      BPH PK PMII KGP
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 block font-serif">Sekretaris Komisariat</span>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-xs font-script font-bold text-blue-700 dark:text-blue-400">
                        [ Tanda Tangan Digital ]
                      </span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block border-t border-zinc-300 dark:border-zinc-700 pt-1">
                      Sekretaris Kaderisasi
                    </span>
                  </div>
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
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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
