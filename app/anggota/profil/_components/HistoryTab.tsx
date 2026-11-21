"use client";

import React, { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HistoryTabProps } from "./types";
import { ProfileField } from "./ProfileField";

export interface OrgItem {
  id: string;
  nama: string;
  tahunMulai?: string;
  tahunSelesai?: string;
}

export function parseOrgItems(raw?: string | null): OrgItem[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `org-${idx}-${Date.now()}`,
          nama: item.nama || item.name || "",
          tahunMulai: item.tahunMulai || item.startYear || "",
          tahunSelesai: item.tahunSelesai || item.endYear || ""
        }));
      }
    } catch {}
  }
  // Plain text fallback (comma separated)
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, idx) => ({
      id: `legacy-${idx}`,
      nama: s,
      tahunMulai: "",
      tahunSelesai: ""
    }));
}

export function stringifyOrgItems(items: OrgItem[]): string {
  const valid = items
    .map((i) => ({
      nama: i.nama.trim(),
      tahunMulai: (i.tahunMulai || "").trim(),
      tahunSelesai: (i.tahunSelesai || "").trim()
    }))
    .filter((i) => i.nama);
  if (valid.length === 0) return "";
  return JSON.stringify(valid);
}

export function RepeatableOrgSection({
  title,
  icon: Icon,
  rawString,
  onChange,
  isEditing,
  placeholder,
  defaultAddName
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  rawString: string;
  onChange: (val: string) => void;
  isEditing: boolean;
  placeholder: string;
  defaultAddName: string;
}) {
  const items = useMemo(() => parseOrgItems(rawString), [rawString]);

  const handleUpdateItem = (index: number, field: keyof OrgItem, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(stringifyOrgItems(updated));
  };

  const handleAddItem = () => {
    const newItem: OrgItem = {
      id: `org-${Date.now()}`,
      nama: "",
      tahunMulai: "",
      tahunSelesai: ""
    };
    onChange(stringifyOrgItems([...items, newItem]));
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChange(stringifyOrgItems(updated));
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5 flex flex-col justify-between">
      <div className="space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {title}
          </label>
          {items.length > 0 && (
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              {items.length} Org
            </span>
          )}
        </div>

        {/* Mode Edit: List of Repeatable Items */}
        {isEditing ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 shrink-0 w-4">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder={placeholder}
                      value={item.nama}
                      onChange={(e) => handleUpdateItem(idx, "nama", e.target.value)}
                      className="h-8 text-xs bg-zinc-50/60 dark:bg-zinc-950/60 rounded-md"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(idx)}
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md shrink-0 cursor-pointer"
                    title="Hapus Organisasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Tahun Mulai & Tahun Selesai */}
                <div className="grid grid-cols-2 gap-2 pl-5.5">
                  <div>
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5">
                      Tahun Mulai
                    </label>
                    <Input
                      type="number"
                      min="1980"
                      max="2099"
                      placeholder="Contoh: 2016"
                      value={item.tahunMulai || ""}
                      onChange={(e) => handleUpdateItem(idx, "tahunMulai", e.target.value)}
                      className="h-7 text-xs font-mono bg-zinc-50/60 dark:bg-zinc-950/60 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5">
                      Tahun Selesai
                    </label>
                    <Input
                      placeholder="Contoh: 2018 / Sekarang"
                      value={item.tahunSelesai || ""}
                      onChange={(e) => handleUpdateItem(idx, "tahunSelesai", e.target.value)}
                      className="h-7 text-xs font-mono bg-zinc-50/60 dark:bg-zinc-950/60 rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="w-full h-7.5 text-xs border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 shadow-none font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah {defaultAddName}</span>
            </Button>
          </div>
        ) : (
          /* Mode Baca: Clean flat list */
          <div>
            {items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-xs shadow-none gap-2"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {item.nama}
                    </div>
                    {(item.tahunMulai || item.tahunSelesai) && (
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0">
                        {item.tahunMulai || "..."} – {item.tahunSelesai || "Sekarang"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 text-center text-xs text-zinc-400 dark:text-zinc-500 italic bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
                Belum ada riwayat organisasi
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryTab({
  isEditing,
  pendidikanSD,
  setPendidikanSD,
  tahunMasukSD,
  setTahunMasukSD,
  tahunLulusSD,
  setTahunLulusSD,
  pendidikanSMP,
  setPendidikanSMP,
  tahunMasukSMP,
  setTahunMasukSMP,
  tahunLulusSMP,
  setTahunLulusSMP,
  pendidikanSMA,
  setPendidikanSMA,
  tahunMasukSMA,
  setTahunMasukSMA,
  tahunLulusSMA,
  setTahunLulusSMA,
  organisasiSMP,
  setOrganisasiSMP,
  organisasiSMA,
  setOrganisasiSMA,
  organisasiPT,
  setOrganisasiPT
}: HistoryTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. RIWAYAT PENDIDIKAN FORMAL */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Riwayat Pendidikan Formal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SD / MI */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <ProfileField
              label="Sekolah Dasar (SD/MI)"
              isEditing={isEditing}
              value={pendidikanSD}
              emptyPlaceholder="SD/MI belum diisi"
              displayValue={
                pendidikanSD ? (
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{pendidikanSD}</div>
                    {(tahunMasukSD || tahunLulusSD) && (
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Tahun: {tahunMasukSD || "..."} – {tahunLulusSD || "..."}
                      </div>
                    )}
                  </div>
                ) : undefined
              }
            >
              <Input
                placeholder="Nama SD / MI"
                value={pendidikanSD}
                onChange={(e) => setPendidikanSD(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-zinc-900 rounded-md"
              />
            </ProfileField>

            <div className="grid grid-cols-2 gap-2">
              <ProfileField
                label="Tahun Mulai"
                isEditing={isEditing}
                value={tahunMasukSD}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2009"
                  value={tahunMasukSD || ""}
                  onChange={(e) => setTahunMasukSD && setTahunMasukSD(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>

              <ProfileField
                label="Tahun Selesai"
                isEditing={isEditing}
                value={tahunLulusSD}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2015"
                  value={tahunLulusSD || ""}
                  onChange={(e) => setTahunLulusSD && setTahunLulusSD(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>
            </div>
          </div>

          {/* SMP / MTs */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <ProfileField
              label="SMP / MTs"
              isEditing={isEditing}
              value={pendidikanSMP}
              emptyPlaceholder="SMP/MTs belum diisi"
              displayValue={
                pendidikanSMP ? (
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{pendidikanSMP}</div>
                    {(tahunMasukSMP || tahunLulusSMP) && (
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Tahun: {tahunMasukSMP || "..."} – {tahunLulusSMP || "..."}
                      </div>
                    )}
                  </div>
                ) : undefined
              }
            >
              <Input
                placeholder="Nama SMP / MTs"
                value={pendidikanSMP}
                onChange={(e) => setPendidikanSMP(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-zinc-900 rounded-md"
              />
            </ProfileField>

            <div className="grid grid-cols-2 gap-2">
              <ProfileField
                label="Tahun Mulai"
                isEditing={isEditing}
                value={tahunMasukSMP}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2015"
                  value={tahunMasukSMP || ""}
                  onChange={(e) => setTahunMasukSMP && setTahunMasukSMP(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>

              <ProfileField
                label="Tahun Selesai"
                isEditing={isEditing}
                value={tahunLulusSMP}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2018"
                  value={tahunLulusSMP || ""}
                  onChange={(e) => setTahunLulusSMP && setTahunLulusSMP(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>
            </div>
          </div>

          {/* SMA / SMK / MA */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <ProfileField
              label="SMA / SMK / MA"
              isEditing={isEditing}
              value={pendidikanSMA}
              emptyPlaceholder="SMA/SMK/MA belum diisi"
              displayValue={
                pendidikanSMA ? (
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{pendidikanSMA}</div>
                    {(tahunMasukSMA || tahunLulusSMA) && (
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Tahun: {tahunMasukSMA || "..."} – {tahunLulusSMA || "..."}
                      </div>
                    )}
                  </div>
                ) : undefined
              }
            >
              <Input
                placeholder="Nama SMA / SMK / MA"
                value={pendidikanSMA}
                onChange={(e) => setPendidikanSMA(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-zinc-900 rounded-md"
              />
            </ProfileField>

            <div className="grid grid-cols-2 gap-2">
              <ProfileField
                label="Tahun Mulai"
                isEditing={isEditing}
                value={tahunMasukSMA}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2018"
                  value={tahunMasukSMA || ""}
                  onChange={(e) => setTahunMasukSMA && setTahunMasukSMA(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>

              <ProfileField
                label="Tahun Selesai"
                isEditing={isEditing}
                value={tahunLulusSMA}
                emptyPlaceholder="-"
              >
                <Input
                  type="number"
                  min="1980"
                  max="2099"
                  placeholder="2021"
                  value={tahunLulusSMA || ""}
                  onChange={(e) => setTahunLulusSMA && setTahunLulusSMA(e.target.value)}
                  className="h-7 text-xs font-mono bg-white dark:bg-zinc-900 rounded-md"
                />
              </ProfileField>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIWAYAT PENGALAMAN ORGANISASI (REPEATABLE DENGAN TAHUN) */}
      <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Pengalaman Organisasi (Dapat Diulang)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            placeholder="Contoh: BEM, Himpunan, UKM"
            defaultAddName="Organisasi Kampus"
          />
        </div>
      </div>
    </div>
  );
}
