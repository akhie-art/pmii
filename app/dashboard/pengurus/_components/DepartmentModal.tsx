import React, { useState, useEffect } from "react";
import { GitFork, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DepartmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingDept: string | null;
  deptInputName: string;
  setDeptInputName: (name: string) => void;
  onSaveDept: (e: React.FormEvent) => void;
  deptToDelete: string | null;
  onCloseDeleteDept: () => void;
  onConfirmDeleteDept: () => void;
  memberCountInDept?: number;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onOpenChange,
  editingDept,
  deptInputName,
  setDeptInputName,
  onSaveDept,
  deptToDelete,
  onCloseDeleteDept,
  onConfirmDeleteDept,
  memberCountInDept = 0
}) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!deptInputName.trim()) {
      return;
    }
    onSaveDept(e);
  };

  const isInputEmpty = hasAttemptedSubmit && !deptInputName.trim();

  return (
    <>
      {/* ADD / EDIT BIDANG / DIVISI MODAL */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <GitFork className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                {editingDept ? "Ubah Nama Bidang" : "Tambah Bidang Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                {editingDept
                  ? "Perbarui nama divisi atau bidang kepengurusan."
                  : "Tambahkan divisi pelaksana baru ke dalam struktur kepengurusan."}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Bidang / Divisi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deptInputName}
                  onChange={(e) => {
                    setDeptInputName(e.target.value);
                    if (hasAttemptedSubmit && e.target.value.trim()) {
                      setHasAttemptedSubmit(false);
                    }
                  }}
                  placeholder="Contoh: Media & Publikasi, Kajian Strategis..."
                  className={`w-full h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-colors ${
                    isInputEmpty
                      ? "border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {isInputEmpty ? (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Nama bidang wajib diisi</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Bidang ini akan tampil dalam bagan struktur organisasi.
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
                {!editingDept && <Plus className="w-3.5 h-3.5" />}
                <span>{editingDept ? "Simpan Perubahan" : "Tambahkan Bidang"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE BIDANG CONFIRMATION DIALOG */}
      <Dialog
        open={!!deptToDelete}
        onOpenChange={(open) => {
          if (!open) onCloseDeleteDept();
        }}
      >
        <DialogContent className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-2.5 pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Bidang {deptToDelete}?
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  &quot;Bidang {deptToDelete}&quot;
                </span>{" "}
                dari struktur organisasi?
              </DialogDescription>
            </div>
          </div>

          <div className="py-2">
            {memberCountInDept > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Perhatian Pengurus:</span>
                </p>
                <p className="leading-relaxed">
                  Ada <strong>{memberCountInDept} pengurus</strong> terdaftar di bidang ini yang juga akan ikut terhapus dari struktur.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
                Seluruh fungsionaris pada bidang ini juga akan dihapus jika ada.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseDeleteDept}
              className="w-full sm:w-1/2 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg h-8.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onConfirmDeleteDept}
              className="w-full sm:w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8.5 font-medium shadow-xs cursor-pointer transition-colors"
            >
              Ya, Hapus Bidang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
