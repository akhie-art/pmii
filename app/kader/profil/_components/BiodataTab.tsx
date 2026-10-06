"use client";

import React, { useRef } from "react";
import { Upload, Trash, FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import NikInput from "@/app/dashboard/anggota/_components/NikInput";
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
  ktpFileUrl,
  onKtpUpload,
  onRemoveKtp
}: BiodataTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onKtpUpload(file);
    }
  };

  const isImage =
    ktpFileUrl?.startsWith("data:image/") ||
    Boolean(ktpName?.match(/\.(jpg|jpeg|png|webp)$/i)) ||
    Boolean(ktpFileUrl?.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i));

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
          <Select
            disabled={!isEditing}
            value={gender}
            onValueChange={(val) => {
              if (val) setGender(val as any);
            }}
          >
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
          <Select
            disabled={!isEditing}
            value={golonganDarah}
            onValueChange={(val) => {
              if (val) setGolonganDarah(val);
            }}
          >
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

      {/* Lampiran Berkas KTP dengan Simpan Berkas Asli & Preview */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Lampiran Berkas KTP (Asli / Scan)
        </label>
        
        {ktpName || ktpFileUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {ktpFileUrl && isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ktpFileUrl}
                  alt="KTP Preview"
                  className="w-12 h-9 object-cover rounded-md border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-9 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="truncate block max-w-[200px] sm:max-w-[280px] text-zinc-800 dark:text-zinc-200 font-medium text-xs">
                  {ktpName || "Berkas-KTP"}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {ktpFileUrl ? "Tersimpan di sistem" : "Nama tercatat"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {ktpFileUrl && (
                <a
                  href={ktpFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Lihat Berkas</span>
                </a>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={onRemoveKtp}
                  title="Hapus berkas KTP"
                  className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : isEditing ? (
          <div>
            <label
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500/60 rounded-xl cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-medium">Unggah Berkas KTP (Gambar JPG/PNG/WebP atau PDF, maks. 5 MB)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="p-3 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
            Belum ada lampiran berkas KTP
          </div>
        )}
      </div>
    </div>
  );
}
