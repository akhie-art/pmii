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
  Check,
  Copy,
  FileCheck,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "@/app/dashboard/surat/component/docx-template-helper";

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
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      const stored = localStorage.getItem(CV_TEMPLATE_STORAGE_KEY);
      const storedName = localStorage.getItem(CV_TEMPLATE_NAME_KEY);
      setHasCustomTemplate(Boolean(stored));
      setCustomTemplateName(storedName || "Template_CV_Kustom.docx");
    });
  }, [isOpen]);

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
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
    toast.success("Template CV dikembalikan ke standar bawaan.");
  };

  const handleDownloadCustomTemplate = () => {
    try {
      const stored = localStorage.getItem(CV_TEMPLATE_STORAGE_KEY);
      if (!stored) {
        toast.error("Template kustom tidak ditemukan.");
        return;
      }
      const buffer = base64ToArrayBuffer(stored);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = customTemplateName || "Template_CV_Kustom.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template kustom berhasil diunduh.");
    } catch (err) {
      console.error("Gagal mengunduh template kustom:", err);
      toast.error("Gagal mengunduh template kustom.");
    }
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast.success(`Tag ${tag} disalin ke clipboard`);
    setTimeout(() => {
      setCopiedTag((curr) => (curr === tag ? null : curr));
    }, 2000);
  };

  const supportedTags = [
    { tag: "{{nama}}", desc: "Nama Lengkap Kader" },
    { tag: "{{nim}}", desc: "NIM / NIK Kader" },
    { tag: "{{ttl}}", desc: "Tempat, Tanggal Lahir" },
    { tag: "{{alamat}}", desc: "Alamat Domisili" },
    { tag: "{{phone}}", desc: "No. WhatsApp / HP" },
    { tag: "{{pendidikan}}", desc: "Riwayat Pendidikan" },
    { tag: "{{organisasi}}", desc: "Pengalaman Organisasi" },
    { tag: "{{motto}}", desc: "Motto & Motivasi" },
    { tag: "{{nipa}}", desc: "Nomor Induk NIPA" },
    { tag: "{{komisariat}}", desc: "Komisariat & Kampus" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-full max-w-[calc(100vw-2rem)] min-w-0 overflow-hidden p-5 sm:p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl gap-4">
        <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Template CV Kader
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                Gunakan template resmi PMII atau sesuaikan dengan berkas Word (.docx).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs min-w-0">
          {/* Status Template Aktif */}
          <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate text-xs">
                    {hasCustomTemplate ? customTemplateName : "Template Bawaan PMII"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 rounded font-normal shrink-0 ${
                      hasCustomTemplate
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {hasCustomTemplate ? "Kustom" : "Standar"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {hasCustomTemplate
                    ? "Template Word kustom aktif tersimpan di browser"
                    : "Format resmi standar Kop PMII"}
                </p>
              </div>
            </div>

            {hasCustomTemplate && (
              <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-2 text-[11px] font-normal gap-1 rounded-md text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Upload className="w-3 h-3 text-zinc-500" />
                  <span>Ganti</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCustomTemplate}
                  className="h-7 px-2 text-[11px] font-normal gap-1 rounded-md text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Download className="w-3 h-3 text-zinc-500" />
                  <span>Unduh</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="h-7 px-2 text-[11px] font-normal gap-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </Button>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
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

          {/* Area Unggah File Word: HANYA TAMPIL JIKA BELUM ADA FILE KUSTOM */}
          {!hasCustomTemplate && (
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
              className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-zinc-900 bg-zinc-100/70 dark:border-zinc-300 dark:bg-zinc-800/50"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/30"
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 mx-auto flex items-center justify-center mb-1.5 shadow-xs">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Pilih berkas Word atau seret ke sini
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Hanya format berkas <span className="font-mono text-zinc-600 dark:text-zinc-400">.docx</span>
              </p>
            </div>
          )}

          {/* Tag & Placeholder Panduan (Click to Copy) */}
          <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-2 min-w-0">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px] min-w-0">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Tag Placeholder Tersedia:</span>
              <span className="text-[10px] text-zinc-400 shrink-0">Klik tag untuk menyalin</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 min-w-0">
              {supportedTags.map((item) => {
                const isCopied = copiedTag === item.tag;
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleCopyTag(item.tag)}
                    className="group relative flex flex-col items-start p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all text-left focus:outline-none min-w-0 w-full overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-between gap-1 min-w-0">
                      <span className="font-mono text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.tag}
                      </span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate w-full mt-0.5">
                      {isCopied ? "Tersalin!" : item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 min-w-0 w-full">
          <a
            href="/templates/template-cv-pmii.docx"
            download="Template_CV_PMII_Dasar.docx"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
          >
            <FileDown className="w-3.5 h-3.5 text-zinc-500" />
            <span>Unduh Contoh (.docx)</span>
          </a>

          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors shrink-0"
          >
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
