"use client";

import React from "react";
import { ExternalLink, Check, X } from "lucide-react";
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
import type { CadreSubmission } from "@/lib/db";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reviewingSubmission: CadreSubmission | null;
  reviewingCadreName: string;
  reviewingCadreLevel: string;
  reviewingCadreAvatar: string | null;
  reviewStatus: "APPROVED" | "REJECTED";
  onReviewStatusChange: (status: "APPROVED" | "REJECTED") => void;
  reviewFeedback: string;
  onReviewFeedbackChange: (feedback: string) => void;
  isSubmittingReview: boolean;
  onSubmitReview: (e: React.FormEvent) => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onOpenChange,
  reviewingSubmission,
  reviewingCadreName,
  reviewingCadreLevel,
  reviewingCadreAvatar,
  reviewStatus,
  onReviewStatusChange,
  reviewFeedback,
  onReviewFeedbackChange,
  isSubmittingReview,
  onSubmitReview,
}: ReviewSubmissionModalProps) {
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
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ParticipantAvatar
                      name={reviewingCadreName}
                      photoUrl={reviewingCadreAvatar}
                      sizeClass="w-9 h-9"
                      textClass="text-xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                        {reviewingCadreName}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Jenjang {reviewingCadreLevel}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none text-[10px]">
                    {reviewingCadreLevel}
                  </Badge>
                </div>
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {reviewingSubmission.title}
                </h4>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {reviewingSubmission.description || "Tidak ada deskripsi tambahan."}
                </p>
                {reviewingSubmission.fileLink && (
                  <div className="pt-2">
                    <a
                      href={reviewingSubmission.fileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Tautan Berkas / Dokumen
                    </a>
                  </div>
                )}
              </div>

              {/* Decision */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Keputusan Hasil Peninjauan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
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
                  Catatan Masukan / Umpan Balik
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => onReviewFeedbackChange(e.target.value)}
                  placeholder="Tuliskan catatan apresiasi atau hal yang perlu diperbaiki kader..."
                  className="w-full text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 font-medium resize-y"
                />
                <p className="text-[10px] text-zinc-400">
                  Catatan ini akan langsung tampil di akun kader saat membuka riwayat laporan RTL.
                </p>
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReview}
                className={`h-9 text-xs font-semibold rounded-xl text-white cursor-pointer ${
                  reviewStatus === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmittingReview
                  ? "Menyimpan..."
                  : reviewStatus === "APPROVED"
                  ? "Simpan & Setujui"
                  : "Simpan & Minta Revisi"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
