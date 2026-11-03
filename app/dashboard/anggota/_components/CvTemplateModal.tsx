"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Info,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { arrayBufferToBase64 } from "@/app/dashboard/surat/component/docx-template-helper";

export const CV_TEMPLATE_STORAGE_KEY = "PMII_CUSTOM_CV_TEMPLATE";
export const CV_TEMPLATE_NAME_KEY = "PMII_CUSTOM_CV_TEMPLATE_NAME";

interface CvTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CvTemplateModal({ isOpen, onClose }: CvTemplateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem(CV_TEMPLATE_STORAGE_KEY);
    const storedName = localStorage.getItem(CV_TEMPLATE_NAME_KEY);
    setHasCustomTemplate(Boolean(stored));
    setCustomTemplateName(storedName || "Template_CV_Kustom.docx");
  }, [isOpen]);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".docx")) {
      toast.error("Format berkas harus berekstensi .docx (Microsoft Word).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const base64 = arrayBufferToBase64(buffer);
        localStorage.setItem(CV_TEMPLATE_STORAGE_KEY, base64);
        localStorage.setItem(CV_TEMPLATE_NAME_KEY, file.name);
        setHasCustomTemplate(true);
        setCustomTemplateName(file.name);
        toast.success(`Template CV "${file.name}" berhasil diterapkan.`);
      } catch (err) {
        console.error("Gagal membaca template:", err);
        toast.error("Gagal mengunggah template Word.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(CV_TEMPLATE_STORAGE_KEY);
    localStorage.removeItem(CV_TEMPLATE_NAME_KEY);
    setHasCustomTemplate(false);
    setCustomTemplateName("");
    toast.success("Template CV dikembalikan ke standar PMII.");
  };

  const supportedTags = [
    { tag: "{{nama}}", desc: "Nama Lengkap Kader" },
    { tag: "{{ttl}}", desc: "Tempat & Tanggal Lahir" },
    { tag: "{{alamat}}", desc: "Alamat Domisili / Rumah" },
    { tag: "{{phone}}", desc: "Nomor WhatsApp / HP" },
    { tag: "{{pendidikan}}", desc: "Riwayat Pendidikan Formal" },
    { tag: "{{organisasi}}", desc: "Riwayat Pengalaman Organisasi" },
    { tag: "{{motto}}", desc: "Motto / Orientasi & Motivasi" },
    { tag: "{{nipa}}", desc: "Nomor Induk NIPA Nasional" },
    { tag: "{{komisariat}}", desc: "Nama Komisariat & Kampus" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-5 sm:p-6 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Pengaturan Template CV Kader
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Gunakan template bawaan resmi PMII atau unggah file Word (.docx) kustom pengurus.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Status Template Aktif */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                  {hasCustomTemplate ? customTemplateName : "Template Resmi PMII (Standar Kop)"}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {hasCustomTemplate
                    ? "Menggunakan berkas template Word kustom pengurus"
                    : "Sesuai format Kop PMII Ki Ageng Getas Pendawa / Cabang"}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                hasCustomTemplate
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800 font-medium"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800 font-medium"
              }
            >
              {hasCustomTemplate ? "Kustom" : "Default"}
            </Badge>
          </div>

          {/* Area Unggah File Word */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30"
                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500/60 bg-white dark:bg-zinc-900"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Klik atau tarik file .docx ke sini
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              File Microsoft Word (.docx) dengan tag placeholder seperti {"{{nama}}"}
            </p>
          </div>

          {/* Tag & Placeholder Panduan */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Tag Placeholder Yang Didukung:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              {supportedTags.map((item) => (
                <div
                  key={item.tag}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md font-mono"
                  title={item.desc}
                >
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.tag}</span>
                  <span className="block text-[10px] text-zinc-400 font-sans truncate">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <a
              href="/templates/template-cv-pmii.docx"
              download="Template_CV_PMII_Dasar.docx"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Contoh (.docx)</span>
            </a>

            {hasCustomTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar</span>
              </Button>
            )}
          </div>

          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

