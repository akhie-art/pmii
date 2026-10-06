import React from "react";
import { GitFork, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  onConfirmDeleteDept
}) => {
  return (
    <>
      {/* ADD / EDIT BIDANG / DIVISI MODAL */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {editingDept ? "Ubah Nama Bidang" : "Tambah Bidang Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingDept
                    ? "Perbarui nama divisi atau bidang kepengurusan."
                    : "Tambahkan divisi pelaksana baru ke dalam struktur kepengurusan."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={onSaveDept}>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Bidang / Divisi <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  autoFocus
                  value={deptInputName}
                  onChange={(e) => setDeptInputName(e.target.value)}
                  placeholder="Contoh: Media & Publikasi, Kajian Strategis..."
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-8.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                {editingDept ? "Simpan Perubahan" : "Tambahkan Bidang"}
              </Button>
            </DialogFooter>
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
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Hapus Bidang {deptToDelete}?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                &quot;Bidang {deptToDelete}&quot;
              </span>{" "}
              dari struktur organisasi? Seluruh fungsionaris pada bidang ini juga akan dihapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseDeleteDept}
              className="text-xs border-zinc-200 dark:border-zinc-800 h-8.5 rounded-lg cursor-pointer flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onConfirmDeleteDept}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8.5 rounded-lg border-none cursor-pointer flex-1"
            >
              Ya, Hapus Bidang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
