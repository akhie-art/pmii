"use client";

import React from "react";
import { Trash, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AcademicTabProps } from "./types";

export function AcademicTab({
  isEditing,
  perguruanTinggi,
  setPerguruanTinggi,
  fakultas,
  setFakultas,
  jurusan,
  setJurusan,
  phone,
  setPhone,
  email,
  setEmail,
  instagram,
  setInstagram,
  twitter,
  setTwitter,
  facebook,
  setFacebook,
  ktmName,
  setKtmName,
}: AcademicTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Perguruan Tinggi
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Nama Kampus / Universitas"
            value={perguruanTinggi}
            onChange={(e) => setPerguruanTinggi(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Fakultas
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: FST, Tarbiyah"
            value={fakultas}
            onChange={(e) => setFakultas(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Jurusan / Prodi
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Misal: Teknologi Informasi"
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Nomor WhatsApp / HP <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            disabled={!isEditing}
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Alamat Surel (E-mail) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            required
            disabled={!isEditing}
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Instagram
          </label>
          <Input
            disabled={!isEditing}
            placeholder="@username"
            value={instagram.replace(/^@+/, "")}
            onChange={(e) => setInstagram(e.target.value ? `@${e.target.value.replace(/^@+/, "")}` : "")}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            X (Twitter)
          </label>
          <Input
            disabled={!isEditing}
            placeholder="@username"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Facebook
          </label>
          <Input
            disabled={!isEditing}
            placeholder="Nama Akun"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
          />
        </div>
      </div>

      {/* Lampiran KTM */}
      <div className="space-y-1 pt-1">
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Unggah Kartu Tanda Mahasiswa (KTM)
        </label>
        {ktmName ? (
          <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
            <span className="truncate max-w-[240px] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              {ktmName}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={() => setKtmName("")}
                className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : isEditing ? (
          <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-500">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px]">Pilih File KTM (Gambar/PDF)</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setKtmName(e.target.files[0].name);
              }}
            />
          </label>
        ) : (
          <div className="p-2 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg">
            Belum ada lampiran berkas KTM
          </div>
        )}
      </div>
    </div>
  );
}
