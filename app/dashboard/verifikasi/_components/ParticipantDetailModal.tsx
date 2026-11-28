"use client";

import React from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSearch,
  RotateCcw,
} from "lucide-react";
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
import { formatDateTimeIndo, EventParticipantProgress } from "./types";
import type { Requirement, CadreSubmission } from "@/lib/db";
import {
  isDeadlineOverdue,
  isSafeDocumentUrl,
  openSafeDocumentUrl,
  translateSubmissionStatus,
} from "./verifikasi-helper";

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participant: EventParticipantProgress | null;
  onReviewSubmission: (
    participant: EventParticipantProgress,
    sub: CadreSubmission
  ) => void;
  onSahkanKelulusan: (p: EventParticipantProgress) => void;
  onRevokeKelulusan: (p: EventParticipantProgress) => void;
}

export function ParticipantDetailModal({
  isOpen,
  onOpenChange,
  participant,
  onReviewSubmission,
  onSahkanKelulusan,
  onRevokeKelulusan,
}: ParticipantDetailModalProps) {
  const reqIds = new Set(
    (participant?.applicableRequirements || []).map((r) => r.id)
  );
  const unmappedSubmissions = (participant?.submissions || []).filter(
    (s) => !reqIds.has(s.requirementId)
  );
  const isUnscreened =
    String(participant?.regStatus || "").toUpperCase() === "PENDING";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ParticipantAvatar
                name={participant?.cadreName || "Peserta"}
                photoUrl={participant?.photoUrl}
                sizeClass="w-10 h-10"
                textClass="text-sm"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {participant?.cadreName || "Rincian Progres RTL Peserta"}
                  </DialogTitle>
                  {isUnscreened && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none text-[10px] font-semibold">
                      Belum Screening
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  {participant?.eventName} •{" "}
                  {participant?.cadreEmail || participant?.phone}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none font-bold text-xs shrink-0">
              {participant?.progressPercent ?? 0}% Selesai
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Status Pemenuhan Tugas
              </h4>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {participant?.approvedCount ?? 0} /{" "}
                {participant?.totalRequirements ?? 0} tugas tuntas
              </span>
            </div>

            {participant && participant.applicableRequirements.length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Belum ada tugas RTL yang ditetapkan untuk kegiatan ini.
              </div>
            )}

            {participant?.applicableRequirements?.map((req: Requirement) => {
              const cadreSubs: CadreSubmission[] =
                participant.submissions?.filter(
                  (s: CadreSubmission) => s.requirementId === req.id
                ) || [];

              const approvedCount = cadreSubs.filter(
                (s) => s.status === "APPROVED"
              ).length;
              const minNeeded = Math.max(1, Number(req.minSubmissions) || 1);
              const isCompleted = approvedCount >= minNeeded;
              const overdue = !isCompleted && isDeadlineOverdue(req.deadline);

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                        {req.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {minNeeded > 1 && (
                          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                            Progres: {approvedCount}/{minNeeded} laporan
                          </span>
                        )}
                        {req.deadline && (
                          <span
                            className={`text-[10px] font-medium inline-flex items-center gap-1 ${
                              overdue
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Deadline: {formatDateTimeIndo(req.deadline)}
                            {overdue ? " (Lewat)" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {isCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 border-none text-[10px] font-semibold shrink-0">
                        Belum Selesai
                      </Badge>
                    )}
                  </div>

                  {/* Submissions by this user for this requirement */}
                  {cadreSubs.length > 0 ? (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                      {cadreSubs.map((sub) => {
                        const safeDoc = isSafeDocumentUrl(sub.fileLink);
                        return (
                          <div
                            key={sub.id}
                            className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                                  {sub.title}
                                </span>
                                {sub.date && (
                                  <span className="text-[10px] text-zinc-400">
                                    Dikirim: {formatDateTimeIndo(sub.date)}
                                  </span>
                                )}
                              </div>
                              <Badge
                                className={`text-[9.5px] font-bold border-none shrink-0 ${
                                  sub.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : sub.status === "REJECTED"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                }`}
                              >
                                {translateSubmissionStatus(sub.status)}
                              </Badge>
                            </div>

                            {sub.feedback && (
                              <p className="italic text-zinc-500 dark:text-zinc-400 text-[10.5px] bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded">
                                Catatan: {sub.feedback}
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                              {safeDoc ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void openSafeDocumentUrl(sub.fileLink)
                                  }
                                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold text-[10.5px] cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Lihat Berkas Laporan
                                </button>
                              ) : sub.fileLink ? (
                                <span className="text-[10px] text-rose-500 inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Tautan tidak valid
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400">
                                  Tanpa lampiran
                                </span>
                              )}

                              {participant.matchedCadre && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onReviewSubmission(participant, sub)
                                  }
                                  className="h-7 px-2.5 text-[10.5px] font-semibold rounded-lg border-zinc-200 dark:border-zinc-700 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileSearch className="w-3 h-3" />
                                  {sub.status === "PENDING"
                                    ? "Review Berkas"
                                    : "Ubah Review"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-zinc-400 italic pt-1">
                      Belum ada laporan yang diunggah peserta untuk tugas ini.
                    </p>
                  )}
                </div>
              );
            })}

            {participant && unmappedSubmissions.length > 0 && (
              <div className="pt-2 space-y-2">
                <h5 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Laporan Tambahan / Riwayat Tugas Lainnya
                </h5>
                {unmappedSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 block truncate">
                        {sub.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {translateSubmissionStatus(sub.status)}
                      </span>
                    </div>
                    {participant.matchedCadre && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onReviewSubmission(participant, sub)}
                        className="h-7 px-2.5 text-[10.5px] font-semibold rounded-lg shrink-0 cursor-pointer"
                      >
                        Tinjau
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-xl cursor-pointer"
          >
            Tutup
          </Button>
          {participant &&
            (participant.status === "SELESAI" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onRevokeKelulusan(participant);
                  onOpenChange(false);
                }}
                className="h-9 text-xs font-semibold rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Batalkan Lulus
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  onSahkanKelulusan(participant);
                  onOpenChange(false);
                }}
                className="h-9 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer inline-flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                Sahkan Lulus Sekarang
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
