"use client";

import React from "react";
import { GraduationCap, School, Building2, Users } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { HistoryTabProps } from "./types";
import { ProfileField } from "./ProfileField";

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
  setOrganisasiPT
}: HistoryTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. RIWAYAT PENDIDIKAN FORMAL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Riwayat Pendidikan Formal</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <ProfileField
            label="Sekolah Dasar (SD/MI)"
            isEditing={isEditing}
            value={pendidikanSD}
            emptyPlaceholder="SD/MI belum diisi"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <School className="size-4 text-zinc-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Nama SD / MI"
                value={pendidikanSD}
                onChange={(e) => setPendidikanSD(e.target.value)}
              />
            </InputGroup>
          </ProfileField>

          <ProfileField
            label="SMP / MTs"
            isEditing={isEditing}
            value={pendidikanSMP}
            emptyPlaceholder="SMP/MTs belum diisi"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <School className="size-4 text-zinc-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Nama SMP / MTs"
                value={pendidikanSMP}
                onChange={(e) => setPendidikanSMP(e.target.value)}
              />
            </InputGroup>
          </ProfileField>

          <ProfileField
            label="SMA / SMK / MA"
            isEditing={isEditing}
            value={pendidikanSMA}
            emptyPlaceholder="SMA/SMK/MA belum diisi"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <GraduationCap className="size-4 text-zinc-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Nama SMA / SMK / MA"
                value={pendidikanSMA}
                onChange={(e) => setPendidikanSMA(e.target.value)}
              />
            </InputGroup>
          </ProfileField>
        </div>
      </div>

      {/* 2. RIWAYAT PENGALAMAN ORGANISASI */}
      <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Pengalaman Organisasi</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <ProfileField
            label="Organisasi Tingkat SMP / MTs"
            isEditing={isEditing}
            value={organisasiSMP}
            emptyPlaceholder="Belum ada riwayat"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Users className="size-4 text-indigo-500" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Misal: OSIS, Pramuka, Palang Merah Remaja"
                value={organisasiSMP}
                onChange={(e) => setOrganisasiSMP(e.target.value)}
              />
            </InputGroup>
          </ProfileField>

          <ProfileField
            label="Organisasi Tingkat SMA / SMK / MA"
            isEditing={isEditing}
            value={organisasiSMA}
            emptyPlaceholder="Belum ada riwayat"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Users className="size-4 text-indigo-500" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Misal: IPNU/IPPNU, OSIS, Rohis, Paskibra"
                value={organisasiSMA}
                onChange={(e) => setOrganisasiSMA(e.target.value)}
              />
            </InputGroup>
          </ProfileField>

          <ProfileField
            label="Organisasi Kampus / Luar PMII"
            isEditing={isEditing}
            value={organisasiPT}
            emptyPlaceholder="Belum ada riwayat organisasi kampus/luar"
            className="sm:col-span-2"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Building2 className="size-4 text-indigo-500" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Misal: BEM, Himpunan Mahasiswa Jurusan (HMJ), UKM Teater"
                value={organisasiPT}
                onChange={(e) => setOrganisasiPT(e.target.value)}
              />
            </InputGroup>
          </ProfileField>
        </div>
      </div>
    </div>
  );
}
