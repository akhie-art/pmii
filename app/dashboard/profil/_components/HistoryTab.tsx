"use client";

import React from "react";
import { School, GraduationCap, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HistoryTabProps } from "./types";
import { RepeatableOrgSection } from "@/app/anggota/profil/_components/HistoryTab";

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <RepeatableOrgSection
          title="Tingkat SMP / MTs"
          rawString={organisasiSMP}
          onChange={setOrganisasiSMP}
          isEditing={isEditing}
          placeholder="Contoh: OSIS, Pramuka, PMR"
          defaultAddName="Organisasi SMP"
        />

        <RepeatableOrgSection
          title="Tingkat SMA / SMK / MA"
          rawString={organisasiSMA}
          onChange={setOrganisasiSMA}
          isEditing={isEditing}
          placeholder="Contoh: IPNU/IPPNU, OSIS, Rohis"
          defaultAddName="Organisasi SMA"
        />

        <RepeatableOrgSection
          title="Kampus / Luar PMII"
          rawString={organisasiPT}
          onChange={setOrganisasiPT}
          isEditing={isEditing}
          placeholder="Contoh: BEM, Himpunan Mahasiswa, UKM"
          defaultAddName="Organisasi Kampus"
        />
      </div>
    </div>
  );
}
