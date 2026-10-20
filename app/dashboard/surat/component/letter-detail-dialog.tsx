"use client";

import React from "react";
import {
  FileText,
  Printer,
  Copy,
  Check,
  Calendar,
  Building,
  FileCheck,
  Paperclip,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import type { MailItem } from "./types";

interface LetterDetailDialogProps {
  selectedMail: MailItem | null;
  onClose: () => void;
  copiedNomor: boolean;
  onCopyNomor: (nomor: string) => void;
  showToast: (msg: string) => void;
  getClassificationBadge: (cls: MailItem["classification"]) => React.ReactNode;
  getStatusBadge: (status: MailItem["status"]) => React.ReactNode;
}

export function LetterDetailDialog({
  selectedMail,
  onClose,
  copiedNomor,
  onCopyNomor,
  showToast,
  getClassificationBadge,
  getStatusBadge
}: LetterDetailDialogProps) {
  if (!selectedMail) return null;

  const handlePrintMail = (mail: MailItem) => {
    if (!mail.content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    const printTitle = (mail.nomor || "Surat_Resmi").replace(/[\s\/\.]+/g, "_");
    const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${printTitle}</title>
          ${allStyles}
          <style>
            @page {
              size: auto;
              margin: 15mm 20mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              font-family: 'Times New Roman', 'Arial', sans-serif !important;
            }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            ${mail.content}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            });
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isHtmlDocument = Boolean(
    selectedMail.content &&
      (selectedMail.content.includes("<table") ||
        selectedMail.content.includes("<div") ||
        selectedMail.content.includes("<p") ||
        selectedMail.content.includes("data-field") ||
        selectedMail.content.includes("KOP SURAT") ||
        selectedMail.content.includes("Commissariat") ||
        selectedMail.content.includes("PERGERAKAN MAHASISWA ISLAM INDONESIA"))
  );

  return (
    <Dialog open={!!selectedMail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Detail Arsip Surat
                  </DialogTitle>
                  <Badge
                    className={`text-[10px] font-bold py-0.5 px-2 shadow-none border ${
                      selectedMail.type === "MASUK"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                    }`}
                  >
                    {selectedMail.type === "MASUK" ? "Surat Masuk" : "Surat Keluar"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 truncate">
                    {selectedMail.nomor}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopyNomor(selectedMail.nomor)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer border-none bg-transparent"
                    title="Salin nomor surat"
                  >
                    {copiedNomor ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Unified Metadata Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Perihal / Hal Surat
                </span>
                <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">
                  {selectedMail.subject}
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                {getClassificationBadge(selectedMail.classification)}
                {getStatusBadge(selectedMail.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" /> Tanggal Surat
                </span>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedMail.dateIndo || selectedMail.date}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Building className="w-3 h-3 text-zinc-400" />{" "}
                  {selectedMail.type === "MASUK" ? "Instansi Pengirim" : "Instansi Tujuan"}
                </span>
                <p
                  className="font-semibold text-zinc-800 dark:text-zinc-200 truncate"
                  title={selectedMail.senderOrRecipient}
                >
                  {selectedMail.senderOrRecipient}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-zinc-400" /> Penandatangan &amp; Wilayah
                </span>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {selectedMail.senderTitle || "-"} • {selectedMail.senderLocation || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Content / Document Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {isHtmlDocument
                    ? "Pratinjau Lembar Surat Resmi"
                    : "Isi Ringkasan Pokok Surat"}
                </span>
              </label>
              {isHtmlDocument && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintMail(selectedMail)}
                  className="h-7 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-none"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak / Simpan PDF</span>
                </Button>
              )}
            </div>

            {isHtmlDocument ? (
              /* Authentic Document Paper Preview */
              <div className="bg-zinc-100 dark:bg-zinc-950/80 p-3 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-[440px] overflow-y-auto">
                <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-lg shadow-sm border border-zinc-200/90 max-w-full overflow-x-auto text-[13px] leading-relaxed">
                  <div
                    className="preview-official-letter select-text"
                    dangerouslySetInnerHTML={{ __html: selectedMail.content }}
                  />
                </div>
              </div>
            ) : (
              /* Clean Plain Text Box */
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 max-h-56 overflow-y-auto">
                {selectedMail.content ? (
                  <p className="whitespace-pre-line">{selectedMail.content}</p>
                ) : (
                  <p className="text-zinc-400 italic">Tidak ada konten teks terlampir.</p>
                )}
              </div>
            )}
          </div>

          {/* Lampiran Berkas Asli (PDF / Scan) */}
          {selectedMail.fileUrl && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Lampiran Berkas Fisik / Dokumen</span>
              </label>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                <div className="flex items-center gap-3 truncate min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {selectedMail.fileName || "Berkas_Lampiran"}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {selectedMail.fileSize || "Tersimpan di Cloud Storage"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <a
                    href={selectedMail.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 border border-blue-200 dark:border-blue-900/60 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Berkas</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCopyNomor(selectedMail.nomor)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {copiedNomor ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedNomor ? "Nomor Tersalin!" : "Salin No. Surat"}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isHtmlDocument && (
              <Button
                type="button"
                onClick={() => handlePrintMail(selectedMail)}
                className="h-9 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Surat</span>
              </Button>
            )}
            <DialogClose render={
              <Button
                type="button"
                variant="outline"
                className="h-9 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Tutup
              </Button>
            } />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
