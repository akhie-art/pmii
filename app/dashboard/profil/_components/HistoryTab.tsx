"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { HistoryTabProps } from "./types";

export function HistoryTab({
  isEditing,
  pendidikanSD,
  setPendidikanSD,
  pendidikanSMP,
  setPendidikanSMP,
  pendidikanSMA,
  setPendidikanSMA,
  organisasiSMP,
  setOrganisasiSMP,
  organisasiSMA,
  setOrganisasiSMA,
  organisasiPT,
  setOrganisasiPT,
}: HistoryTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Sekolah Dasar (SD/MI)
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Nama SD / MI"
            value={pendidikanSD}
            onChange={(e) => setPendidikanSD(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            SMP / MTs
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Nama SMP / MTs"
            value={pendidikanSMP}
            onChange={(e) => setPendidikanSMP(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            SMA / SMK / MA
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Nama SMA / SMK / MA"
            value={pendidikanSMA}
            onChange={(e) => setPendidikanSMA(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Organisasi Tingkat SMP / MTs
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: OSIS, Pramuka"
            value={organisasiSMP}
            onChange={(e) => setOrganisasiSMP(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Organisasi Tingkat SMA / SMK / MA
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: IPNU/IPPNU, OSIS"
            value={organisasiSMA}
            onChange={(e) => setOrganisasiSMA(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Organisasi di Kampus / Luar PMII (Lainnya)
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: BEM, Himpunan Mahasiswa Jurusan, UKM"
            value={organisasiPT}
            onChange={(e) => setOrganisasiPT(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>
    </div>
  );
}
