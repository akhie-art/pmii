"use client";

import React from "react";
import { Trash2, FileText, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateTimeIndo } from "./types";
import type { Requirement, EventActivity } from "@/lib/db";

interface DeleteTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deletingReq: Requirement | null;
  events: EventActivity[];
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

export function DeleteTaskModal({
  isOpen,
  onOpenChange,
  deletingReq,
  events,
  isDeleting,
  onConfirmDelete,
}: DeleteTaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <div className="p-6 text-center space-y-4">
          {/* Soft Red Circular Icon */}
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs">
            <Trash2 className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 text-center">
              Hapus Tugas RTL?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed max-w-[280px] mx-auto">
              Tindakan ini tidak dapat dibatalkan. Tugas berikut akan dihapus secara permanen:
            </DialogDescription>
          </div>

          {/* Task Preview Card */}
          {deletingReq && (
            <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-left flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200/60 dark:border-blue-900/50">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 text-[9.5px] font-bold px-1.5 py-0 shadow-none">
                    {deletingReq.level}
                  </Badge>
                  {deletingReq.eventId && (
                    <span className="text-[10px] text-zinc-400 truncate max-w-[170px]">
                      {events.find((e) => e.id === deletingReq.eventId)?.name || "Kegiatan Khusus"}
                    </span>
                  )}
                </div>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {deletingReq.title}
                </h5>
                {deletingReq.deadline && (
                  <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3 shrink-0 text-amber-500" />
                    <span>Deadline: {formatDateTimeIndo(deletingReq.deadline)}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Balanced Symmetrical Footer Buttons */}
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:p-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-9.5 text-xs font-semibold rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none cursor-pointer w-full transition-colors"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="h-9.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 w-full"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
