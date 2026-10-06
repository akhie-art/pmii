"use client";

import React from "react";
import { FileSpreadsheet, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface LetterExcelImporterProps {
  parsedBulkRecipients: string[];
  bulkRecipientsText: string;
  onBulkRecipientsChange: (val: string) => void;
  excelColumns: Array<{ key: string; originalHeader: string; sampleValue: string }>;
  excelRowsData: Array<{ recipient: string; data: Record<string, string> }>;
  activePlaceholders: string[];
  docxValues: Record<string, string>;
  onUploadExcelClick: () => void;
  onDownloadExcelTemplate: () => void;
  onLoadPreset: (type: "rayon" | "komsat" | "clear") => void;
  onOpenAddPlaceholder: () => void;
  onInsertPlaceholder: (key: string) => void;
  previewBulkIndex: number;
  onSelectPreviewIndex: (index: number) => void;
  getNomorForIndex: (index: number) => string;
  getRowDataForIndex: (index: number) => Record<string, string>;
}

export function LetterExcelImporter({
  parsedBulkRecipients,
  bulkRecipientsText,
  onBulkRecipientsChange,
  excelColumns,
  excelRowsData,
  activePlaceholders,
  docxValues,
  onUploadExcelClick,
  onDownloadExcelTemplate,
  onLoadPreset,
  onOpenAddPlaceholder,
  onInsertPlaceholder,
  previewBulkIndex,
  onSelectPreviewIndex,
  getNomorForIndex,
  getRowDataForIndex
}: LetterExcelImporterProps) {
  // Deduplicate and filter available placeholders for toolbar
  const availablePlaceholders = Array.from(
    new Set([
      "penerima",
      "nomor",
      "perihal",
      "tanggal",
      ...excelColumns.map((c) => c.key),
      ...activePlaceholders
    ])
  ).filter((k) => !["no", "hal", "kota", "hari_tanggal"].includes(k.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            Daftar Penerima Surat Massal *
          </label>
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[10px] px-1.5 py-0">
            {parsedBulkRecipients.length} Penerima
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUploadExcelClick}
            className="h-6 px-2 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded flex items-center gap-1 cursor-pointer shadow-none"
            title="Upload spreadsheet Excel (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Upload Excel</span>
          </Button>

          <button
            type="button"
            onClick={onDownloadExcelTemplate}
            className="text-[10px] text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 cursor-pointer bg-transparent border-none p-0 underline hover:no-underline"
            title="Unduh contoh template format Excel"
          >
            Format Excel
          </button>
        </div>
      </div>

      {/* Bar Keterangan & Aksi */}
      <div className="flex items-center justify-between text-[10px] px-1 text-zinc-500 dark:text-zinc-400">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Ketik 1 baris per nama penerima atau unggah file spreadsheet Excel:
        </span>
        {bulkRecipientsText && (
          <button
            type="button"
            onClick={() => onLoadPreset("clear")}
            className="text-[10px] text-zinc-500 hover:text-rose-600 cursor-pointer bg-transparent border-none p-0 font-medium transition-colors"
            title="Kosongkan daftar penerima"
          >
            Bersihkan
          </button>
        )}
      </div>

      <textarea
        rows={3}
        value={bulkRecipientsText}
        onChange={(e) => onBulkRecipientsChange(e.target.value)}
        placeholder="Ketik atau tempel daftar nama penerima (1 baris per penerima)..."
        className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 outline-none focus:border-blue-500 font-sans leading-relaxed resize-y"
      />

      {/* PANEL PLACEHOLDER KOLOM EXCEL & KUSTOM */}
      <div className="p-3 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-sky-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-zinc-900 border border-blue-200/80 dark:border-blue-900/60 rounded-xl space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
              Placeholder Kolom Excel &amp; Kustom
            </span>
            <Badge className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-none text-[9px] px-1.5 py-0">
              {excelColumns.length} Kolom
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenAddPlaceholder}
            className="h-6 px-2 text-[10px] text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 font-semibold cursor-pointer rounded flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Tambah Sendiri</span>
          </Button>
        </div>

        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
          Klik tombol placeholder di bawah untuk menempatkannya langsung ke lembar surat di posisi kursor:
        </p>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {availablePlaceholders.map((key) => {
            const colDef = excelColumns.find((c) => c.key === key);
            const sampleVal =
              colDef?.sampleValue ||
              excelRowsData[0]?.data?.[key] ||
              docxValues[key] ||
              "";

            return (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInsertPlaceholder(key)}
                className="group flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/80 border border-blue-200/90 dark:border-blue-800 rounded-md text-[11px] font-mono text-blue-700 dark:text-blue-300 transition-all cursor-pointer shadow-2xs hover:border-blue-400 hover:scale-[1.02]"
                title={`Klik untuk sisipkan {{${key}}} ke surat${sampleVal ? ` (Contoh: "${sampleVal}")` : ""}`}
              >
                <Plus className="w-2.5 h-2.5 text-blue-500 group-hover:scale-125 transition-transform shrink-0" />
                <span className="font-semibold">{`{{${key}}}`}</span>
                {sampleVal && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans max-w-[90px] truncate">
                    ({sampleVal})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Distribution Table */}
      {parsedBulkRecipients.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
          <div className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span>Daftar Distribusi ({parsedBulkRecipients.length})</span>
            <span>Klik baris untuk pratinjau</span>
          </div>
          <div className="max-h-36 overflow-y-auto divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {parsedBulkRecipients.map((rec, idx) => {
              const nom = getNomorForIndex(idx);
              const isSelected = previewBulkIndex === idx;
              const rowData = getRowDataForIndex(idx);
              const extraDetails = excelColumns
                .filter((c) => !["penerima", "nomor", "no"].includes(c.key))
                .map((c) => rowData[c.key])
                .filter(Boolean)
                .join(" • ");

              return (
                <div
                  key={idx}
                  onClick={() => onSelectPreviewIndex(idx)}
                  className={`px-3 py-1.5 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold"
                      : "hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="text-[10px] font-mono text-zinc-400 w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="truncate text-[11px] leading-tight">{rec}</p>
                      {extraDetails && (
                        <p className="text-[9.5px] text-zinc-400 font-normal truncate">
                          {extraDetails}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {nom.split(".")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
