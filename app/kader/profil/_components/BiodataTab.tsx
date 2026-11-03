"use client";

import React from "react";
import { User, Calendar, MapPin, ShieldAlert, HeartPulse, CreditCard, Home } from "lucide-react";
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
  setRiwayatPenyakit
}: BiodataTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
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
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>

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
