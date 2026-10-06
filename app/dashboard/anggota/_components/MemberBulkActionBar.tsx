"use client";

import React from "react";
import { CheckCircle2, XCircle, Award, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemberBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkGraduate: () => void;
  onOpenBulkDelete: () => void;
  isProcessing?: boolean;
}

export function MemberBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkGraduate,
  onOpenBulkDelete,
  isProcessing = false
}: MemberBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-700/80 dark:border-zinc-800 text-white rounded-2xl shadow-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Counter */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
            {selectedCount}
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {selectedCount} Anggota Terpilih
            </span>
            <span className="text-[10px] text-zinc-400">
              Pilih tindakan massal data anggota
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 w-full sm:w-auto">
          {/* Activate */}
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={onBulkActivate}
            className="h-8 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Ubah status menjadi Aktif"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktifkan</span>
          </Button>

          {/* Deactivate */}
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={onBulkDeactivate}
            className="h-8 px-2.5 text-[11px] font-semibold bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Ubah status menjadi Non-Aktif"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Nonaktifkan</span>
          </Button>

          {/* Graduate / Resmi */}
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={onBulkGraduate}
            className="h-8 px-2.5 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Set Lulus / Kader Resmi (Terbitkan KTA)"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Luluskan</span>
          </Button>

          {/* Delete */}
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={onOpenBulkDelete}
            className="h-8 px-2.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Hapus data anggota terpilih"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </Button>

          {/* Cancel */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isProcessing}
            onClick={onClearSelection}
            className="h-8 px-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl cursor-pointer"
            title="Batal Pilihan"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
