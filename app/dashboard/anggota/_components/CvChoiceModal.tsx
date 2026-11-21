"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Briefcase, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import type { Member } from "./types";

interface CvChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onDownloadOrganisasi: (member: Member) => void;
  onDownloadAts: (member: Member) => void;
}

export default function CvChoiceModal({
  isOpen,
  onClose,
  member,
  onDownloadOrganisasi,
  onDownloadAts
}: CvChoiceModalProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
        <DialogHeader className="space-y-1.5 pb-2 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pilih Format Curriculum Vitae
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Pilih format dokumen CV untuk kader <span className="font-semibold text-zinc-800 dark:text-zinc-200">{member.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
          {/* OPSI 1: CV ORGANISASI */}
          <div 
            onClick={() => {
              onDownloadOrganisasi(member);
              onClose();
            }}
            className="group relative flex flex-col justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[9px] font-semibold">
                  Resmi PMII
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  CV Organisasi
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Format resmi PMII dengan Kop Surat, data kaderisasi, pas foto formal, dan tanda tangan legalitas.
                </p>
              </div>

              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Kop Surat & Pas Foto 3×4</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Berkas Konferensi & Kepengurusan</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              className="mt-4 w-full h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka CV Organisasi</span>
            </Button>
          </div>

          {/* OPSI 2: CV ATS FRIENDLY */}
          <div 
            onClick={() => {
              onDownloadAts(member);
              onClose();
            }}
            className="group relative flex flex-col justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/60 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-semibold">
                  ATS Friendly
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  CV ATS Friendly
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Format standar industri kerja & beasiswa, tipografi bersih tanpa elemen tabel kompleks agar lolos sistem ATS.
                </p>
              </div>

              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Struktur Standar Screening HRD</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Lamaran Kerja, Magang & Beasiswa</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              className="mt-4 w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka CV ATS</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
