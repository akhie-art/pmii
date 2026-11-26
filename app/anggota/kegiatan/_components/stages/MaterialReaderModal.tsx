"use client";

import React from "react";
import { BookOpen, Download, Loader2, Lock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface ActiveReadingState {
  fileName?: string;
  fileUrl?: string;
  isRef?: boolean;
  sessionTitle?: string;
}

interface MaterialReaderModalProps {
  activeReadingModal: ActiveReadingState | null;
  isMobile: boolean;
  isDownloading: boolean;
  isReaderLoading: boolean;
  setIsReaderLoading: (loading: boolean) => void;
  onDownload: (url?: string, fileName?: string) => void;
  onClose: () => void;
  getFileTypeBadge: (fileName: string) => { label: string; color: string };
}

export function MaterialReaderModal({
  activeReadingModal,
  isMobile,
  isDownloading,
  isReaderLoading,
  setIsReaderLoading,
  onDownload,
  onClose,
  getFileTypeBadge,
}: MaterialReaderModalProps) {
  return (
    <Dialog
      open={Boolean(activeReadingModal)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl w-[95vw] sm:w-[90vw] h-[90vh] max-h-[92vh] flex flex-col p-0 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl"
      >
        {activeReadingModal &&
          (() => {
            const fileName = activeReadingModal.fileName || "Modul Materi";
            const fileUrl = activeReadingModal.fileUrl;
            const typeBadge = getFileTypeBadge(fileName);
            const ext = fileName.split(".").pop()?.toLowerCase() || "";
            const isPdf = ext === "pdf" || Boolean(fileUrl && fileUrl.toLowerCase().includes(".pdf"));
            const isImage = ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext);
            const isOfficeDoc = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext);
            const isHttpUrl = Boolean(
              fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))
            );

            const isTouchOrMobile =
              isMobile ||
              (typeof window !== "undefined" &&
                ("ontouchstart" in window || navigator.maxTouchPoints > 0));
            const shouldUseGoogleViewer = isHttpUrl && (isOfficeDoc || (isPdf && isTouchOrMobile));

            const embedUrl =
              shouldUseGoogleViewer && fileUrl
                ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
                : fileUrl;

            return (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 sm:px-5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/40">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${typeBadge.color}`}>
                          {typeBadge.label}
                        </Badge>
                        {activeReadingModal.isRef && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.2 rounded font-medium">
                            Referensi
                          </Badge>
                        )}
                        {activeReadingModal.sessionTitle && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-xs">
                            {activeReadingModal.sessionTitle}
                          </span>
                        )}
                      </div>
                      <DialogTitle className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                        {fileName}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Penampil modul materi kegiatan {fileName}
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {fileUrl && fileUrl !== "#" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDownloading}
                        onClick={() => onDownload(fileUrl, fileName)}
                        className="h-7.5 px-2.5 text-xs font-medium gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 border-zinc-200 dark:border-zinc-800 rounded-md cursor-pointer shadow-none"
                        title="Unduh untuk baca luring (offline)"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Unduh</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      className="h-7.5 w-7.5 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md cursor-pointer"
                      title="Tutup penampil modul"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-1 sm:p-3 overflow-hidden relative flex flex-col items-center justify-center min-h-0">
                  {!fileUrl || fileUrl === "#" ? (
                    <div className="p-8 text-center max-w-md space-y-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Berkas Sedang Disiapkan
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Instruktur belum mengunggah salinan digital untuk berkas ini. Anda dapat
                          mempelajari silabus atau menghubungi panitia.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isReaderLoading && (
                        <div className="absolute inset-0 bg-zinc-100/90 dark:bg-zinc-950/90 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10">
                          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Memuat dokumen modul...
                          </span>
                        </div>
                      )}

                      {isImage ? (
                        <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fileUrl}
                            alt={fileName}
                            onLoad={() => setIsReaderLoading(false)}
                            className="max-w-full max-h-full object-contain rounded-md shadow-md border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex-1 flex flex-col rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-inner overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                          <iframe
                            src={embedUrl}
                            title={fileName}
                            onLoad={() => setIsReaderLoading(false)}
                            className="w-full h-full flex-1 border-0 rounded-md min-h-full"
                            allow="autoplay; encrypted-media"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}
      </DialogContent>
    </Dialog>
  );
}
