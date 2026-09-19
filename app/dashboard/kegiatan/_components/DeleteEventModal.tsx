"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeleteEventModalProps {
  isOpen: boolean;
  eventName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteEventModal({
  isOpen,
  eventName,
  onClose,
  onConfirm
}: DeleteEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden text-zinc-900 dark:text-zinc-100 text-left">
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Hapus Kegiatan?
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Hapus kegiatan <strong>"{eventName}"</strong> beserta seluruh data pendaftaran peserta? Tindakan ini permanen.
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 border-none cursor-pointer"
          >
            Hapus
          </Button>
        </div>
      </Card>
    </div>
  );
}
