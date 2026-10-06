"use client";

import React, { useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface LetterNumberingBoxesProps {
  boxes: [string, string, string, string, string, string, string, string, string];
  onBoxChange: (index: number, val: string) => void;
  letterMode: "single" | "bulk";
  isSequentialNumbering: boolean;
  onToggleSequential: (checked: boolean) => void;
  bulkDuplicateEntries: Array<{ nomor: string; recipient: string }>;
  duplicateEntry: any;
  duplicateSeqEntry: any;
  onAutoAssignNextNumber: () => void;
  nextSeqNumber: string;
  parsedBulkRecipientsLength: number;
  firstNomor: string;
  lastNomor: string;
}

export function LetterNumberingBoxes({
  boxes,
  onBoxChange,
  letterMode,
  isSequentialNumbering,
  onToggleSequential,
  bulkDuplicateEntries,
  duplicateEntry,
  duplicateSeqEntry,
  onAutoAssignNextNumber,
  nextSeqNumber,
  parsedBulkRecipientsLength,
  firstNomor,
  lastNomor
}: LetterNumberingBoxesProps) {
  const boxRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleInputChange = (index: number, value: string, maxLength: number) => {
    onBoxChange(index, value);
    if (value.length >= maxLength && index < 8) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  const hasDuplicate = letterMode === "bulk" ? bulkDuplicateEntries.length > 0 : Boolean(duplicateEntry);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          Nomor Surat (9 Segmen) *
        </label>
      </div>

      <div
        className={`grid grid-cols-9 gap-1 bg-zinc-50 dark:bg-zinc-950 p-1.5 border rounded-lg transition-colors ${
          hasDuplicate
            ? "border-rose-300 dark:border-rose-800 ring-1 ring-rose-200 dark:ring-rose-900/50"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <Input
          ref={boxRefs[0]}
          maxLength={3}
          placeholder="001"
          value={boxes[0]}
          onChange={(e) => handleInputChange(0, e.target.value, 3)}
          className={`text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 shadow-none ${
            hasDuplicate ? "border-rose-400 text-rose-600" : "border-zinc-200 dark:border-zinc-700"
          }`}
          title="1. Nomor Urut Surat"
        />
        <Input
          ref={boxRefs[1]}
          maxLength={2}
          placeholder="PK"
          value={boxes[1]}
          onChange={(e) => handleInputChange(1, e.target.value, 2)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="2. Jenis & Tingkat Kepengurusan"
        />
        <Input
          ref={boxRefs[2]}
          maxLength={4}
          placeholder="XI"
          value={boxes[2]}
          onChange={(e) => handleInputChange(2, e.target.value, 4)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="3. Periode / Wilayah"
        />
        <Input
          ref={boxRefs[3]}
          maxLength={5}
          placeholder="Z-03"
          value={boxes[3]}
          onChange={(e) => handleInputChange(3, e.target.value, 5)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="4. Kode Klasifikasi"
        />
        <Input
          ref={boxRefs[4]}
          maxLength={2}
          placeholder="01"
          value={boxes[4]}
          onChange={(e) => handleInputChange(4, e.target.value, 2)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="5. Kode Wilayah"
        />
        <Input
          ref={boxRefs[5]}
          maxLength={3}
          placeholder="010"
          value={boxes[5]}
          onChange={(e) => handleInputChange(5, e.target.value, 3)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="6. Kode Cabang"
        />
        <Input
          ref={boxRefs[6]}
          maxLength={4}
          placeholder="B-II"
          value={boxes[6]}
          onChange={(e) => handleInputChange(6, e.target.value, 4)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="7. Kode Intern / Ekstern"
        />
        <Input
          ref={boxRefs[7]}
          maxLength={2}
          placeholder="12"
          value={boxes[7]}
          onChange={(e) => handleInputChange(7, e.target.value, 2)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="8. Bulan Hijri / Masehi"
        />
        <Input
          ref={boxRefs[8]}
          maxLength={4}
          placeholder="2026"
          value={boxes[8]}
          onChange={(e) => handleInputChange(8, e.target.value, 4)}
          className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
          title="9. Tahun"
        />
      </div>

      {/* Sequential Numbering Option for Bulk Mode */}
      {letterMode === "bulk" && (
        <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
              Nomor Berurutan (+1 per penerima)
            </span>
            <span className="text-[10px] text-zinc-500">
              {isSequentialNumbering
                ? "Nomor urut otomatis naik per penerima"
                : "Gunakan satu nomor untuk semua penerima"}
            </span>
          </div>
          <input
            type="checkbox"
            checked={isSequentialNumbering}
            onChange={(e) => onToggleSequential(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 cursor-pointer"
          />
        </label>
      )}

      {/* Validation status / duplicate warning */}
      {letterMode === "bulk" ? (
        bulkDuplicateEntries.length > 0 ? (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{bulkDuplicateEntries.length} Nomor Surat Massal Sudah Digunakan!</span>
              </div>
              <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0">Duplikat Terdeteksi</Badge>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-tight">
              Konflik: {bulkDuplicateEntries.slice(0, 2).map((d) => `${d.nomor} (${d.recipient})`).join(", ")}
              {bulkDuplicateEntries.length > 2 ? `, dan ${bulkDuplicateEntries.length - 2} lainnya.` : "."}
            </p>
            <div className="pt-0.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAutoAssignNextNumber}
                className="h-6 text-[10px] font-semibold bg-white dark:bg-zinc-900 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded cursor-pointer flex items-center gap-1 shadow-none"
              >
                <Sparkles className="w-3 h-3 text-rose-600" />
                <span>Mulai dari Nomor Urut Baru: #{nextSeqNumber}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 px-1 pt-0.5 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Rentang nomor urut aman ({firstNomor.split(".")[0]} s/d {lastNomor.split(".")[0]}).
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {parsedBulkRecipientsLength} Surat
            </span>
          </div>
        )
      ) : duplicateEntry ? (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Nomor Surat Sudah Pernah Digunakan!</span>
            </div>
            <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0">Duplikat Terdeteksi</Badge>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-tight">
            Nomor ini sudah tercatat pada surat: <strong>&quot;{duplicateEntry.subject || "Surat Keluar"}&quot;</strong> (
            {duplicateEntry.date || duplicateEntry.dateIndo || "Terkirim"}).
          </p>
          <div className="pt-0.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAutoAssignNextNumber}
              className="h-6 text-[10px] font-semibold bg-white dark:bg-zinc-900 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded cursor-pointer flex items-center gap-1 shadow-none"
            >
              <Sparkles className="w-3 h-3 text-rose-600" />
              <span>Ganti ke Nomor Urut Baru: #{nextSeqNumber}</span>
            </Button>
          </div>
        </div>
      ) : duplicateSeqEntry ? (
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              No. urut <strong>#{boxes[0]}</strong> pernah dipakai di surat lain (
              <em>{duplicateSeqEntry.subject?.slice(0, 30)}...</em>)
            </span>
          </div>
          <button
            type="button"
            onClick={onAutoAssignNextNumber}
            className="text-[10px] font-bold text-amber-700 dark:text-amber-300 underline hover:no-underline shrink-0 cursor-pointer"
          >
            Pakai #{nextSeqNumber}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 px-1 pt-0.5 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Nomor surat siap digunakan.
          </span>
          <button
            type="button"
            onClick={onAutoAssignNextNumber}
            className="text-[10px] text-zinc-400 hover:text-blue-600 underline cursor-pointer"
          >
            Auto Urut #{nextSeqNumber}
          </button>
        </div>
      )}
    </div>
  );
}
