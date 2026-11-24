"use client";

import React from "react";
import { ProfileSuccessDialog } from "@/components/profile/SuccessDialog";
import { SuccessDialogProps } from "./types";

export function SuccessDialog({ isOpen, onOpenChange }: SuccessDialogProps) {
  return (
    <ProfileSuccessDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      description="Perubahan data diri, kontak, akademik, dan berkas lampiran Anda telah berhasil tersimpan dan disinkronkan."
    />
  );
}
