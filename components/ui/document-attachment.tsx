"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Eye,
  ExternalLink,
  Trash2,
  RefreshCw,
  ZoomIn,
  FileCheck,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isPrivateStorageRef, resolveStorageUrl } from "@/lib/storage";

export interface DocumentAttachmentProps {
  label: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  isEditing?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  badgeLabel?: string;
  accentColor?: "blue" | "amber" | "emerald";
}

export function DocumentAttachment({
  label,
  description = "Format: JPG, PNG, WebP, atau PDF (Maksimal 5 MB)",
  fileName,
  fileUrl,
  isEditing = true,
  onUpload,
  onRemove,
  accept = "image/png,image/jpeg,image/jpg,image/webp,.pdf",
  badgeLabel,
  accentColor = "blue",
}: DocumentAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [signedUrlMap, setSignedUrlMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!fileUrl || !isPrivateStorageRef(fileUrl)) return;
    let active = true;
    resolveStorageUrl(fileUrl).then((resolved) => {
      if (active && resolved) {
        setSignedUrlMap((prev) => ({ ...prev, [fileUrl]: resolved }));
      }
    });
    return () => {
      active = false;
    };
  }, [fileUrl]);

  const effectiveUrl = fileUrl
    ? isPrivateStorageRef(fileUrl)
      ? signedUrlMap[fileUrl] || ""
      : fileUrl
    : "";
  const hasImgError = Boolean(effectiveUrl && failedUrl === effectiveUrl);

  const isImage =
    effectiveUrl.startsWith("data:image/") ||
    Boolean(fileName?.match(/\.(jpg|jpeg|png|webp)$/i)) ||
    Boolean(fileUrl?.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i));

  const isPdf =
    Boolean(fileName?.match(/\.pdf$/i)) ||
    Boolean(fileUrl?.match(/\.pdf(\?.*)?$/i)) ||
    effectiveUrl.startsWith("data:application/pdf");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isEditing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const hasFile = Boolean(fileName || fileUrl);

  const colorStyles = {
    blue: {
      activeBorder: "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20",
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
      btnAccent: "text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100",
      badge: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
    },
    amber: {
      activeBorder: "border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-amber-500/20",
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
      btnAccent: "text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100",
      badge: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
    },
    emerald: {
      activeBorder: "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      btnAccent: "text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100",
      badge: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
    }
  }[accentColor];

  return (
    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
      {/* Label Sederhana Tanpa Badge */}
      <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
        {label}
      </label>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {hasFile ? (
        effectiveUrl && isImage && !hasImgError ? (
          /* HANYA TAMPIL GAMBAR LANGSUNG */
          <div className="space-y-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsPreviewOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setIsPreviewOpen(true);
              }}
              title="Klik gambar untuk melihat pratinjau penuh"
              className="group relative max-w-sm rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 cursor-pointer shadow-none transition-all hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={effectiveUrl}
                alt={fileName || "Kartu Tanda Mahasiswa (KTM)"}
                className="w-full h-auto max-h-56 object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                onError={() => setFailedUrl(effectiveUrl)}
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" />
                <span>Klik untuk Memperbesar</span>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7.5 px-3 text-xs rounded-md border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-zinc-500" />
                  <span>Ganti Gambar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  className="h-7.5 px-3 text-xs rounded-md border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Fallback untuk format non-gambar (misal berkas PDF) */
          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md gap-2.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                <FileText className="w-4 h-4" />
              </div>
              <span className="truncate block text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                {fileName || "Dokumen PDF"}
              </span>
            </div>

            {isEditing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7.5 px-2 text-xs rounded-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-7.5 w-7.5 p-0 text-zinc-400 hover:text-rose-600 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )
      ) : isEditing ? (
        /* Empty Upload Dropzone */
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 p-3.5 border-2 border-dashed rounded-md cursor-pointer transition-all ${
            isDragging
              ? colorStyles.activeBorder
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-50 dark:hover:bg-zinc-950"
          }`}
        >
          {/* Upload Icon Circle */}
          <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${colorStyles.iconBg}`}>
            <UploadCloud className="w-5 h-5" />
          </div>

          {/* Texts & Instructions */}
          <div className="text-center sm:text-left min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Klik untuk mengunggah</span>{" "}
              <span className="font-normal text-zinc-500">atau tarik berkas ke sini</span>
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {description}
            </p>
          </div>

          {/* Action Badge */}
          <span className="text-[11px] font-semibold px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs shrink-0">
            Pilih Berkas
          </span>
        </div>
      ) : (
        /* Readonly Empty State */
        <div className="flex items-center gap-2 p-3 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-md">
          <FileText className="w-4 h-4 opacity-50 shrink-0" />
          <span>Belum ada lampiran berkas yang diunggah.</span>
        </div>
      )}

      {/* In-App Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-xl p-4 sm:p-5 overflow-hidden rounded-md">
          <DialogHeader className="pb-2.5 border-b border-zinc-100 dark:border-zinc-800 pr-8">
            <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {label.replace(/^Unggah\s+/i, "Pratinjau ")}
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Identitas resmi mahasiswa aktif
            </p>
          </DialogHeader>

          {/* Modal Preview Body */}
          <div className="my-1 max-h-[75vh] overflow-auto flex items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-950 p-1.5 sm:p-2">
            {isImage && effectiveUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={effectiveUrl}
                alt={fileName || "Pratinjau Dokumen"}
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            ) : isPdf && effectiveUrl ? (
              <iframe
                src={effectiveUrl}
                title={fileName || "PDF Preview"}
                className="w-full h-[60vh] rounded border-0"
              />
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <FileText className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                <p>Pratinjau langsung tidak tersedia untuk format ini.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

