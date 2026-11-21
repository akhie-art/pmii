"use client";

import React, { useRef, useState } from "react";
import { User, Calendar, MapPin, ShieldAlert, HeartPulse, CreditCard, Home, Camera, ZoomIn, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { BiodataTabProps } from "./types";
import { ProfileField, formatIndonesianDate } from "./ProfileField";

export function BiodataTab({
  isEditing,
  name,
  setName,
  gender,
  setGender,
  nim,
  setNim,
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
  pasFoto,
  isUploadingPasFoto,
  onPasFotoUpload,
  onRemovePasFoto
}: BiodataTabProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. PAS FOTO RESMI (3x4) */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Pas Foto Resmi (3×4)
          </label>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
            Digunakan untuk KTA Digital & CV Resmi PMII (Kolom Terpisah dari Avatar)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4">
          {pasFoto ? (
            <div className="relative group shrink-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsPreviewOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setIsPreviewOpen(true);
                }}
                className="w-24 h-32 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-2xs cursor-pointer relative"
                title="Klik untuk melihat foto penuh"
              >
                <img
                  src={pasFoto}
                  alt="Pas Foto Kader"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-24 h-32 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 shrink-0">
              <User className="w-7 h-7 opacity-40 mb-1" />
              <span className="text-[10px] font-medium text-center">Foto 3×4</span>
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {pasFoto ? "Pas Foto Kader Terpasang" : "Unggah Pas Foto Berlatar Resmi"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Disarankan pas foto berpakaian rapi / jas PMII dengan rasio 3:4 (Maks. 5 MB).
              </p>
            </div>

            {isEditing && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={onPasFotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingPasFoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="h-8 px-3 text-xs rounded-md border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center gap-1.5 font-medium"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{pasFoto ? "Ganti Foto" : "Pilih Foto 3×4"}</span>
                </Button>

                {pasFoto && onRemovePasFoto && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingPasFoto}
                    onClick={onRemovePasFoto}
                    className="h-8 px-2.5 text-xs rounded-md border-zinc-200 dark:border-zinc-800 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Zoom Preview */}
        {pasFoto && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-md p-4 sm:p-5 overflow-hidden">
              <DialogHeader className="pb-2.5 border-b border-zinc-100 dark:border-zinc-800 pr-8">
                <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Pratinjau Pas Foto Resmi
                </DialogTitle>
              </DialogHeader>
              <div className="my-2 max-h-[70vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-md p-2">
                <img
                  src={pasFoto}
                  alt="Pas Foto Penuh"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded shadow-xs"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Row 1: Nama Lengkap & Jenis Kelamin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <ProfileField
          label="Nama Lengkap"
          required
          isEditing={isEditing}
          value={name}
          emptyPlaceholder="Nama belum diisi"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <User className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              required
              placeholder="Masukkan nama lengkap sesuai identitas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="Jenis Kelamin"
          isEditing={isEditing}
          value={gender}
          displayValue={
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                gender === "Laki-laki"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50"
                  : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
              }`}>
                {gender === "Laki-laki" ? "Laki-laki (Sahabat)" : "Perempuan (Sahabati)"}
              </span>
            </div>
          }
        >
          <Select
            value={gender}
            onValueChange={(val) => {
              if (val) setGender(val as any);
            }}
          >
            <SelectTrigger className="h-9.5 text-xs sm:text-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl">
              <SelectValue placeholder="Pilih Jenis Kelamin" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
              <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
            </SelectContent>
          </Select>
        </ProfileField>
      </div>

      {/* Row 2: Nomor Induk Mahasiswa (NIM) */}
      <ProfileField
        label="Nomor Induk Mahasiswa (NIM)"
        isEditing={isEditing}
        value={nim}
        emptyPlaceholder="Belum mencantumkan NIM"
        displayValue={
          nim ? (
            <span className="font-mono font-semibold text-xs sm:text-sm tracking-wider text-blue-700 dark:text-blue-400">
              {nim}
            </span>
          ) : undefined
        }
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <CreditCard className="size-4 text-blue-500" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Masukkan NIM mahasiswa (contoh: 21010123)"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="font-mono tracking-wide"
          />
        </InputGroup>
      </ProfileField>

      {/* Row 3: Tempat & Tanggal Lahir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <ProfileField
          label="Tempat Lahir"
          isEditing={isEditing}
          value={tempatLahir}
          emptyPlaceholder="Kota / Kabupaten belum diisi"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <MapPin className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Contoh: Semarang / Grobogan"
              value={tempatLahir}
              onChange={(e) => setTempatLahir(e.target.value)}
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="Tanggal Lahir"
          isEditing={isEditing}
          value={tanggalLahir}
          emptyPlaceholder="Tanggal belum diisi"
          displayValue={
            tanggalLahir ? (
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatIndonesianDate(tanggalLahir)}
              </span>
            ) : undefined
          }
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Calendar className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>

      {/* Pratinjau Format Resmi Tempat, Tanggal Lahir (Kombinasi Standar Indonesia) */}
      {!isEditing && (tempatLahir || tanggalLahir) && (
        <div className="px-3.5 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-blue-700 dark:text-blue-400 shrink-0">TTL Resmi:</span>
            <span className="font-medium truncate">
              {tempatLahir ? tempatLahir : "Kota belum diisi"}, {tanggalLahir ? formatIndonesianDate(tanggalLahir) : "Tanggal belum diisi"}
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800">
            Standar CV & KTA
          </span>
        </div>
      )}

      {/* Row 4: Alamat Asal & Domisili */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <ProfileField
          label="Alamat Asal Sesuai KTP"
          isEditing={isEditing}
          value={alamatRumah}
          emptyPlaceholder="Alamat asal belum diisi"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Home className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Alamat asal lengkap (desa, RT/RW, kecamatan)"
              value={alamatRumah}
              onChange={(e) => setAlamatRumah(e.target.value)}
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="Alamat Domisili Sekarang"
          required
          isEditing={isEditing}
          value={address}
          emptyPlaceholder="Alamat domisili belum diisi"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <MapPin className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              required
              placeholder="Alamat tempat tinggal / kos saat ini"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>

      {/* Row 5: Golongan Darah & Riwayat Penyakit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <ProfileField
          label="Golongan Darah"
          isEditing={isEditing}
          value={golonganDarah}
          displayValue={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <HeartPulse className="w-3 h-3 text-rose-500" />
              Golongan {golonganDarah || "O"}
            </span>
          }
        >
          <Select
            value={golonganDarah}
            onValueChange={(val) => {
              if (val) setGolonganDarah(val);
            }}
          >
            <SelectTrigger className="h-9.5 text-xs sm:text-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl">
              <SelectValue placeholder="Pilih Golongan Darah" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectItem value="A">Golongan A</SelectItem>
              <SelectItem value="B">Golongan B</SelectItem>
              <SelectItem value="AB">Golongan AB</SelectItem>
              <SelectItem value="O">Golongan O</SelectItem>
            </SelectContent>
          </Select>
        </ProfileField>

        <ProfileField
          label="Riwayat Penyakit (Opsional)"
          isEditing={isEditing}
          value={riwayatPenyakit}
          emptyPlaceholder="Tidak ada riwayat penyakit khusus"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <ShieldAlert className="size-4 text-rose-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Misal: Asma, Alergi dingin (jika ada)"
              value={riwayatPenyakit}
              onChange={(e) => setRiwayatPenyakit(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>
    </div>
  );
}
