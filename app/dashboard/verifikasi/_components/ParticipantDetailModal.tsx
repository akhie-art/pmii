"use client";

import React from "react";
import { Clock, ExternalLink } from "lucide-react";
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

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participant: EventParticipantProgress | null;
  onSahkanKelulusan: (p: EventParticipantProgress) => void;
}

export function ParticipantDetailModal({
  isOpen,
  onOpenChange,
  participant,
  onSahkanKelulusan,
}: ParticipantDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ParticipantAvatar
                name={participant?.cadreName || "Peserta"}
                photoUrl={participant?.photoUrl}
                sizeClass="w-10 h-10"
                textClass="text-sm"
              />
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {participant?.cadreName || "Rincian Progres RTL Peserta"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {participant?.eventName} • {participant?.cadreEmail || participant?.phone}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none font-bold text-xs">
              {participant?.progressPercent}% Selesai
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Status Pemenuhan Tugas:
            </h4>

            {participant?.applicableRequirements?.map((req: Requirement) => {
              const cadreSubs: CadreSubmission[] =
                participant?.submissions?.filter(
                  (s: CadreSubmission) => s.requirementId === req.id
                ) || [];

              const approvedCount = cadreSubs.filter((s) => s.status === "APPROVED").length;
              const minNeeded = req.minSubmissions || 1;
              const isCompleted = approvedCount >= minNeeded;

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                        {req.title}
                      </span>
                      {req.deadline && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Deadline: {formatDateTimeIndo(req.deadline)}
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-[10px] font-bold">
                        ✓ Selesai
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 border-none text-[10px] font-semibold">
                        Belum Selesai
                      </Badge>
                    )}
                  </div>

                  {/* Submissions by this user for this requirement */}
                  {cadreSubs.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                      {cadreSubs.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {sub.title}
                            </span>
                            <Badge
                              className={`text-[9px] font-bold border-none ${
                                sub.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : sub.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {sub.status}
                            </Badge>
                          </div>
                          {sub.fileLink && (
                            <a
                              href={sub.fileLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium text-[10px]"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Lihat Berkas Laporan
                            </a>
                          )}
                          {sub.feedback && (
                            <p className="italic text-zinc-500 dark:text-zinc-400 text-[10px]">
                              Catatan: {sub.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-xl cursor-pointer"
          >
            Tutup
          </Button>
          {participant?.status !== "SELESAI" && (
            <Button
              onClick={() => {
                onSahkanKelulusan(participant!);
                onOpenChange(false);
              }}
              className="h-9 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              Sahkan Lulus Sekarang
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
