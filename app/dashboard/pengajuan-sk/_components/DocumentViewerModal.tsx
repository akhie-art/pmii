"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { resolveStorageUrl } from "@/lib/storage";
import { getFileExtension } from "./sk-file-helpers";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}: DocumentViewerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  const ext = getFileExtension(fileUrl, fileName);
  const isDocx = ext === "docx" || ext === "doc";
  const isPdf = ext === "pdf";
  const isXlsx = ext === "xlsx" || ext === "xls" || ext === "csv";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);

  // Resolve private-docs signed URL ketika modal dibuka
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      queueMicrotask(() => setResolvedUrl(""));
      return;
    }
    let active = true;
    resolveStorageUrl(fileUrl).then((url) => {
      if (active) setResolvedUrl(url || fileUrl);
    });
    return () => {
      active = false;
    };
  }, [isOpen, fileUrl]);

  // Efek memuat PDF via Blob agar browser tidak memicu unduhan otomatis
  useEffect(() => {
    if (!isOpen || !resolvedUrl || !isPdf) {
      queueMicrotask(() => setPdfUrl(""));
      return;
    }

    let active = true;
    let blobUrl = "";
    queueMicrotask(() => {
      if (active) {
        setIsLoading(true);
        setLoadError(null);
      }
    });

    (async () => {
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas PDF");
        const blob = await res.blob();
        if (!active) return;
        blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setPdfUrl(blobUrl);
      } catch {
        if (active) setPdfUrl(resolvedUrl);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, resolvedUrl, isPdf]);

  // Efek merender DOCX / DOC
  useEffect(() => {
    if (!isOpen || !resolvedUrl || !isDocx) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setLoadError(null);
      }
    });

    (async () => {
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas dokumen");
        const buffer = await res.arrayBuffer();
        if (!isMounted || !containerRef.current) return;

        const targetEl = containerRef.current;
        targetEl.innerHTML = "";

        try {
          const docx = await import("docx-preview");
          await docx.renderAsync(buffer, targetEl, undefined, {
            className: "docx",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderAltChunks: true,
          });
        } catch (docxErr) {
          console.warn("docx-preview gagal, mencoba mammoth fallback:", docxErr);
          const mammoth = await import("mammoth");
          const { sanitizeHtml } = await import("@/lib/sanitize");
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (!isMounted || !containerRef.current) return;
          targetEl.innerHTML = `<div class="p-8 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 max-w-3xl w-full mx-auto leading-relaxed text-sm font-sans">${sanitizeHtml(result.value)}</div>`;
        }
      } catch (err) {
        console.error("Gagal render preview Word docx:", err);
        if (isMounted) {
          setLoadError("Pratinjau dokumen Word tidak dapat ditampilkan.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, resolvedUrl, isDocx]);

  // Efek merender Excel (XLSX / XLS / CSV)
  useEffect(() => {
    if (!isOpen || !resolvedUrl || !isXlsx) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setLoadError(null);
      }
    });

    (async () => {
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas spreadsheet");
        const buffer = await res.arrayBuffer();
        if (!isMounted || !containerRef.current) return;

        const { spreadsheetBufferToSafeHtml } = await import("@/lib/excel");
        const { escapeHtml } = await import("@/lib/sanitize");
        const { sheetName: firstSheetName, sheetCount, htmlTable } =
          await spreadsheetBufferToSafeHtml(buffer, fileName || fileUrl);

        if (!isMounted || !containerRef.current) return;
        const targetEl = containerRef.current;
        targetEl.innerHTML = `
          <div class="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Lembar Kerja: ${escapeHtml(firstSheetName)}</span>
              <span class="text-[10px] text-zinc-400">Total ${sheetCount} sheet</span>
            </div>
            <div class="overflow-x-auto text-xs [&>table]:w-full [&>table]:border-collapse [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-800 [&_th]:p-2 [&_th]:border [&_th]:border-zinc-200 dark:[&_th]:border-zinc-700 [&_td]:p-2 [&_td]:border [&_td]:border-zinc-200 dark:[&_td]:border-zinc-700 text-zinc-800 dark:text-zinc-200">
              ${htmlTable}
            </div>
          </div>
        `;
      } catch (err) {
        console.error("Gagal render preview Excel:", err);
        if (isMounted) {
          setLoadError("Pratinjau spreadsheet tidak dapat ditampilkan.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, resolvedUrl, isXlsx, fileName, fileUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <div className="px-5 py-3.5 pr-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-sm sm:max-w-md">
                {fileName || "Pratinjau Dokumen"}
              </p>
              <p className="text-[10px] text-zinc-500">
                Mode Pratinjau Dokumen {ext ? `(${ext.toUpperCase()})` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-zinc-100/60 dark:bg-zinc-950/80 min-h-[400px] max-h-[78vh] flex flex-col items-center">
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-medium animate-pulse">Memuat pratinjau dokumen...</p>
            </div>
          )}

          {loadError && !isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-center max-w-md">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{loadError}</p>
              <p className="text-[11px] text-zinc-500">
                Dokumen tidak dapat dibuka di dalam pratinjau browser saat ini.
              </p>
            </div>
          )}

          {(isDocx || isXlsx) && (
            <div
              ref={containerRef}
              className={`w-full overflow-y-auto flex flex-col items-center ${isLoading || loadError ? "hidden" : "block"}`}
            />
          )}

          {isPdf && !loadError && resolvedUrl && (
            <div className={`w-full h-full flex flex-col ${isLoading ? "hidden" : "block"}`}>
              <iframe
                src={pdfUrl || resolvedUrl}
                className="w-full h-[74vh] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                title={fileName}
              />
            </div>
          )}

          {isImage && resolvedUrl && (
            <div className="flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl}
                alt={fileName}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          )}

          {!isDocx && !isXlsx && !isPdf && !isImage && !isLoading && !loadError && (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                {fileName || "Dokumen Lampiran"}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Format berkas ({ext ? `.${ext.toUpperCase()}` : "tidak dikenal"}) ini tidak didukung untuk pratinjau visual langsung di browser.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
