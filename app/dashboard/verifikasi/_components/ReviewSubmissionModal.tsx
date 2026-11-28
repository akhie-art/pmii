"use client";

import React from "react";
import { AlertCircle, ExternalLink, Check, X, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ParticipantAvatar } from "./ParticipantAvatar";
import type { DisplaySubmission } from "./VerifikasiSubmissionsTab";
import { isSafeDocumentUrl, openSafeDocumentUrl } from "./verifikasi-helper";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reviewingSubmission: DisplaySubmission | null;
  reviewStatus: "APPROVED" | "REJECTED";
  onReviewStatusChange: (status: "APPROVED" | "REJECTED") => void;
  reviewFeedback: string;
  onReviewFeedbackChange: (feedback: string) => void;
  reviewError?: string;
  isSubmittingReview: boolean;
  onSubmitReview: (e: React.FormEvent) => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onOpenChange,
  reviewingSubmission,
  reviewStatus,
  onReviewStatusChange,
  reviewFeedback,
  onReviewFeedbackChange,
  reviewError,
  isSubmittingReview,
  onSubmitReview,
}: ReviewSubmissionModalProps) {
  const safeFileUrl = isSafeDocumentUrl(reviewingSubmission?.fileLink);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Validasi Berkas Laporan RTL
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Periksa lampiran berkas dan berikan catatan evaluasi untuk kader.
          </DialogDescription>
        </DialogHeader>

        {reviewingSubmission && (
          <form onSubmit={onSubmitReview} className="space-y-4">
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ParticipantAvatar
                      name={reviewingSubmission.cadreName}
                      photoUrl={reviewingSubmission.cadreAvatar}
                      sizeClass="w-9 h-9"
                      textClass="text-xs"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                        {reviewingSubmission.cadreName}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                        {reviewingSubmission.eventName ||
                          `Jenjang ${reviewingSubmission.cadreLevel}`}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none text-[10px] shrink-0">
                    {reviewingSubmission.cadreLevel}
                  </Badge>
                </div>

                {reviewingSubmission.requirementTitle && (
                  <p className="text-[10.5px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 px-2 py-1 rounded-md">
                    Tugas: {reviewingSubmission.requirementTitle}
                  </p>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {reviewingSubmission.title}
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                    {reviewingSubmission.description ||
                      "Tidak ada deskripsi tambahan."}
                  </p>
                </div>

                {reviewingSubmission.fileLink && (
                  <div className="pt-1.5 border-t border-zinc-200/70 dark:border-zinc-700/60">
                    {safeFileUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          void openSafeDocumentUrl(reviewingSubmission.fileLink)
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka Tautan Berkas / Dokumen
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Tautan dokumen tidak valid atau diblokir demi keamanan.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Decision */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Keputusan Hasil Peninjauan{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => onReviewStatusChange("APPROVED")}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      reviewStatus === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Setujui (Lulus)
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => onReviewStatusChange("REJECTED")}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      reviewStatus === "REJECTED"
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-400 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Minta Revisi
                  </button>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Catatan Masukan / Umpan Balik{" "}
                  {reviewStatus === "REJECTED" ? (
                    <span className="text-rose-500">* (Wajib untuk Revisi)</span>
                  ) : (
                    <span className="text-zinc-400 font-normal">(Opsional)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => onReviewFeedbackChange(e.target.value)}
                  placeholder={
                    reviewStatus === "REJECTED"
                      ? "Jelaskan bagian laporan yang harus diperbaiki kader sebelum diunggah ulang..."
                      : "Tuliskan catatan apresiasi atau masukan tambahan bagi kader..."
                  }
                  className={`w-full text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border focus:ring-2 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 font-medium resize-y ${
                    reviewError
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                  }`}
                />
                {reviewError ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{reviewError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400">
                    Catatan ini akan langsung tampil di akun kader saat membuka
                    riwayat laporan RTL.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingReview}
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReview}
                className={`h-9 text-xs font-semibold rounded-xl text-white cursor-pointer inline-flex items-center gap-1.5 ${
                  reviewStatus === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmittingReview ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : reviewStatus === "APPROVED" ? (
                  "Simpan & Setujui"
                ) : (
                  "Simpan & Minta Revisi"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
