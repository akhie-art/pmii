"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { CommissariatList } from "./types";

interface KomisariatDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  komisariat: CommissariatList | null;
  onConfirm: (k: CommissariatList) => Promise<void>;
  isTenantView?: boolean;
}

export function KomisariatDeleteDialog({
  open,
  onOpenChange,
  komisariat,
  onConfirm,
  isTenantView = false,
}: KomisariatDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!komisariat) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(komisariat);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Hapus Data {isTenantView ? "Tenant" : "Komisariat"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Anda akan menghapus data {isTenantView ? "tenant" : "komisariat"}{" "}
              <strong className="text-zinc-900 dark:text-zinc-200">{komisariat.name}</strong> (
              {komisariat.university || komisariat.campusName}). Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-9"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium"
          >
            {isDeleting ? "Menghapus..." : `Ya, Hapus ${isTenantView ? "Tenant" : "Komisariat"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
