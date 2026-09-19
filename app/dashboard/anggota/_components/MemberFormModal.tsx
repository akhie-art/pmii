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
  Heart
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
import NikInput from "./NikInput";
import type { Member, CadreHistory } from "./types";

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

  // Step 1: Data Diri
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = useState("");
  const [ktpName, setKtpName] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [alamatDomisili, setAlamatDomisili] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("O");
  const [pasFotoName, setPasFotoName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");

  // Step 2: Akademik & Kontak
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [ktmName, setKtmName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 3: Pendidikan & Organisasi
  const [pendidikanSD, setPendidikanSD] = useState("");
  const [pendidikanSMP, setPendidikanSMP] = useState("");
  const [pendidikanSMA, setPendidikanSMA] = useState("");
  const [organisasiSD, setOrganisasiSD] = useState("");
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

    if (member) {
      setName(member.name || "");
      setGender(member.gender || "Laki-laki");
      setNik(member.nik || "");
      setKtpName(member.ktpName || "");
      setTempatLahir(member.tempatLahir || "");
      setTanggalLahir(member.tanggalLahir || "");
      setAlamatRumah(member.alamatRumah || "");
      setAlamatDomisili(member.alamatDomisili || "");
      setGolonganDarah(member.golonganDarah || "O");
      setPasFotoName(member.pasFotoName || "");
      setAvatar(member.avatar || "");
      setRiwayatPenyakit(member.riwayatPenyakit || "");

      setPerguruanTinggi(member.perguruanTinggi || "");
      setFakultas(member.fakultas || "");
      setJurusan(member.jurusan || "");
      setKtmName(member.ktmName || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setInstagram(member.instagram || "");
      setTwitter(member.twitter || "");
      setFacebook(member.facebook || "");

      setPendidikanSD(member.pendidikanSD || "");
      setPendidikanSMP(member.pendidikanSMP || "");
      setPendidikanSMA(member.pendidikanSMA || "");
      setOrganisasiSD(member.organisasiSD || "");
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
      setNik("");
      setKtpName("");
      setTempatLahir("");
      setTanggalLahir("");
      setAlamatRumah("");
      setAlamatDomisili("");
      setGolonganDarah("O");
      setPasFotoName("");
      setAvatar("");
      setRiwayatPenyakit("");

      setPerguruanTinggi("");
      setFakultas("");
      setJurusan("");
      setKtmName("");
      setEmail("");
      setPhone("");
      setInstagram("");
      setTwitter("");
      setFacebook("");

      setPendidikanSD("");
      setPendidikanSMP("");
      setPendidikanSMA("");
      setOrganisasiSD("");
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setActiveTab("diri");
      return;
    }

    onSubmit({
      name: name.trim(),
      gender,
      nik: nik.trim(),
      ktpName,
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      alamatRumah: alamatRumah.trim(),
      alamatDomisili: alamatDomisili.trim(),
      golonganDarah,
      pasFotoName,
      avatar,
      riwayatPenyakit: riwayatPenyakit.trim(),
      perguruanTinggi: perguruanTinggi.trim(),
      fakultas: fakultas.trim(),
      jurusan: jurusan.trim(),
      ktmName,
      email: email.trim(),
      phone: phone.trim(),
      instagram: instagram.trim(),
      twitter: twitter.trim(),
      facebook: facebook.trim(),
      pendidikanSD: pendidikanSD.trim(),
      pendidikanSMP: pendidikanSMP.trim(),
      pendidikanSMA: pendidikanSMA.trim(),
      organisasiSD: organisasiSD.trim(),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {isEdit ? "Edit Profil Anggota" : "Registrasi Anggota Baru"}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Lengkapi identitas, riwayat kaderisasi, dan informasi keanggotaan
              </p>
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
              { id: "diri", label: "1. Data Diri", icon: User },
              { id: "akademik", label: "2. Akademik & Kontak", icon: GraduationCap },
              { id: "riwayat", label: "3. Riwayat Pendidikan", icon: Briefcase },
              { id: "kaderisasi", label: "4. Kaderisasi & Status", icon: Compass }
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

          {/* Form Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-left bg-zinc-50/50 dark:bg-zinc-950/40">
            {/* TAB 1: DATA DIRI */}
            {activeTab === "diri" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Nama Lengkap *
                    </label>
                    <Input
                      required
                      placeholder="Misal: Sahabat M. Zulkifli"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
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

                {/* NIK Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Nomor Induk Kependudukan (NIK 16 Digit)
                  </label>
                  <NikInput value={nik} onChange={setNik} />
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

                {/* Upload KTP & Foto Minimal Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Berkas KTP
                    </label>
                    {ktpName ? (
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                        <span className="truncate max-w-[180px] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{ktpName}</span>
                        <button
                          type="button"
                          onClick={() => setKtpName("")}
                          className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 text-xs text-zinc-500">
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[11px]">Pilih File KTP</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setKtpName(e.target.files[0].name);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Pas Foto Resmi 3x4
                    </label>
                    {avatar || pasFotoName ? (
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {avatar && (
                            <img
                              src={avatar}
                              alt="Pas Foto"
                              className="w-7 h-7 rounded object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[150px] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                            {pasFotoName || "foto_terpilih.jpg"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPasFotoName("");
                            setAvatar("");
                          }}
                          className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 text-xs text-zinc-500">
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[11px]">Pilih Pas Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPasFotoName(file.name);
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setAvatar(ev.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AKADEMIK & KONTAK */}
            {activeTab === "akademik" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Perguruan Tinggi
                    </label>
                    <Input
                      placeholder="Misal: UIN Walisongo"
                      value={perguruanTinggi}
                      onChange={(e) => setPerguruanTinggi(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Fakultas
                    </label>
                    <Input
                      placeholder="Misal: FST"
                      value={fakultas}
                      onChange={(e) => setFakultas(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Jurusan
                    </label>
                    <Input
                      placeholder="Misal: Teknologi Informasi"
                      value={jurusan}
                      onChange={(e) => setJurusan(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="kader@pmii.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
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

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Unggah Kartu Tanda Mahasiswa (KTM)
                  </label>
                  {ktmName ? (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                      <span className="truncate text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{ktmName}</span>
                      <button
                        type="button"
                        onClick={() => setKtmName("")}
                        className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 text-xs text-zinc-500">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[11px]">Pilih File KTM</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setKtmName(e.target.files[0].name);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

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
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex gap-2">
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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Batal
              </Button>

              {activeTab !== "kaderisasi" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (activeTab === "diri") setActiveTab("akademik");
                    if (activeTab === "akademik") setActiveTab("riwayat");
                    if (activeTab === "riwayat") setActiveTab("kaderisasi");
                  }}
                  className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer"
                >
                  Selanjutnya
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer"
                >
                  {isEdit ? "Simpan Perubahan" : "Daftarkan Anggota"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
