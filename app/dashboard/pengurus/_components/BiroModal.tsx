import React, { useState, useEffect } from "react";
import { Network, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BiroModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targetDept: string;
  editingBiro: string | null;
  biroInputName: string;
  setBiroInputName: (name: string) => void;
  onSaveBiro: (e: React.FormEvent) => void;
  biroToDelete: { dept: string; biroName: string } | null;
  onCloseDeleteBiro: () => void;
  onConfirmDeleteBiro: () => void;
  memberCountInBiro?: number;
}

export const BiroModal: React.FC<BiroModalProps> = ({
  isOpen,
  onOpenChange,
  targetDept,
  editingBiro,
  biroInputName,
  setBiroInputName,
  onSaveBiro,
  biroToDelete,
  onCloseDeleteBiro,
  onConfirmDeleteBiro,
  memberCountInBiro = 0
}) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Reset validation state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!biroInputName.trim()) {
      return;
    }
    onSaveBiro(e);
  };

  const isInputEmpty = hasAttemptedSubmit && !biroInputName.trim();

  return (
    <>
      {/* ADD / EDIT BIRO MODAL */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <Network className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                {editingBiro ? "Ubah Nama Biro" : "Tambah Biro Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Sub-divisi pelaksana di bawah <strong className="text-zinc-800 dark:text-zinc-200">Bidang {targetDept}</strong>
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Biro <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={biroInputName}
                  onChange={(e) => {
                    setBiroInputName(e.target.value);
                    if (hasAttemptedSubmit && e.target.value.trim()) {
                      setHasAttemptedSubmit(false);
                    }
                  }}
                  placeholder="Contoh: Litbang & Database Kader, Pelatihan..."
                  className={`w-full h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-colors ${
                    isInputEmpty
                      ? "border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {isInputEmpty ? (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Nama biro wajib diisi</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Fungsionaris nantinya dapat ditugaskan langsung ke biro ini.
                  </p>
                )}
              </div>
            </div>

            {/* Clean Footer (No negative margins) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8.5 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-8.5 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {!editingBiro && <Plus className="w-3.5 h-3.5" />}
                <span>{editingBiro ? "Simpan Perubahan" : "Tambahkan Biro"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE BIRO CONFIRMATION DIALOG */}
      <Dialog open={!!biroToDelete} onOpenChange={(open) => !open && onCloseDeleteBiro()}>
        <DialogContent className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-2.5 pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Biro {biroToDelete?.biroName}?
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  &quot;Biro {biroToDelete?.biroName}&quot;
                </span>{" "}
                di bawah Bidang {biroToDelete?.dept}?
              </DialogDescription>
            </div>
          </div>

          <div className="py-2">
            {memberCountInBiro > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Perhatian Fungsionaris:</span>
                </p>
                <p className="leading-relaxed">
                  Terdapat <strong>{memberCountInBiro} fungsionaris</strong> di biro ini. Mereka akan dialihkan menjadi fungsionaris inti bidang tanpa biro.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
                Tidak ada fungsionaris yang terdampak oleh penghapusan biro ini.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseDeleteBiro}
              className="w-full sm:w-1/2 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg h-8.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onConfirmDeleteBiro}
              className="w-full sm:w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8.5 font-medium shadow-xs cursor-pointer transition-colors"
            >
              Ya, Hapus Biro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
