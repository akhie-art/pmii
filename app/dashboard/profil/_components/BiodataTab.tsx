"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NikInput from "@/app/dashboard/anggota/_components/NikInput";
import { DocumentAttachment } from "@/components/ui/document-attachment";
import { BiodataTabProps } from "./types";

export function BiodataTab({
  isEditing,
  name,
  setName,
  gender,
  setGender,
  nik,
  setNik,
  tempatLahir,
  setTempatLahir,
  tanggalLahir,
  setTanggalLahir,
  alamatRumah,
  setAlamatRumah,
  address,
  setAddress,
  golonganDarah,
  setGolonganDarah,
  riwayatPenyakit,
  setRiwayatPenyakit,
  ktpName,
  setKtpName,
  ktpFileUrl,
  onKtpUpload,
  onRemoveKtp,
}: BiodataTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            disabled={!isEditing}
            placeholder="Masukkan nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Jenis Kelamin
          </label>
          <Select disabled={!isEditing} value={gender} onValueChange={(val) => { if (val) setGender(val as any); }}>
            <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default">
              <SelectValue placeholder="Pilih Jenis Kelamin" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
              <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* NIK Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Nomor Induk Kependudukan (NIK 16 Digit)
        </label>
        <NikInput value={nik} onChange={setNik} disabled={!isEditing} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Tempat Lahir
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Kota / Kabupaten kelahiran"
            value={tempatLahir}
            onChange={(e) => setTempatLahir(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Tanggal Lahir
          </label>
          <Input
            type="date"
            disabled={!isEditing}
            value={tanggalLahir}
            onChange={(e) => setTanggalLahir(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Alamat Asal Sesuai KTP
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Alamat lengkap asal KTP"
            value={alamatRumah}
            onChange={(e) => setAlamatRumah(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Alamat Domisili Sekarang <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            disabled={!isEditing}
            placeholder="Alamat domisili / tempat tinggal saat ini"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Golongan Darah
          </label>
          <Select disabled={!isEditing} value={golonganDarah} onValueChange={(val) => { if (val) setGolonganDarah(val); }}>
            <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default">
              <SelectValue placeholder="Golongan Darah" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectItem value="A">Golongan A</SelectItem>
              <SelectItem value="B">Golongan B</SelectItem>
              <SelectItem value="AB">Golongan AB</SelectItem>
              <SelectItem value="O">Golongan O</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Riwayat Penyakit (Opsional)
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Asma, Alergi (jika ada)"
            value={riwayatPenyakit}
            onChange={(e) => setRiwayatPenyakit(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      {/* Lampiran Berkas KTP */}
      <DocumentAttachment
        label="Lampiran Berkas KTP (Asli / Scan)"
        badgeLabel="Identitas Kependudukan Resmi"
        fileName={ktpName}
        fileUrl={ktpFileUrl}
        isEditing={isEditing}
        onUpload={(file) => {
          if (onKtpUpload) {
            onKtpUpload(file);
          } else {
            setKtpName(file.name);
          }
        }}
        onRemove={() => {
          if (onRemoveKtp) {
            onRemoveKtp();
          } else {
            setKtpName("");
          }
        }}
        accentColor="blue"
      />
    </div>
  );
}
