import type { CadreFollowUp } from "@/lib/db";

export interface CadreHistory {
  level: string;
  date: string;
  location: string;
  status: string;
}

export interface Member {
  id: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL" | "PKN";
  komisariat: string;
  rayon?: string;
  angkatan: string;
  status: "Aktif" | "Alumni" | "Pasif";
  email: string;
  phone: string;
  jabatan: string;
  nipa: string;
  gender: "Laki-laki" | "Perempuan";
  history: CadreHistory[];
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  
  // Extended fields
  nik?: string;
  ktpName?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamatRumah?: string;
  alamatDomisili?: string;
  pendidikanSD?: string;
  pendidikanSMP?: string;
  pendidikanSMA?: string;
  perguruanTinggi?: string;
  fakultas?: string;
  jurusan?: string;
  ktmName?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  pasFotoName?: string;
  avatar?: string;
  riwayatPenyakit?: string;
  golonganDarah?: string;
  organisasiSD?: string;
  organisasiSMP?: string;
  organisasiSMA?: string;
  organisasiPT?: string;
  orientasiProfetik?: string;
  minatPassion?: string;
  motivasiMapaba?: string;
}

export function mapCadreToMember(c: CadreFollowUp): Member {
  const komisariat = c.commissariat || "PK PMII Ki Ageng Getas Pendawa";

  return {
    id: c.id,
    name: c.name,
    level: (c.level as any) || "MAPABA",
    komisariat,
    rayon: c.rayon || "",
    angkatan: c.angkatan || "2024",
    status: (c.memberStatus as any) || (c.status === "SELESAI" ? "Alumni" : "Aktif"),
    email: c.email || "",
    phone: c.phone || "",
    jabatan: c.jabatan || "Anggota",
    nipa: c.nipa || c.nta || "",
    gender: (c.gender as any) || "Laki-laki",
    history: c.history || [
      { level: c.level, date: c.startDate || "", location: c.commissariat || "", status: "Selesai" }
    ],
    provinsi: c.provinsi || "",
    kabupaten: c.kabupaten || "",
    kecamatan: c.kecamatan || "",
    nik: c.nik || "",
    ktpName: c.ktpName || "",
    tempatLahir: c.tempatLahir || "",
    tanggalLahir: c.tanggalLahir || "",
    alamatRumah: c.alamatRumah || c.address || "",
    alamatDomisili: c.alamatDomisili || "",
    pendidikanSD: c.pendidikanSD || "",
    pendidikanSMP: c.pendidikanSMP || "",
    pendidikanSMA: c.pendidikanSMA || "",
    perguruanTinggi: c.perguruanTinggi || "",
    fakultas: c.fakultas || "",
    jurusan: c.jurusan || "",
    ktmName: c.ktmName || "",
    instagram: c.instagram || "",
    twitter: c.twitter || "",
    facebook: c.facebook || "",
    pasFotoName: c.pasFotoName || "",
    avatar: c.avatar || "",
    riwayatPenyakit: c.riwayatPenyakit || "",
    golonganDarah: c.golonganDarah || "O",
    organisasiSD: c.organisasiSD || "",
    organisasiSMP: c.organisasiSMP || "",
    organisasiSMA: c.organisasiSMA || "",
    organisasiPT: c.organisasiPT || "",
    orientasiProfetik: c.orientasiProfetik || "",
    minatPassion: c.minatPassion || "",
    motivasiMapaba: c.motivasiMapaba || ""
  };
}

export function mapMemberToCadre(m: Member): CadreFollowUp {
  const commissariat = m.komisariat || "PK PMII Ki Ageng Getas Pendawa";

  return {
    id: m.id,
    name: m.name,
    level: m.level as any,
    commissariat,
    rayon: m.rayon || "",
    startDate: m.history && m.history[0] ? m.history[0].date : "",
    status: m.status === "Alumni" ? "SELESAI" : "AKTIF",
    submissions: [],
    phone: m.phone,
    email: m.email,
    address: m.alamatRumah,
    instagram: m.instagram,
    isGraduated: m.status === "Alumni",
    nta: m.nipa,
    registrationNumber: m.nipa,
    angkatan: m.angkatan,
    memberStatus: m.status,
    jabatan: m.jabatan,
    nipa: m.nipa,
    gender: m.gender,
    history: m.history,
    provinsi: m.provinsi,
    kabupaten: m.kabupaten,
    kecamatan: m.kecamatan,
    nik: m.nik,
    ktpName: m.ktpName,
    tempatLahir: m.tempatLahir,
    tanggalLahir: m.tanggalLahir,
    alamatRumah: m.alamatRumah,
    alamatDomisili: m.alamatDomisili,
    pendidikanSD: m.pendidikanSD,
    pendidikanSMP: m.pendidikanSMP,
    pendidikanSMA: m.pendidikanSMA,
    perguruanTinggi: m.perguruanTinggi,
    fakultas: m.fakultas,
    jurusan: m.jurusan,
    ktmName: m.ktmName,
    twitter: m.twitter,
    facebook: m.facebook,
    pasFotoName: m.pasFotoName,
    avatar: m.avatar,
    riwayatPenyakit: m.riwayatPenyakit,
    golonganDarah: m.golonganDarah,
    organisasiSD: m.organisasiSD,
    organisasiSMP: m.organisasiSMP,
    organisasiSMA: m.organisasiSMA,
    organisasiPT: m.organisasiPT,
    orientasiProfetik: m.orientasiProfetik,
    minatPassion: m.minatPassion,
    motivasiMapaba: m.motivasiMapaba
  };
}
