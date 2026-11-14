import React from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ParticipantEvaluation } from "@/lib/db";

interface ResetPostTestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participant: ParticipantEvaluation | null;
  sessionTitle?: string;
  onConfirmReset: (participant: ParticipantEvaluation, sessionTitle?: string) => Promise<void> | void;
  isResetting?: boolean;
}

export const ResetPostTestModal: React.FC<ResetPostTestModalProps> = ({
  isOpen,
  onOpenChange,
  participant,
  sessionTitle,
  onConfirmReset,
  isResetting = false
}) => {
  if (!participant) return null;

  const isSpecific = Boolean(sessionTitle && sessionTitle !== "ALL");
  const cleanSessionTitle = sessionTitle?.replace(/^\d+\.\s*/, "");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 overflow-hidden shadow-xl">
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                Konfirmasi Reset Post-Test
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tindakan ini akan mengosongkan nilai Post-Test dan mengizinkan peserta mengerjakan ulang kuis evaluasi kelulusan.
              </DialogDescription>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Nama Peserta:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                {participant.participantName}
              </span>
            </div>

            {participant.university && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Asal Kampus:</span>
                <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                  {participant.university}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-400 font-medium">Target Reset:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {isSpecific ? `Sesi: ${cleanSessionTitle}` : "Seluruh Sesi Materi (Semua Post-Test)"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            💡 <strong>Informasi:</strong> Setelah di-reset, status pengerjaan Post-Test di akun kader akan terbuka kembali dan kader dapat mengerjakan ulang butir soal pada kegiatan ini.
          </div>
        </div>

        <div className="px-5 py-3.5 bg-zinc-50/70 dark:bg-zinc-950/50 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isResetting}
            onClick={() => onOpenChange(false)}
            className="h-8.5 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isResetting}
            onClick={() => onConfirmReset(participant, sessionTitle)}
            className="h-8.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-3.5 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Mereset..." : "Ya, Reset Post-Test"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
