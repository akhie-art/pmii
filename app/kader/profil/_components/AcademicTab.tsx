"use client";

import React, { useRef } from "react";
import { Upload, Trash, FileText, ExternalLink } from "lucide-react";
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
  ktmFileUrl,
  onKtmUpload,
  onRemoveKtm
}: AcademicTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onKtmUpload(file);
    }
  };

  const isImage =
    ktmFileUrl?.startsWith("data:image/") ||
    Boolean(ktmName?.match(/\.(jpg|jpeg|png|webp)$/i)) ||
    Boolean(ktmFileUrl?.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i));

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

      {/* Lampiran KTM dengan Simpan Berkas Asli & Preview */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Unggah Kartu Tanda Mahasiswa (KTM Asli / Scan)
        </label>

        {ktmName || ktmFileUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {ktmFileUrl && isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ktmFileUrl}
                  alt="KTM Preview"
                  className="w-12 h-9 object-cover rounded-md border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-9 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="truncate block max-w-[200px] sm:max-w-[280px] text-zinc-800 dark:text-zinc-200 font-medium text-xs">
                  {ktmName || "Berkas-KTM"}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {ktmFileUrl ? "Tersimpan di sistem" : "Nama tercatat"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {ktmFileUrl && (
                <a
                  href={ktmFileUrl}
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
                  onClick={onRemoveKtm}
                  title="Hapus berkas KTM"
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
              <span className="text-xs font-medium">Unggah Berkas KTM (Gambar JPG/PNG/WebP atau PDF, maks. 5 MB)</span>
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
            Belum ada lampiran berkas KTM
          </div>
        )}
      </div>
    </div>
  );
}
