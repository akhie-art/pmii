"use client";

import React, { useState, useRef } from "react";
import { Check, Eye, FileText, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";

export interface FileDropCardProps {
  label: string;
  sublabel: string;
  required?: boolean;
  fileUrl?: string;
  fileName?: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onPreview?: (fileUrl: string, fileName?: string) => void;
  accept?: string;
}

export function FileDropCard({
  label,
  sublabel,
  required = false,
  fileUrl,
  fileName,
  isUploading,
  onUpload,
  onRemove,
  onPreview,
  accept = ".pdf,.docx,.doc",
}: FileDropCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      className={`relative rounded-xl border transition-all duration-150 p-3 flex flex-col justify-between ${
        isDragging
          ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
          : fileUrl
          ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          : "border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
            {label}
          </span>
          {required ? (
            <span className="shrink-0 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200/60 dark:border-rose-900/50">
              Wajib
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
              Opsional
            </span>
          )}
        </div>

        {fileUrl && (
          <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-md">
            <Check className="w-2.5 h-2.5 stroke-[3]" /> Terunggah
          </span>
        )}
      </div>

      {isUploading ? (
        <div className="py-4 flex flex-col items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-[11px] font-medium text-zinc-500 animate-pulse">Mengunggah berkas...</p>
        </div>
      ) : fileUrl ? (
        <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/70 dark:border-zinc-800/80 rounded-lg p-2">
          <div
            onClick={() => (onPreview ? onPreview(fileUrl, fileName) : window.open(fileUrl, "_blank"))}
            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1 group/item"
            title="Klik untuk pratinjau dokumen"
          >
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/60 transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                {fileName || "Dokumen_Terlampir"}
              </p>
              <p className="text-[10px] text-zinc-400">Klik untuk pratinjau</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => (onPreview ? onPreview(fileUrl, fileName) : window.open(fileUrl, "_blank"))}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Pratinjau"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Ganti Berkas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer py-2.5 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800/40 flex items-center gap-3 transition-colors group/box"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover/box:text-blue-600 group-hover/box:bg-blue-50 dark:group-hover/box:bg-blue-950/50 flex items-center justify-center shrink-0 transition-colors">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover/box:text-blue-600 dark:group-hover/box:text-blue-400 transition-colors">
              Pilih atau seret berkas
            </p>
            <p className="text-[10px] text-zinc-400 truncate">{sublabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
