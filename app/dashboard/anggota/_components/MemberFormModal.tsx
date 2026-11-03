"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  Compass,
  Upload,
  Trash,
  Check,
  Building,
  Heart,
  AlertCircle,
  UserPlus,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import type { Member, CadreHistory } from "./types";
import { DocumentAttachment } from "@/components/ui/document-attachment";
import {
  UNIVERSITY_NAMES,
  findUniversity,
  getFacultiesForUniversity,
  getMajorsForFaculty,
} from "@/lib/academic-data";

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  onSubmit: (data: Partial<Member>) => void;
  defaultKomisariat?: string;
  isAdmin?: boolean;
}

export default function MemberFormModal({
  isOpen,
  onClose,
  member,
  onSubmit,
  defaultKomisariat = "PK PMII Ki Ageng Getas Pendawa",
  isAdmin = false
}: MemberFormModalProps) {
  const isEdit = Boolean(member);
  const [activeTab, setActiveTab] = useState<"diri" | "akademik" | "riwayat" | "kaderisasi">("diri");
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Step 1: Data Diri
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nim, setNim] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [alamatDomisili, setAlamatDomisili] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("O");
  const [avatar, setAvatar] = useState("");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");

  // Step 2: Akademik & Kontak
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [ktmName, setKtmName] = useState("");
  const [ktmFileUrl, setKtmFileUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 3: Pendidikan & Organisasi
  const [pendidikanSD, setPendidikanSD] = useState("");
  const [pendidikanSMP, setPendidikanSMP] = useState("");
  const [pendidikanSMA, setPendidikanSMA] = useState("");
  const [organisasiSMP, setOrganisasiSMP] = useState("");
  const [organisasiSMA, setOrganisasiSMA] = useState("");
  const [organisasiPT, setOrganisasiPT] = useState("");

  // Step 4: Karakter & Kaderisasi
  const [orientasiProfetik, setOrientasiProfetik] = useState("");
  const [minatPassion, setMinatPassion] = useState("");
  const [motivasiMapaba, setMotivasiMapaba] = useState("");
  const [level, setLevel] = useState<"MAPABA" | "PKD" | "PKL" | "PKN">("MAPABA");
  const [angkatan, setAngkatan] = useState("2026");
  const [jabatan, setJabatan] = useState("Anggota");
  const [komisariat, setKomisariat] = useState(defaultKomisariat);
  const [status, setStatus] = useState<"Aktif" | "Alumni" | "Pasif">("Aktif");

  useEffect(() => {
    if (!isOpen) return;
    setFormErrors({});
    setValidationAlert(null);

    if (member) {
      setName(member.name || "");
      setGender(member.gender || "Laki-laki");
      setNim(member.nim || member.nik || "");
      setTempatLahir(member.tempatLahir || "");
      setTanggalLahir(member.tanggalLahir || "");
      setAlamatRumah(member.alamatRumah || "");
      setAlamatDomisili(member.alamatDomisili || "");
      setGolonganDarah(member.golonganDarah || "O");
      setAvatar(member.avatar || "");
      setRiwayatPenyakit(member.riwayatPenyakit || "");

      setPerguruanTinggi(member.perguruanTinggi || "");
      setFakultas(member.fakultas || "");
      setJurusan(member.jurusan || "");
      setKtmName(member.ktmName || "");
      setKtmFileUrl(member.ktmFileUrl || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setInstagram(member.instagram || "");
      setTwitter(member.twitter || "");
      setFacebook(member.facebook || "");

      setPendidikanSD(member.pendidikanSD || "");
      setPendidikanSMP(member.pendidikanSMP || "");
      setPendidikanSMA(member.pendidikanSMA || "");
      setOrganisasiSMP(member.organisasiSMP || "");
      setOrganisasiSMA(member.organisasiSMA || "");
      setOrganisasiPT(member.organisasiPT || "");

      setOrientasiProfetik(member.orientasiProfetik || "");
      setMinatPassion(member.minatPassion || "");
      setMotivasiMapaba(member.motivasiMapaba || "");
      setLevel(member.level || "MAPABA");
      setAngkatan(member.angkatan || "2026");
      setJabatan(member.jabatan || "Anggota");
      setKomisariat(member.komisariat || defaultKomisariat);
      setStatus(member.status || "Aktif");
    } else {
      // Reset form
      setName("");
      setGender("Laki-laki");
      setNim("");
      setTempatLahir("");
      setTanggalLahir("");
      setAlamatRumah("");
      setAlamatDomisili("");
      setGolonganDarah("O");
      setAvatar("");
      setRiwayatPenyakit("");

      setPerguruanTinggi("");
      setFakultas("");
      setJurusan("");
      setKtmName("");
      setKtmFileUrl("");
      setEmail("");
      setPhone("");
      setInstagram("");
      setTwitter("");
      setFacebook("");

      setPendidikanSD("");
      setPendidikanSMP("");
      setPendidikanSMA("");
      setOrganisasiSMP("");
      setOrganisasiSMA("");
      setOrganisasiPT("");

      setOrientasiProfetik("");
      setMinatPassion("");
      setMotivasiMapaba("");
      setLevel("MAPABA");
      setAngkatan("2026");
      setJabatan("Anggota");
      setKomisariat(defaultKomisariat);
      setStatus("Aktif");
    }
    setActiveTab("diri");
  }, [isOpen, member, defaultKomisariat]);

  const handlePasFotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePasFoto = () => {
    setAvatar("");
  };

  const handleKtmUpload = (file: File) => {
    setKtmName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setKtmFileUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKtm = () => {
    setKtmName("");
    setKtmFileUrl("");
  };

  if (!isOpen) return null;

  const resolvedPhotoUrl = avatar;

  const resolvedKtmUrl =
    ktmFileUrl ||
    (ktmName &&
    (ktmName.startsWith("data:") ||
      ktmName.startsWith("http") ||
      ktmName.startsWith("/"))
      ? ktmName
      : "");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: { name?: string; email?: string } = {};
    if (!name.trim()) {
      errors.name = "Nama lengkap wajib diisi.";
    }
    if (!email.trim()) {
      errors.email = "Alamat email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format alamat email tidak valid.";
    }

    setFormErrors(errors);

    if (errors.name) {
      setActiveTab("diri");
      setValidationAlert("Mohon lengkapi Nama Lengkap pada Data Diri.");
      return;
    }

    if (errors.email) {
      setActiveTab("akademik");
      setValidationAlert("Mohon isi Email valid pada informasi Akademik & Kontak.");
      return;
    }

    setValidationAlert(null);
    onSubmit({
      name: name.trim(),
      gender,
      nim: nim.trim(),
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      alamatRumah: alamatRumah.trim(),
      alamatDomisili: alamatDomisili.trim(),
      golonganDarah,
      avatar: resolvedPhotoUrl,
      riwayatPenyakit: riwayatPenyakit.trim(),
      perguruanTinggi: perguruanTinggi.trim(),
      fakultas: fakultas.trim(),
      jurusan: jurusan.trim(),
      ktmName,
      ktmFileUrl: resolvedKtmUrl,
      email: email.trim(),
      phone: phone.trim(),
      instagram: instagram.trim(),
      twitter: twitter.trim(),
      facebook: facebook.trim(),
      pendidikanSD: pendidikanSD.trim(),
      pendidikanSMP: pendidikanSMP.trim(),
      pendidikanSMA: pendidikanSMA.trim(),
      organisasiSMP: organisasiSMP.trim(),
      organisasiSMA: organisasiSMA.trim(),
      organisasiPT: organisasiPT.trim(),
      orientasiProfetik: orientasiProfetik.trim(),
      minatPassion: minatPassion.trim(),
      motivasiMapaba: motivasiMapaba.trim(),
      level,
      angkatan,
      jabatan: jabatan.trim(),
      komisariat,
      status
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isEdit 
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60" 
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60"
              }`}>
                {isEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {isEdit ? "Edit Profil Anggota" : "Registrasi Anggota Baru"}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isEdit
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
                  }`}>
                    {isEdit ? (member?.name ? member.name.slice(0, 22) : "Mode Edit") : "Kader Baru"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Lengkapi identitas, riwayat kaderisasi, dan dokumen resmi keanggotaan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Underline Tabs with Step Numbers & Error Indicators */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 gap-2 text-xs font-medium bg-white dark:bg-zinc-950 overflow-x-auto no-scrollbar">
            {[
              { id: "diri", label: "1. Data Diri", icon: User, hasError: Boolean(formErrors.name) },
              { id: "akademik", label: "2. Akademik & Kontak", icon: GraduationCap, hasError: Boolean(formErrors.email) },
              { id: "riwayat", label: "3. Riwayat Pendidikan", icon: Briefcase, hasError: false },
              { id: "kaderisasi", label: "4. Kaderisasi & Status", icon: Compass, hasError: false }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2.5 px-2 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.hasError && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Validation Alert Banner */}
          {validationAlert && (
            <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{validationAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationAlert(null)}
                className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Form Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-left bg-zinc-50/50 dark:bg-zinc-950/40">
            {/* TAB 1: DATA DIRI */}
            {activeTab === "diri" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>Nama Lengkap *</span>
                      {formErrors.name && (
                        <span className="text-[10px] text-rose-500 font-normal">{formErrors.name}</span>
                      )}
                    </label>
                    <Input
                      required
                      placeholder="Misal: Sahabat M. Zulkifli"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`h-8.5 text-xs bg-white dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 ${
                        formErrors.name ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Jenis Kelamin
                    </label>
                    <Select value={gender} onValueChange={(val) => { if (val) setGender(val as any); }}>
                      <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
                        <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NIM Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Nomor Induk Mahasiswa (NIM)
                  </label>
                  <Input
                    placeholder="Masukkan NIM (contoh: 21010123)"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Tempat Lahir
                    </label>
                    <Input
                      placeholder="Misal: Semarang"
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Tanggal Lahir
                    </label>
                    <Input
                      type="date"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Alamat Rumah (KTP)
                    </label>
                    <Input
                      placeholder="Alamat asal sesuai KTP"
                      value={alamatRumah}
                      onChange={(e) => setAlamatRumah(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Alamat Domisili / Kos
                    </label>
                    <Input
                      placeholder="Alamat domisili saat ini"
                      value={alamatDomisili}
                      onChange={(e) => setAlamatDomisili(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Golongan Darah
                    </label>
                    <Select value={golonganDarah} onValueChange={(val) => { if (val) setGolonganDarah(val); }}>
                      <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
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
                      placeholder="Misal: Asma, Alergi (jika ada)"
                      value={riwayatPenyakit}
                      onChange={(e) => setRiwayatPenyakit(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* Upload Dokumen Resmi: Pas Foto 3x4 & KTP (Full Width, Consistent, No Cramping) */}
                <div className="space-y-3 pt-2">
                  <DocumentAttachment
                    label="Pas Foto Resmi 3x4"
                    description="Format: JPG, PNG, atau WebP (Rasio 3:4 dengan pakaian rapi/jas PMII & background resmi)"
                    fileName={resolvedPhotoUrl ? "pas_foto_resmi.jpg" : ""}
                    fileUrl={resolvedPhotoUrl}
                    onUpload={handlePasFotoUpload}
                    onRemove={handleRemovePasFoto}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    accentColor="blue"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: AKADEMIK & KONTAK */}
            {activeTab === "akademik" && (() => {
              const matchedUniv = findUniversity(perguruanTinggi);
              const availableFaculties = getFacultiesForUniversity(matchedUniv?.name || perguruanTinggi);
              const availableMajors = getMajorsForFaculty(matchedUniv?.name || perguruanTinggi, fakultas);

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
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Perguruan Tinggi */}
                  <div className="space-y-1 min-w-0 overflow-hidden">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Perguruan Tinggi
                    </label>
                    <Select
                      value={matchedUniv?.name || perguruanTinggi || ""}
                      onValueChange={handleUniversityChange}
                    >
                      <SelectTrigger
                        title={matchedUniv?.name || perguruanTinggi || undefined}
                        className="w-full min-w-0 max-w-full h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
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
                        value={fakultas || ""}
                        onValueChange={handleFacultyChange}
                      >
                        <SelectTrigger
                          title={fakultas || undefined}
                          className="w-full min-w-0 max-w-full h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
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
                            : "Pilih Kampus dahulu"
                        }
                        title={
                          matchedUniv?.name.includes("Sekolah Tinggi") || perguruanTinggi.toLowerCase().includes("stai")
                            ? "- (Tanpa Fakultas)"
                            : undefined
                        }
                        className="w-full min-w-0 max-w-full h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed truncate"
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
                        disabled={availableFaculties.length > 0 && !fakultas}
                        value={jurusan || ""}
                        onValueChange={(val) => {
                          if (val) setJurusan(val);
                        }}
                      >
                        <SelectTrigger
                          title={jurusan || undefined}
                          className="w-full min-w-0 max-w-full h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        >
                          <SelectValue
                            placeholder={
                              availableFaculties.length > 0 && !fakultas
                                ? "Pilih Fakultas dahulu"
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
                        placeholder={
                          !perguruanTinggi
                            ? "Pilih Kampus dahulu"
                            : "Masukkan Jurusan / Prodi"
                        }
                        value={jurusan}
                        onChange={(e) => setJurusan(e.target.value)}
                        className="w-full min-w-0 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>Email *</span>
                      {formErrors.email && (
                        <span className="text-[10px] text-rose-500 font-normal">{formErrors.email}</span>
                      )}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="kader@pmii.org"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`h-8.5 text-xs bg-white dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 ${
                        formErrors.email ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      No. WhatsApp / HP
                    </label>
                    <Input
                      placeholder="0812-xxxx-xxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Instagram
                    </label>
                    <Input
                      placeholder="@username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      X (Twitter)
                    </label>
                    <Input
                      placeholder="@username"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Facebook
                    </label>
                    <Input
                      placeholder="Nama Akun"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <DocumentAttachment
                    label="Unggah Kartu Tanda Mahasiswa (KTM Asli / Scan)"
                    description="Format: JPG, PNG, WebP, atau PDF (Maksimal 5 MB)"
                    fileName={ktmName}
                    fileUrl={resolvedKtmUrl}
                    onUpload={handleKtmUpload}
                    onRemove={handleRemoveKtm}
                    accept="image/png,image/jpeg,image/jpg,image/webp,.pdf"
                    accentColor="blue"
                  />
                </div>
              </div>
            ); })()}

            {/* TAB 3: RIWAYAT PENDIDIKAN & ORGANISASI */}
            {activeTab === "riwayat" && (
              <div className="space-y-3.5">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Riwayat Pendidikan Formal
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Sekolah Dasar (SD/MI)
                      </label>
                      <Input
                        placeholder="Nama SD/MI"
                        value={pendidikanSD}
                        onChange={(e) => setPendidikanSD(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        SMP / MTs
                      </label>
                      <Input
                        placeholder="Nama SMP/MTs"
                        value={pendidikanSMP}
                        onChange={(e) => setPendidikanSMP(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        SMA / SMK / MA
                      </label>
                      <Input
                        placeholder="Nama SMA/SMK/MA"
                        value={pendidikanSMA}
                        onChange={(e) => setPendidikanSMA(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Riwayat Organisasi
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Organisasi Tingkat SMP / MTs
                      </label>
                      <Input
                        placeholder="Misal: OSIS, Pramuka"
                        value={organisasiSMP}
                        onChange={(e) => setOrganisasiSMP(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Organisasi Tingkat SMA / SMK / MA
                      </label>
                      <Input
                        placeholder="Misal: IPNU/IPPNU, OSIS"
                        value={organisasiSMA}
                        onChange={(e) => setOrganisasiSMA(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Organisasi di Perguruan Tinggi (Lainnya)
                      </label>
                      <Input
                        placeholder="Misal: BEM, Himpunan Mahasiswa Jurusan"
                        value={organisasiPT}
                        onChange={(e) => setOrganisasiPT(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KARAKTER & KADERISASI */}
            {activeTab === "kaderisasi" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Tingkat Kaderisasi
                    </label>
                    <Select value={level} onValueChange={(val) => { if (val) setLevel(val as any); }}>
                      <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Tingkat" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <SelectItem value="MAPABA">MAPABA (Mu'taqid)</SelectItem>
                        <SelectItem value="PKD">PKD (Mujahid)</SelectItem>
                        <SelectItem value="PKL">PKL (Mujtahid)</SelectItem>
                        <SelectItem value="PKN">PKN (Mustahiq)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Angkatan (Tahun)
                    </label>
                    <Input
                      placeholder="2026"
                      value={angkatan}
                      onChange={(e) => setAngkatan(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Jabatan
                    </label>
                    <Input
                      placeholder="Misal: Anggota, Pengurus"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Komisariat
                    </label>
                    <Input
                      value={komisariat}
                      onChange={(e) => setKomisariat(e.target.value)}
                      disabled={!isAdmin}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-70"
                    />
                  </div>

                  {isEdit && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Status Anggota
                      </label>
                      <Select value={status} onValueChange={(val) => { if (val) setStatus(val as any); }}>
                        <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                          <SelectItem value="Pasif">Pasif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Orientasi Profetik / Minat Pengembangan Diri
                    </label>
                    <Input
                      placeholder="Misal: Intelektual, Akademik, Advokasi, Keagamaan"
                      value={orientasiProfetik}
                      onChange={(e) => setOrientasiProfetik(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Motivasi Bergabung PMII
                    </label>
                    <Input
                      placeholder="Alasan & motivasi mengikuti kaderisasi PMII"
                      value={motivasiMapaba}
                      onChange={(e) => setMotivasiMapaba(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab !== "diri" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === "akademik") setActiveTab("diri");
                    if (activeTab === "riwayat") setActiveTab("akademik");
                    if (activeTab === "kaderisasi") setActiveTab("riwayat");
                  }}
                  className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  Sebelumnya
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Batal
              </Button>

              {/* In Edit mode, show "Simpan Perubahan" on EVERY tab! */}
              {isEdit && (
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </Button>
              )}

              {/* In Add mode, show "Selanjutnya" until Tab 4, then "Daftarkan Anggota" */}
              {!isEdit && activeTab !== "kaderisasi" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (activeTab === "diri") {
                      if (!name.trim()) {
                        setFormErrors((prev) => ({ ...prev, name: "Nama lengkap wajib diisi." }));
                        setValidationAlert("Mohon isi Nama Lengkap terlebih dahulu.");
                        return;
                      }
                      setValidationAlert(null);
                      setActiveTab("akademik");
                    } else if (activeTab === "akademik") {
                      if (!email.trim()) {
                        setFormErrors((prev) => ({ ...prev, email: "Alamat email wajib diisi." }));
                        setValidationAlert("Mohon isi Email terlebih dahulu.");
                        return;
                      }
                      setValidationAlert(null);
                      setActiveTab("riwayat");
                    } else if (activeTab === "riwayat") {
                      setActiveTab("kaderisasi");
                    }
                  }}
                  className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-xs"
                >
                  Selanjutnya
                </Button>
              )}

              {!isEdit && activeTab === "kaderisasi" && (
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-xs"
                >
                  Daftarkan Anggota
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
