"use client";

import React from "react";
import { Award, CheckCircle2, GraduationCap, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { EventParticipantProgress } from "./types";

interface SahkanKelulusanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participant: EventParticipantProgress | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function SahkanKelulusanModal({
  isOpen,
  onOpenChange,
  participant,
  isSubmitting,
  onConfirm,
}: SahkanKelulusanModalProps) {
  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <div className="p-6 text-center space-y-4">
          {/* Circular Badge Icon */}
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 text-center">
              Sahkan Kelulusan RTL?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed max-w-[280px] mx-auto">
              Konfirmasi penyelesaian tugas dan pengesahan kelulusan kaderisasi bagi peserta berikut:
            </DialogDescription>
          </div>

          {/* Participant Preview Card */}
          <div className="p-3.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/60">
                {participant.cadreName
                  ? participant.cadreName.substring(0, 2).toUpperCase()
                  : "PM"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {participant.cadreName}
                  </h5>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[9px] font-bold px-1.5 py-0 shadow-none">
                    {participant.eventLevel}
                  </Badge>
                </div>
                <p className="text-[10.5px] text-zinc-400 truncate">
                  {participant.cadreEmail || "Tanpa email"}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">Tugas Terverifikasi:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {participant.approvedCount} / {participant.totalRequirements} Selesai
              </span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[10.5px] text-emerald-800 dark:text-emerald-300 leading-snug flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Status kader akan resmi menjadi <strong>LULUS / SELESAI</strong>.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-zinc-50/80 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="text-xs h-8.5 px-3.5 rounded-xl border-zinc-200 dark:border-zinc-800 font-semibold cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="text-xs h-8.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengesahkan...</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5" />
                <span>Sahkan Kelulusan</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
