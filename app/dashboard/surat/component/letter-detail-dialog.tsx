"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  Copy,
  Check,
  Paperclip,
  ExternalLink,
  Edit3,
  Loader2,
  Lock,
  Download,
  X,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { MailItem } from "./types";
import { sanitizeLetterHtml, escapeHtml } from "@/lib/sanitize";
import { resolveStorageUrl, isPrivateStorageRef } from "@/lib/storage";
import {
  generateLetterQrDataUrl,
  buildHtmlQrFooter,
  hasHtmlQrFooter,
} from "./letter-qr-helper";
import { isFormattedHtmlContent } from "./letter-record-helper";
import {
  buildPrintFontContext,
  buildDocxPrintStyleBlock,
  buildPrintAutoTriggerScript,
} from "./docx-preview-helper";
import {
  extractLetterEditMetadata,
  stripLetterEditMetadata,
  computeBulkRecipientNomor,
  parseBulkRangeNomor,
} from "./letter-generator-helpers";

interface LetterDetailDialogProps {
  selectedMail: MailItem | null;
  onClose: () => void;
  copiedNomor: boolean;
  onCopyNomor: (nomor: string) => void;
  showToast: (msg: string) => void;
  getClassificationBadge?: (cls: MailItem["classification"]) => React.ReactNode;
  getStatusBadge?: (status: MailItem["status"]) => React.ReactNode;
  onUpdateStatus?: (mailId: string, status: MailItem["status"]) => Promise<void> | void;
  onEditMail?: (mail: MailItem) => void;
}

export function LetterDetailDialog({
  selectedMail,
  onClose,
  copiedNomor,
  onCopyNomor,
  showToast,
  onUpdateStatus,
  onEditMail,
}: LetterDetailDialogProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isOpeningAttachment, setIsOpeningAttachment] = useState(false);
  const [qrMeta, setQrMeta] = useState<{
    qrDataUrl: string;
    verificationUrl: string;
    shortCode: string;
  } | null>(null);
  const [copiedVerifyUrl, setCopiedVerifyUrl] = useState(false);
  const [showAllBulkRecipients, setShowAllBulkRecipients] = useState(false);

  const selectedMailId = selectedMail?.id;
  const isOutgoingMail = selectedMail?.type === "KELUAR";

  useEffect(() => {
    queueMicrotask(() => setShowAllBulkRecipients(false));
  }, [selectedMailId]);

  useEffect(() => {
    if (!selectedMailId || !isOutgoingMail) {
      queueMicrotask(() => setQrMeta(null));
      return;
    }
    let cancelled = false;
    generateLetterQrDataUrl(selectedMailId)
      .then((meta) => {
        if (!cancelled) setQrMeta(meta);
      })
      .catch((err) => {
        console.warn("Gagal membuat QR verifikasi detail surat:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMailId, isOutgoingMail]);

  if (!selectedMail) return null;

  const isMasuk = selectedMail.type === "MASUK";
  const isHtmlDocument = isFormattedHtmlContent(selectedMail.content);
  const isDocxRendered = Boolean(selectedMail.content?.includes("docx-wrapper"));
  const extractedEditMeta = extractLetterEditMetadata(selectedMail.content);
  const bulkMeta =
    extractedEditMeta?.mode === "bulk" &&
    extractedEditMeta.bulk &&
    extractedEditMeta.bulk.recipients.length > 0
      ? extractedEditMeta.bulk
      : null;
  const bulkRecipientCount = bulkMeta?.recipients.length || 0;
  const isBulkDocument = Boolean(
    bulkRecipientCount > 1 || selectedMail.content?.includes("bulk-letter-page")
  );
  const bulkStartNomor =
    bulkMeta?.startNomor ||
    parseBulkRangeNomor(selectedMail.nomor)?.startNomor ||
    selectedMail.nomor;

  const handleCopyVerifyUrl = () => {
    if (!qrMeta?.verificationUrl) return;
    navigator.clipboard?.writeText(qrMeta.verificationUrl).catch(() => {});
    setCopiedVerifyUrl(true);
    setTimeout(() => setCopiedVerifyUrl(false), 1800);
  };

  const handleDownloadQrPng = () => {
    if (!qrMeta?.qrDataUrl) return;
    const safeNomor = (selectedMail.nomor || "Surat").replace(/[/\\?%*:|"<>]/g, "_");
    const a = document.createElement("a");
    a.href = qrMeta.qrDataUrl;
    a.download = `QR_Verifikasi_${safeNomor}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleStatusChange = async (nextStatus: MailItem["status"]) => {
    if (!onUpdateStatus || selectedMail.status === nextStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(selectedMail.id, nextStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenAttachment = async () => {
    if (!selectedMail.fileUrl || isOpeningAttachment) return;
    setIsOpeningAttachment(true);
    try {
      const resolvedUrl = await resolveStorageUrl(selectedMail.fileUrl);
      if (!resolvedUrl) {
        showToast("Gagal menyiapkan tautan aman berkas lampiran.");
        return;
      }
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } catch {
      showToast("Gagal membuka berkas lampiran.");
    } finally {
      setIsOpeningAttachment(false);
    }
  };

  const handlePrintMail = async (mail: MailItem) => {
    if (!mail.content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    const printTitle = escapeHtml((mail.nomor || "Surat_Resmi").replace(/[\s\/\.]+/g, "_"));
    let safeMailContent = stripLetterEditMetadata(
      sanitizeLetterHtml(mail.content, { preserveDocxLayout: true })
    );

    // Pastikan setiap surat keluar memiliki QR verifikasi di footer saat dicetak (termasuk arsip lama)
    if (mail.type === "KELUAR" && !hasHtmlQrFooter(safeMailContent)) {
      try {
        const meta = qrMeta || (await generateLetterQrDataUrl(mail.id));
        const footerHtml = buildHtmlQrFooter({
          letterId: mail.id,
          nomor: mail.nomor,
          qrDataUrl: meta.qrDataUrl,
          verificationUrl: meta.verificationUrl,
          orgLabel: mail.commissariat || "PMII",
        });
        safeMailContent = `${safeMailContent}\n${footerHtml}`;
      } catch (err) {
        console.warn("Gagal menyisipkan footer QR saat cetak:", err);
      }
    }

    const isBulkPrint = safeMailContent.includes("bulk-letter-page");
    const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");
    const { htmlClassAttr, fontVarsCss, baseHref } = buildPrintFontContext();
    const printStyles = buildDocxPrintStyleBlock(safeMailContent, {
      fontVarsCss,
      isBulk: isBulkPrint,
      nonDocxContainerPadding: "15mm 20mm",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id" class="${escapeHtml(htmlClassAttr)}">
        <head>
          <meta charset="utf-8">
          ${baseHref ? `<base href="${escapeHtml(baseHref)}">` : ""}
          <title>${printTitle}</title>
          ${allStyles}
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="letter-print-container">
            ${safeMailContent}
          </div>
          ${buildPrintAutoTriggerScript(isBulkPrint ? 280 : 220)}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusOptions: Array<{
    value: MailItem["status"];
    label: string;
    dotClass: string;
  }> = isMasuk
    ? [
        { value: "Menunggu Tindak Lanjut", label: "Menunggu", dotClass: "bg-rose-500" },
        { value: "Diproses", label: "Diproses", dotClass: "bg-amber-500" },
        { value: "Selesai", label: "Selesai", dotClass: "bg-emerald-500" },
      ]
    : [
        { value: "Terkirim", label: "Terkirim", dotClass: "bg-blue-500" },
        { value: "Diproses", label: "Diproses", dotClass: "bg-amber-500" },
        { value: "Selesai", label: "Selesai", dotClass: "bg-emerald-500" },
      ];

  const signerDisplay =
    selectedMail.senderTitle && selectedMail.senderLocation
      ? `${selectedMail.senderTitle} · ${selectedMail.senderLocation}`
      : selectedMail.senderTitle || selectedMail.senderLocation || "—";

  return (
    <Dialog open={!!selectedMail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full p-0 overflow-hidden gap-0 ${
          isHtmlDocument ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        {/* 1. HEADER MINIMALIS (Perihal sebagai fokus utama) */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              {/* Eyebrow Meta */}
              <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isMasuk ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                  />
                  <span>{isMasuk ? "Surat Masuk" : "Surat Keluar"}</span>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{selectedMail.classification}</span>
                {isBulkDocument && bulkRecipientCount > 1 && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-[10px] font-semibold">
                      <Users className="w-2.5 h-2.5" />
                      <span>Surat Massal · {bulkRecipientCount} Penerima</span>
                    </span>
                  </>
                )}
                {selectedMail.commissariat && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="truncate max-w-[240px]">{selectedMail.commissariat}</span>
                  </>
                )}
              </div>

              {/* Main Subject */}
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
                {selectedMail.subject}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detail informasi dan isi arsip {isMasuk ? "surat masuk" : "surat keluar"}
              </DialogDescription>

              {/* Nomor Surat + Copy Inline */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 break-all">
                  {selectedMail.nomor}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyNomor(selectedMail.nomor)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                  title="Salin nomor surat"
                >
                  {copiedNomor ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <DialogClose
              render={
                <button
                  type="button"
                  aria-label="Tutup modal detail surat"
                  className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              }
            />
          </div>
        </DialogHeader>

        {/* 2. BODY KONTEN RAPI & LAPANG */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Metadata Grid Minimalis */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
            <div className="space-y-0.5">
              <dt className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                Tanggal Surat
              </dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedMail.dateIndo || selectedMail.date || "—"}
              </dd>
            </div>

            <div className="space-y-0.5 min-w-0">
              <dt className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {isMasuk ? "Instansi Pengirim" : "Instansi Tujuan"}
              </dt>
              <dd
                className="font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                title={selectedMail.senderOrRecipient}
              >
                {selectedMail.senderOrRecipient || "—"}
              </dd>
            </div>

            <div className="space-y-0.5 min-w-0">
              <dt className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                Penandatangan
              </dt>
              <dd
                className="font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                title={signerDisplay}
              >
                {signerDisplay}
              </dd>
            </div>
          </dl>

          {/* Status Segmented Control (1 tempat saja, tenang & bersih) */}
          {onUpdateStatus && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Status Arsip
              </span>
              <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800 self-start sm:self-auto">
                {statusOptions.map((opt) => {
                  const isCurrent = selectedMail.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isUpdatingStatus || isCurrent}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`h-7 px-3 rounded-lg text-[11px] transition-all flex items-center gap-1.5 border-none cursor-pointer disabled:cursor-default ${
                        isCurrent
                          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold shadow-2xs"
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
                      }`}
                    >
                      {isUpdatingStatus && !isCurrent ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCurrent ? opt.dotClass : "bg-zinc-300 dark:bg-zinc-600"
                          }`}
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daftar Penerima Surat Massal (1 Arsip Terpadu) */}
          {bulkMeta && bulkMeta.recipients.length > 1 && (
            <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Daftar Penerima Massal ({bulkMeta.recipients.length} Penerima)</span>
                </span>
                {bulkMeta.recipients.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllBulkRecipients((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    <span>
                      {showAllBulkRecipients
                        ? "Ringkas"
                        : `Lihat semua (${bulkMeta.recipients.length})`}
                    </span>
                    {showAllBulkRecipients ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 divide-y divide-zinc-200/60 dark:divide-zinc-800/60 max-h-52 overflow-y-auto">
                {(showAllBulkRecipients
                  ? bulkMeta.recipients
                  : bulkMeta.recipients.slice(0, 4)
                ).map((rec, idx) => (
                  <div
                    key={`${idx}-${rec}`}
                    className="px-3 py-2 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-400 w-5 shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {rec}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                      {computeBulkRecipientNomor(
                        bulkStartNomor,
                        idx,
                        bulkMeta.isSequentialNumbering
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Isi / Pratinjau Lembar Surat */}
          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                {isHtmlDocument ? "Pratinjau Dokumen" : "Ringkasan Isi Surat"}
              </span>
              {isBulkDocument && bulkRecipientCount > 1 && (
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  {bulkRecipientCount} lembar tergabung dalam 1 arsip
                </span>
              )}
            </div>

            {isHtmlDocument ? (
              <div className="bg-zinc-100/80 dark:bg-zinc-950 p-3 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 max-h-[420px] overflow-auto">
                {isDocxRendered ? (
                  <div
                    className="preview-official-letter select-text flex flex-col items-center [&_.bulk-letter-page]:w-full [&_.bulk-letter-page]:mb-4 [&_.bulk-letter-page:last-of-type]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeLetterHtml(selectedMail.content, {
                        preserveDocxLayout: true,
                      }),
                    }}
                  />
                ) : (
                  <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-lg shadow-2xs border border-zinc-200/80 max-w-full overflow-x-auto text-[13px] leading-relaxed">
                    <div
                      className="preview-official-letter select-text [&_.bulk-letter-page]:pb-6 [&_.bulk-letter-page]:mb-6 [&_.bulk-letter-page]:border-b [&_.bulk-letter-page]:border-dashed [&_.bulk-letter-page]:border-zinc-300 [&_.bulk-letter-page:last-of-type]:border-b-0 [&_.bulk-letter-page:last-of-type]:mb-0 [&_.bulk-letter-page:last-of-type]:pb-0"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeLetterHtml(selectedMail.content, {
                          preserveDocxLayout: true,
                        }),
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800 text-xs sm:text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 max-h-52 overflow-y-auto">
                {selectedMail.content ? (
                  <p className="whitespace-pre-line">{selectedMail.content}</p>
                ) : (
                  <p className="text-zinc-400 italic">Tidak ada ringkasan teks tercatat.</p>
                )}
              </div>
            )}
          </div>

          {/* Lampiran Berkas Fisik (jika ada) */}
          {selectedMail.fileUrl && (
            <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Lampiran Berkas
              </span>
              <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                    {isPrivateStorageRef(selectedMail.fileUrl) ? (
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                      title={selectedMail.fileName || "Berkas Lampiran"}
                    >
                      {selectedMail.fileName || "Berkas Lampiran"}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedMail.fileSize || "Dokumen tersimpan"}
                      {isPrivateStorageRef(selectedMail.fileUrl) ? " · Penyimpanan Privat" : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isOpeningAttachment}
                  onClick={handleOpenAttachment}
                  className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 shadow-none"
                >
                  {isOpeningAttachment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  <span>{isOpeningAttachment ? "Membuka..." : "Buka"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* QR Verifikasi Ringkas & Minimalis (khusus Surat Keluar) */}
          {isOutgoingMail && qrMeta && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  <SmartImage
                    src={qrMeta.qrDataUrl}
                    alt="QR Verifikasi Surat"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      QR Verifikasi Keaslian
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tersemat otomatis di footer saat surat dicetak
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={qrMeta.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Buka halaman verifikasi publik"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Cek</span>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyVerifyUrl}
                    className="h-8 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer shadow-none"
                    title="Salin tautan verifikasi"
                  >
                    {copiedVerifyUrl ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-500" />
                    )}
                    <span>{copiedVerifyUrl ? "Disalin" : "Link"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQrPng}
                    className="h-8 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer shadow-none"
                    title="Unduh gambar QR Code (.png)"
                  >
                    <Download className="w-3 h-3 text-zinc-500" />
                    <span>PNG</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. FOOTER RINGKAS TANPA AKSI GANDA */}
        <DialogFooter className="mx-0 mb-0 rounded-none px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 flex flex-row items-center justify-between sm:justify-between gap-2 w-full">
          <div>
            {onEditMail && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = selectedMail;
                  onClose();
                  onEditMail(target);
                }}
                className="h-9 px-3.5 text-xs font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-200 shadow-none"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {isMasuk
                    ? "Edit Arsip"
                    : isBulkDocument
                    ? "Edit / Revisi Massal"
                    : "Edit Surat"}
                </span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant={isHtmlDocument ? "ghost" : "outline"}
                  className={
                    isHtmlDocument
                      ? "h-9 px-3.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                      : "h-9 px-4 text-xs font-medium rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shadow-none"
                  }
                >
                  Tutup
                </Button>
              }
            />
            {isHtmlDocument && (
              <Button
                type="button"
                onClick={() => handlePrintMail(selectedMail)}
                className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {isBulkDocument && bulkRecipientCount > 1
                    ? `Cetak ${bulkRecipientCount} Surat (PDF)`
                    : "Cetak PDF"}
                </span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
