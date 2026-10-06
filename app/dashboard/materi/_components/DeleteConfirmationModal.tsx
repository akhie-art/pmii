"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  title = "Hapus Data?",
  description = "Tindakan ini permanen dan data yang dihapus tidak dapat dipulihkan.",
  itemName,
  onClose,
  onConfirm,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Konfirmasi penghapusan data
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
            {itemName && (
              <p className="font-semibold text-zinc-900 dark:text-white mb-1 truncate">
                &quot;{itemName}&quot;
              </p>
            )}
            <p>{description}</p>
          </div>
        </div>

        <div className="p-3.5 bg-zinc-50/80 dark:bg-zinc-950/80 border-t border-zinc-100 dark:border-zinc-800 flex justify-end items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="text-xs h-8.5 px-3.5 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Batal
          </Button>

          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="text-xs font-semibold h-8.5 px-4 rounded-lg text-white bg-rose-600 hover:bg-rose-700 border-none cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}
