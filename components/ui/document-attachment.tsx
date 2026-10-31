"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Eye,
  ExternalLink,
  Trash2,
  RefreshCw,
  ZoomIn,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const isImage =
    fileUrl?.startsWith("data:image/") ||
    Boolean(fileName?.match(/\.(jpg|jpeg|png|webp)$/i)) ||
    Boolean(fileUrl?.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i));

  const isPdf =
    Boolean(fileName?.match(/\.pdf$/i)) ||
    Boolean(fileUrl?.match(/\.pdf(\?.*)?$/i)) ||
    fileUrl?.startsWith("data:application/pdf");

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
    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
      {/* Label and Badge */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <span>{label}</span>
          {hasFile && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Terlampir</span>
            </span>
          )}
        </label>
        {badgeLabel && (
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {badgeLabel}
          </span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {hasFile ? (
        /* Attached Document Card */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-3 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
          {/* File Thumbnail & Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail */}
            {fileUrl && isImage ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsPreviewOpen(true)}
                title="Klik untuk memperbesar pratinjau"
                className="relative group w-16 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 cursor-pointer shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={fileName || "Pratinjau Berkas"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <ZoomIn className="w-4 h-4 drop-shadow" />
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileUrl && setIsPreviewOpen(true)}
                className={`w-16 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                  isPdf
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400"
                    : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400"
                } ${fileUrl ? "cursor-pointer" : ""}`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                  {isPdf ? "PDF" : "Berkas"}
                </span>
              </div>
            )}

            {/* Name & Metadata */}
            <div className="min-w-0 flex-1">
              <span className="truncate block max-w-[200px] sm:max-w-[320px] text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                {fileName || "Berkas Terlampir"}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  <FileCheck className="w-3 h-3 text-emerald-500" />
                  {fileUrl?.startsWith("data:")
                    ? "Berkas lokal siap simpan"
                    : "Tersimpan di Cloud Storage"}
                </span>
                {isPdf && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30">
                    PDF
                  </Badge>
                )}
                {isImage && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    Gambar
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            {/* Pratinjau Modal Trigger */}
            {fileUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                className="h-8 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1 rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pratinjau</span>
              </Button>
            )}

            {/* Buka Tab Baru */}
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka dokumen di tab baru"
                className="inline-flex items-center justify-center h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Ganti Berkas */}
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Ganti berkas ini dengan berkas baru"
                className="h-8 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ganti</span>
              </Button>
            )}

            {/* Hapus Berkas */}
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                title="Hapus lampiran ini"
                className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
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
          className={`relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? colorStyles.activeBorder
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-50 dark:hover:bg-zinc-950"
          }`}
        >
          {/* Upload Icon Circle */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorStyles.iconBg}`}>
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
          <span className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs shrink-0">
            Pilih Berkas
          </span>
        </div>
      ) : (
        /* Readonly Empty State */
        <div className="flex items-center gap-2 p-3 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
          <FileText className="w-4 h-4 opacity-50 shrink-0" />
          <span>Belum ada lampiran berkas yang diunggah.</span>
        </div>
      )}

      {/* In-App Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 pr-6">
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                  {label}
                </DialogTitle>
                <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">
                  {fileName || "Dokumen Lampiran"}
                </p>
              </div>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Penuh</span>
                </a>
              )}
            </div>
          </DialogHeader>

          {/* Modal Preview Body */}
          <div className="my-2 max-h-[65vh] overflow-auto flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2">
            {isImage && fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt={fileName || "Pratinjau Dokumen"}
                className="max-h-[60vh] max-w-full object-contain rounded-md shadow-md"
              />
            ) : isPdf && fileUrl ? (
              <iframe
                src={fileUrl}
                title={fileName || "PDF Preview"}
                className="w-full h-[55vh] rounded border-0"
              />
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <FileText className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                <p>Pratinjau langsung tidak tersedia untuk format ini.</p>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Unduh / Buka Dokumen
                  </a>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

