"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Info } from "lucide-react";

export type FeedbackType = "success" | "error" | "info";

export interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  type?: FeedbackType;
  confirmText?: string;
  onConfirm?: () => void;
}

export function FeedbackModal({
  open,
  onOpenChange,
  title,
  description,
  type = "success",
  confirmText = "Selesai",
  onConfirm
}: FeedbackModalProps) {
  const handleClose = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm text-foreground w-full p-6">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
              type === "error"
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-100 dark:border-rose-900/50"
                : type === "info"
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-500 border border-blue-100 dark:border-blue-900/50"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 border border-emerald-100 dark:border-emerald-900/50"
            }`}
          >
            {type === "error" ? (
              <AlertCircle className="w-6 h-6" />
            ) : type === "info" ? (
              <Info className="w-6 h-6" />
            ) : (
              <Check className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 text-center">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed max-w-xs mx-auto">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="justify-center sm:justify-center pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 px-6 rounded-xl cursor-pointer shadow-none transition-colors"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{
    title: string;
    description?: string;
    type: FeedbackType;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    title: "Berhasil",
    description: "",
    type: "success",
    confirmText: "Selesai"
  });

  const showFeedback = useCallback(
    (
      titleOrMessage: string,
      description?: string,
      type: FeedbackType = "success",
      onConfirm?: () => void
    ) => {
      // If only one argument is given or description is not passed
      if (!description) {
        setData({
          title: type === "error" ? "Terjadi Kendala" : "Berhasil Disimpan",
          description: titleOrMessage,
          type,
          confirmText: "Selesai",
          onConfirm
        });
      } else {
        setData({
          title: titleOrMessage,
          description,
          type,
          confirmText: "Selesai",
          onConfirm
        });
      }
      setIsOpen(true);
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, description?: string, onConfirm?: () => void) => {
      showFeedback(title, description, "success", onConfirm);
    },
    [showFeedback]
  );

  const showError = useCallback(
    (title: string, description?: string, onConfirm?: () => void) => {
      showFeedback(title, description, "error", onConfirm);
    },
    [showFeedback]
  );

  // Backward-compatible showToast helper
  const showToast = useCallback(
    (msg: string) => {
      const isErr =
        msg.toLowerCase().includes("gagal") ||
        msg.toLowerCase().includes("error") ||
        msg.toLowerCase().includes("tidak") ||
        msg.toLowerCase().includes("harus") ||
        msg.toLowerCase().includes("wajib");

      showFeedback(
        isErr ? "Perhatian" : "Berhasil",
        msg,
        isErr ? "error" : "success"
      );
    },
    [showFeedback]
  );

  return {
    isOpen,
    setIsOpen,
    showFeedback,
    showSuccess,
    showError,
    showToast,
    FeedbackModalComponent: (
      <FeedbackModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={data.title}
        description={data.description}
        type={data.type}
        confirmText={data.confirmText}
        onConfirm={data.onConfirm}
      />
    )
  };
}
