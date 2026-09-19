"use client";

import React, { useState } from "react";
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  CreditCard,
  Download,
  MapPin,
  Heart,
  FileText,
  Mail,
  Phone,
  Building,
  Award,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Member } from "./types";

interface MemberDetailModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onDownloadKTA: (member: Member, theme: "gold" | "emerald" | "dark") => void;
}

export default function MemberDetailModal({
  isOpen,
  member,
  onClose,
  onDownloadKTA
}: MemberDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"diri" | "akademik" | "riwayat" | "kta">("diri");
  const [ktaTheme, setKtaTheme] = useState<"gold" | "emerald" | "dark">("gold");

  if (!isOpen || !member) return null;

  const initials = member.name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const photoSrc =
    member.avatar ||
    (member.pasFotoName &&
    (member.pasFotoName.startsWith("data:") ||
      member.pasFotoName.startsWith("http") ||
      member.pasFotoName.startsWith("/"))
      ? member.pasFotoName
      : "");

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "MAPABA":
        return (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            MAPABA
          </Badge>
        );
      case "PKD":
        return (
          <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKD
          </Badge>
        );
      case "PKL":
        return (
          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKL
          </Badge>
        );
      case "PKN":
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKN
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold rounded-md px-2 py-0.5">
            {level}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aktif":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            Aktif
          </Badge>
        );
      case "Alumni":
        return (
          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            Alumni
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold rounded-md px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden">
              {photoSrc && (
                <AvatarImage src={photoSrc} alt={member.name} className="object-cover w-full h-full" />
              )}
              <AvatarFallback className="bg-blue-600 text-white font-bold text-xs rounded-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {member.name}
                </h3>
                {getLevelBadge(member.level)}
                {getStatusBadge(member.status)}
              </div>
              <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                NIPA: {member.nipa || "-"} • {member.komisariat}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean Underline Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 gap-4 text-xs font-medium bg-white dark:bg-zinc-950 overflow-x-auto no-scrollbar">
          {[
            { id: "diri", label: "Profil Diri & Medis", icon: User },
            { id: "akademik", label: "Akademik & Kontak", icon: GraduationCap },
            { id: "riwayat", label: "Pendidikan & Organisasi", icon: Briefcase },
            { id: "kta", label: "KTA Digital", icon: CreditCard }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-left bg-zinc-50/50 dark:bg-zinc-950/40">
          {/* TAB 1: PROFIL DIRI & MEDIS */}
          {activeTab === "diri" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Identitas Utama
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Nama Lengkap</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Jenis Kelamin</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.gender}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">NIK</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{member.nik || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Tempat, Tanggal Lahir</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {member.tempatLahir || "-"}, {member.tanggalLahir || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Profil Medis & Berkas
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Golongan Darah</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        Golongan {member.golonganDarah || "O"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Riwayat Penyakit</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.riwayatPenyakit || "Tidak ada"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Berkas KTP</span>
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{member.ktpName || "Belum diunggah"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Pas Foto</span>
                      {photoSrc ? (
                        <div className="mt-1 flex items-center gap-2">
                          <img
                            src={photoSrc}
                            alt={member.name}
                            className="w-10 h-12 object-cover rounded border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                          <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                            {member.pasFotoName || "foto.jpg"}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                          {member.pasFotoName || "Belum diunggah"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Informasi Alamat
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Alamat Asal (Sesuai KTP)</span>
                    <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{member.alamatRumah || "-"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Alamat Domisili Mahasiswa</span>
                    <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{member.alamatDomisili || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AKADEMIK & KONTAK */}
          {activeTab === "akademik" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Informasi Akademik
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Perguruan Tinggi</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.perguruanTinggi || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Fakultas</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.fakultas || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Jurusan / Prodi</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{member.jurusan || "-"}</span>
                  </div>
                  <div className="sm:col-span-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 block text-[11px]">Lampiran KTM</span>
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{member.ktmName || "Belum diunggah"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Kontak & Media Sosial
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Email</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">No. WhatsApp / HP</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.phone || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Instagram</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.instagram || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">X (Twitter) / Facebook</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {member.twitter || "-"} {member.facebook ? `• ${member.facebook}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENDIDIKAN & ORGANISASI */}
          {activeTab === "riwayat" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Riwayat Pendidikan Formal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">SD / MI</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.pendidikanSD || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">SMP / MTs</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.pendidikanSMP || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">SMA / SMK / MA</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.pendidikanSMA || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Riwayat Organisasi
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Organisasi SMP</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.organisasiSMP || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Organisasi SMA</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.organisasiSMA || "-"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500 block text-[11px]">Organisasi Kampus / Lainnya</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.organisasiPT || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Motivasi & Orientasi
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Orientasi Profetik / Minat</span>
                    <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{member.orientasiProfetik || "-"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Motivasi Bergabung PMII</span>
                    <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{member.motivasiMapaba || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KTA DIGITAL */}
          {activeTab === "kta" && (
            <div className="space-y-4">
              {/* Theme selector */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pilih Tema Desain KTA:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "gold", label: "PMII Gold" },
                    { id: "emerald", label: "Emerald" },
                    { id: "dark", label: "Slate Dark" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setKtaTheme(t.id as any)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        ktaTheme === t.id
                          ? "bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 font-semibold"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Card Preview */}
              <div
                className={`p-5 rounded-lg border text-white relative overflow-hidden transition-all shadow-md ${
                  ktaTheme === "emerald"
                    ? "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 border-emerald-700/50"
                    : ktaTheme === "dark"
                    ? "bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-900 border-zinc-700/50"
                    : "bg-gradient-to-br from-[#061833] via-[#0b2447] to-[#1e3a8a] border-blue-800/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 font-black flex items-center justify-center text-sm">
                      P
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        KTA PMII DIGITAL
                      </h4>
                      <p className="text-[9px] text-white/70">
                        Pergerakan Mahasiswa Islam Indonesia
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-white/60 uppercase">
                    {member.komisariat}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white/10 ring-2 ring-amber-400/60 overflow-hidden flex items-center justify-center font-bold text-amber-300 text-lg shrink-0">
                    {photoSrc ? (
                      <img src={photoSrc} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <p className="text-[11px] font-mono text-amber-300/90 mt-0.5">
                      NIPA: {member.nipa || "-"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white">
                        {member.level}
                      </span>
                      <span className="text-[10px] text-white/60 font-mono">
                        Angkatan {member.angkatan}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] text-white/50">
                  <span>RESMI • PENGURUS CABANG PMII</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> TERVERIFIKASI
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => onDownloadKTA(member, ktaTheme)}
                  className="h-8.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 border-none cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh KTA Digital (PNG HD)</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </Card>
    </div>
  );
}
