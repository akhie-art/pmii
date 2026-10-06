import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { UserAccount } from "@/lib/db";

interface UserDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onConfirm: () => void;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-5 h-5" />
        </div>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 text-center">
            Hapus Pengguna?
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
            Anda yakin ingin menghapus akun <strong>{user.name}</strong> ({user.email})? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 justify-center sm:justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-4 rounded-lg cursor-pointer shadow-xs"
          >
            Hapus Pengguna
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
