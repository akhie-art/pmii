"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNIVERSITY_NAMES,
  findUniversity,
  getFacultiesForUniversity,
  getMajorsForFaculty,
} from "@/lib/academic-data";
import { DocumentAttachment } from "@/components/ui/document-attachment";
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
  const matchedUniv = useMemo(() => findUniversity(perguruanTinggi), [perguruanTinggi]);
  const availableFaculties = useMemo(
    () => getFacultiesForUniversity(matchedUniv?.name || perguruanTinggi),
    [matchedUniv, perguruanTinggi]
  );
  const availableMajors = useMemo(
    () => getMajorsForFaculty(matchedUniv?.name || perguruanTinggi, fakultas),
    [matchedUniv, perguruanTinggi, fakultas]
  );

  const handleUniversityChange = (val: string | null) => {
    if (!val) return;
    setPerguruanTinggi(val);
    const u = findUniversity(val);
    if (u && u.faculties.length === 1 && u.faculties[0].name === "-") {
      setFakultas("-");
    } else {
      setFakultas("");
    }
    setJurusan("");
  };

  const handleFacultyChange = (val: string | null) => {
    if (!val) return;
    setFakultas(val);
    setJurusan("");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Perguruan Tinggi */}
        <div className="space-y-1 min-w-0 overflow-hidden">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Perguruan Tinggi
          </label>
          <Select
            disabled={!isEditing}
            value={matchedUniv?.name || perguruanTinggi || ""}
            onValueChange={handleUniversityChange}
          >
            <SelectTrigger
              title={matchedUniv?.name || perguruanTinggi || undefined}
              className="w-full min-w-0 max-w-full h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
            >
              <SelectValue placeholder="Pilih Perguruan Tinggi" className="truncate text-left" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              {UNIVERSITY_NAMES.map((u) => (
                <SelectItem key={u} value={u} className="text-xs">
                  {u}
                </SelectItem>
              ))}
              {perguruanTinggi &&
                !UNIVERSITY_NAMES.includes(perguruanTinggi) &&
                !matchedUniv && (
                  <SelectItem value={perguruanTinggi} className="text-xs">
                    {perguruanTinggi}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </div>

        {/* Fakultas */}
        <div className="space-y-1 min-w-0 overflow-hidden">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Fakultas
          </label>
          {availableFaculties.length > 0 ? (
            <Select
              disabled={!isEditing}
              value={fakultas || ""}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger
                title={fakultas || undefined}
                className="w-full min-w-0 max-w-full h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
              >
                <SelectValue placeholder="Pilih Fakultas" className="truncate text-left" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                {availableFaculties.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {f}
                  </SelectItem>
                ))}
                {fakultas && !availableFaculties.includes(fakultas) && fakultas !== "-" && (
                  <SelectItem value={fakultas} className="text-xs">
                    {fakultas}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              disabled
              value={
                matchedUniv?.name.includes("Sekolah Tinggi") || perguruanTinggi.toLowerCase().includes("stai")
                  ? "- (Tanpa Fakultas)"
                  : perguruanTinggi
                  ? "-"
                  : "Pilih Kampus terlebih dahulu"
              }
              title={
                matchedUniv?.name.includes("Sekolah Tinggi") || perguruanTinggi.toLowerCase().includes("stai")
                  ? "- (Tanpa Fakultas)"
                  : undefined
              }
              className="w-full min-w-0 max-w-full h-8.5 text-xs bg-zinc-50/70 dark:bg-zinc-950/70 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 rounded-lg cursor-not-allowed truncate"
            />
          )}
        </div>

        {/* Jurusan / Prodi */}
        <div className="space-y-1 min-w-0 overflow-hidden">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Jurusan / Prodi
          </label>
          {availableMajors.length > 0 ? (
            <Select
              disabled={!isEditing || (availableFaculties.length > 0 && !fakultas)}
              value={jurusan || ""}
              onValueChange={(val) => {
                if (val) setJurusan(val);
              }}
            >
              <SelectTrigger
                title={jurusan || undefined}
                className="w-full min-w-0 max-w-full h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
              >
                <SelectValue
                  placeholder={
                    availableFaculties.length > 0 && !fakultas
                      ? "Pilih Fakultas terlebih dahulu"
                      : "Pilih Jurusan / Prodi"
                  }
                  className="truncate text-left"
                />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                {availableMajors.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
                {jurusan && !availableMajors.includes(jurusan) && (
                  <SelectItem value={jurusan} className="text-xs">
                    {jurusan}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              disabled={!isEditing}
              placeholder={
                !perguruanTinggi
                  ? "Pilih Kampus terlebih dahulu"
                  : "Masukkan Jurusan / Prodi"
              }
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              className="w-full min-w-0 h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
            />
          )}
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
      <DocumentAttachment
        label="Unggah Kartu Tanda Mahasiswa (KTM Asli / Scan)"
        badgeLabel="Identitas Mahasiswa Aktif"
        fileName={ktmName}
        fileUrl={ktmFileUrl}
        isEditing={isEditing}
        onUpload={onKtmUpload}
        onRemove={onRemoveKtm}
        accentColor="amber"
      />
    </div>
  );
}
