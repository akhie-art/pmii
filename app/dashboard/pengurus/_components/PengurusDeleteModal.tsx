import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BoardMember } from "./types";

interface PengurusDeleteModalProps {
  memberToDelete: BoardMember | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const PengurusDeleteModal: React.FC<PengurusDeleteModalProps> = ({
  memberToDelete,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={!!memberToDelete} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Hapus Data Pengurus?
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
            Apakah Anda yakin ingin menghapus data pengurus{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              &quot;{memberToDelete?.name}&quot;
            </span>{" "}
            ({memberToDelete?.position})? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-1/2 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg h-8.5 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8.5 cursor-pointer"
          >
            Hapus Pengurus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
