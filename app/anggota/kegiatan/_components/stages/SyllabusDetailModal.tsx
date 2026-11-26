"use client";

import React from "react";
import { Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface ActiveSyllabusState {
  sessionTitle: string;
  syllabus: {
    category?: string;
    durationHours?: string | number;
    subjectName?: string;
    tujuan?: string[];
    goal?: string;
    pokokPembahasan?: string[];
    description?: string;
    metode?: string[];
    harapan?: string[];
  };
}

interface SyllabusDetailModalProps {
  activeSyllabusModal: ActiveSyllabusState | null;
  onClose: () => void;
}

export function SyllabusDetailModal({ activeSyllabusModal, onClose }: SyllabusDetailModalProps) {
  return (
    <Dialog
      open={Boolean(activeSyllabusModal)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        {activeSyllabusModal && (
          <div className="flex flex-col">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold px-2 py-0.5">
                  Silabus Pembelajaran
                </Badge>
                {activeSyllabusModal.syllabus.category && (
                  <Badge variant="outline" className="text-xs">
                    {activeSyllabusModal.syllabus.category}
                  </Badge>
                )}
                {activeSyllabusModal.syllabus.durationHours && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Alokasi:{" "}
                    {activeSyllabusModal.syllabus.durationHours} Menit
                  </span>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {activeSyllabusModal.syllabus.subjectName || activeSyllabusModal.sessionTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Rencana pembelajaran dan sasaran kompetensi kurikulum kaderisasi
              </DialogDescription>
            </div>

            <div className="p-5 space-y-4">
              {((activeSyllabusModal.syllabus.tujuan?.length ?? 0) > 0 ||
                activeSyllabusModal.syllabus.goal) && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 text-xs">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Tujuan & Sasaran Pembelajaran:</span>
                  </div>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {(
                      activeSyllabusModal.syllabus.tujuan ||
                      (activeSyllabusModal.syllabus.goal ? [activeSyllabusModal.syllabus.goal] : [])
                    ).map((t, tIdx) => (
                      <li key={tIdx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((activeSyllabusModal.syllabus.pokokPembahasan?.length ?? 0) > 0 ||
                activeSyllabusModal.syllabus.description) && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Pokok Pembahasan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      activeSyllabusModal.syllabus.pokokPembahasan ||
                      (activeSyllabusModal.syllabus.description
                        ? [activeSyllabusModal.syllabus.description]
                        : [])
                    ).map((pokok, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 text-xs flex items-start gap-2 text-zinc-800 dark:text-zinc-200"
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {pIdx + 1}
                        </span>
                        <span className="leading-relaxed">{pokok}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((activeSyllabusModal.syllabus.metode?.length ?? 0) > 0 ||
                (activeSyllabusModal.syllabus.harapan?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(activeSyllabusModal.syllabus.metode?.length ?? 0) > 0 && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Metode Pembelajaran
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeSyllabusModal.syllabus.metode!.map((m, mIdx) => (
                          <Badge key={mIdx} variant="secondary" className="text-xs font-normal">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activeSyllabusModal.syllabus.harapan?.length ?? 0) > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 space-y-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        Target Capaian & Hasil
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                        {activeSyllabusModal.syllabus.harapan!.map((h, hIdx) => (
                          <li key={hIdx} className="leading-snug">
                            • {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="px-4 text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
