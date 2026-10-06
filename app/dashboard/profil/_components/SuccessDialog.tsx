"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SuccessDialogProps } from "./types";

export function SuccessDialog({ isOpen, onOpenChange }: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-w-sm text-foreground w-full p-6">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-1">
            <CheckCircle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Profil Berhasil Disimpan
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Perubahan data kepengurusan Anda telah tersimpan dan disinkronkan ke pangkalan data.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="justify-center sm:justify-center pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-xs border-zinc-200 dark:border-zinc-800 h-8 px-5 rounded-lg cursor-pointer"
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
