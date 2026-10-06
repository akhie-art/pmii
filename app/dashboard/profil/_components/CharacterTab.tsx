"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { CharacterTabProps } from "./types";

export function CharacterTab({
  isEditing,
  angkatan,
  setAngkatan,
  jabatan,
  setJabatan,
  orientasiProfetik,
  setOrientasiProfetik,
  minatPassion,
  setMinatPassion,
  motivasiMapaba,
  setMotivasiMapaba,
}: CharacterTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Tahun Angkatan PMII
          </label>
          <Input
            placeholder="Contoh: 2026"
            value={angkatan}
            disabled={!isEditing}
            onChange={(e) => setAngkatan(e.target.value)}
            className="h-8.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Jabatan Kepengurusan
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Ketua, Sekretaris, Bendahara, Biro Kaderisasi"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Orientasi Profetik / Jalur Pengembangan
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Intelektual, Akademik, Advokasi, Keagamaan"
            value={orientasiProfetik}
            onChange={(e) => setOrientasiProfetik(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Minat & Passion
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Kepenulisan, Desain Grafis, Riset, Wirausaha"
            value={minatPassion}
            onChange={(e) => setMinatPassion(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Motivasi Berkhidmat di PMII
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Alasan & cita-cita berkhidmat di kepengurusan PMII"
            value={motivasiMapaba}
            onChange={(e) => setMotivasiMapaba(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>
    </div>
  );
}
