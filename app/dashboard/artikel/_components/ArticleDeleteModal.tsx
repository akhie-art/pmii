import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Article } from "@/lib/db";

interface ArticleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  onConfirm: () => void;
}

export const ArticleDeleteModal: React.FC<ArticleDeleteModalProps> = ({
  isOpen,
  onClose,
  article,
  onConfirm
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-5 h-5" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Hapus Artikel Ini?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Anda yakin ingin menghapus artikel <strong>&quot;{article.title}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs px-4 rounded-lg cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs px-4 rounded-lg shadow-xs cursor-pointer"
          >
            Ya, Hapus
          </Button>
        </div>
      </div>
    </div>
  );
};
