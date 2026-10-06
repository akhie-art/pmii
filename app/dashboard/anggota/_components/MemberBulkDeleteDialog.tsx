"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface MemberBulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function MemberBulkDeleteDialog({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  isProcessing = false
}: MemberBulkDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-w-sm text-foreground w-full p-6">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-1">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Hapus {selectedCount} Anggota?
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
            Apakah Anda yakin ingin menghapus <strong>{selectedCount} data anggota terpilih</strong>? Tindakan ini bersifat permanen dan data keanggotaan beserta akun login terkait akan dihapus dari pangkalan data sistem.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={onClose}
            className="text-xs h-8.5 px-3.5 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8.5 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {isProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Ya, Hapus Terpilih</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
