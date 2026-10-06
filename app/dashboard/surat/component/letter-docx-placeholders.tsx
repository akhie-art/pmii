"use client";

import React from "react";
import { Sparkles, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface LetterDocxPlaceholdersProps {
  detailPlaceholders: string[];
  docxValues: Record<string, string>;
  onDocxValueChange: (key: string, val: string) => void;
  excelColumns: Array<{ key: string; originalHeader: string; sampleValue: string }>;
  currentRowData: Record<string, string>;
  humanizePlaceholderKey: (key: string) => string;
  isMultilineField: (key: string) => boolean;
}

export function LetterDocxPlaceholders({
  detailPlaceholders,
  docxValues,
  onDocxValueChange,
  excelColumns,
  currentRowData,
  humanizePlaceholderKey,
  isMultilineField
}: LetterDocxPlaceholdersProps) {
  if (detailPlaceholders.length === 0) return null;

  return (
    <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-none">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Variabel Template (.docx)
          </span>
        </div>
        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-none text-[9px] px-1.5 py-0">
          {detailPlaceholders.length} Variabel
        </Badge>
      </div>

      <div className="space-y-2.5 pt-0.5">
        {detailPlaceholders.map((key) => {
          const label = humanizePlaceholderKey(key);
          const isMulti = isMultilineField(key);
          const colDef = excelColumns.find(
            (c) => c.key === key.toLowerCase() || c.originalHeader?.toLowerCase() === key.toLowerCase()
          );
          const currentExcelVal = currentRowData[key] || currentRowData[key.toLowerCase()];
          const sampleVal = colDef?.sampleValue || "";
          const currentVal = docxValues[key] !== undefined ? docxValues[key] : currentExcelVal || "";

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>{label}</span>
                  <span className="font-mono text-zinc-400 text-[10px]">
                    {`{{${key}}}`}
                  </span>
                </label>
                {currentExcelVal && (
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded font-medium">
                    Excel
                  </span>
                )}
              </div>

              {isMulti ? (
                <textarea
                  rows={2}
                  value={currentVal}
                  onChange={(e) => onDocxValueChange(key, e.target.value)}
                  placeholder={`Isi ${label.toLowerCase()}...`}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 outline-none focus:border-blue-500 font-sans leading-relaxed resize-y"
                />
              ) : (
                <Input
                  value={currentVal}
                  onChange={(e) => onDocxValueChange(key, e.target.value)}
                  placeholder={currentExcelVal || sampleVal || `Isi ${label.toLowerCase()}...`}
                  className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
