import type { CadreFollowUp } from "@/lib/db";
import { getTenantIdByName, getTenantNameById } from "@/lib/tenancy";

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
  komisariat_id?: string | null;
  tenant_id?: string | null;
  angkatan: string;
  status: "Aktif" | "Alumni" | "Pasif";
  email: string;
  phone: string;
  jabatan: string;
  nipa: string;
  gender: "Laki-laki" | "Perempuan";
  history: CadreHistory[];
  
  // Extended fields
  nim?: string;
  nik?: string;
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
  ktmFileUrl?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  avatar?: string;
  riwayatPenyakit?: string;
  golonganDarah?: string;
  organisasiSMP?: string;
  organisasiSMA?: string;
  organisasiPT?: string;
  orientasiProfetik?: string;
  minatPassion?: string;
  motivasiMapaba?: string;
}

export function mapCadreToMember(c: CadreFollowUp): Member {
  const tid = c.tenant_id || c.komisariat_id || getTenantIdByName(c.commissariat);
  const komisariat =
    c.commissariat ||
    (tid ? getTenantNameById(tid) : null) ||
    "Pengurus Cabang PMII Grobogan";

  return {
    id: c.id,
    name: c.name,
    level: (c.level as any) || "MAPABA",
    komisariat,
    komisariat_id: tid,
    tenant_id: tid,
    angkatan: c.angkatan || "2024",
    status: (c.memberStatus as any) || (c.status === "SELESAI" ? "Alumni" : "Aktif"),
    email: c.email || "",
    phone: c.phone || "",
    jabatan: c.jabatan || "Anggota",
    nipa: c.nipa || c.nta || "",
    gender: (c.gender as any) || "Laki-laki",
    history: c.history || [
      { level: c.level, date: c.startDate || "", location: komisariat, status: "Selesai" }
    ],
    nim: c.nim || c.nik || "",
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
    ktmFileUrl: c.ktmFileUrl || "",
    instagram: c.instagram || "",
    twitter: c.twitter || "",
    facebook: c.facebook || "",
    avatar: c.avatar || "",
    riwayatPenyakit: c.riwayatPenyakit || "",
    golonganDarah: c.golonganDarah || "O",
    organisasiSMP: c.organisasiSMP || "",
    organisasiSMA: c.organisasiSMA || "",
    organisasiPT: c.organisasiPT || "",
    orientasiProfetik: c.orientasiProfetik || "",
    minatPassion: c.minatPassion || "",
    motivasiMapaba: c.motivasiMapaba || ""
  };
}

export function mapMemberToCadre(m: Member): CadreFollowUp {
  const tid = m.tenant_id || m.komisariat_id || getTenantIdByName(m.komisariat);
  const commissariat =
    m.komisariat ||
    (tid ? getTenantNameById(tid) : null) ||
    "Pengurus Cabang PMII Grobogan";

  return {
    id: m.id,
    name: m.name,
    level: m.level as any,
    commissariat,
    komisariat_id: tid,
    tenant_id: tid,
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
    nim: m.nim || m.nik,
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
    ktmFileUrl: m.ktmFileUrl,
    twitter: m.twitter,
    facebook: m.facebook,
    avatar: m.avatar,
    riwayatPenyakit: m.riwayatPenyakit,
    golonganDarah: m.golonganDarah,
    organisasiSMP: m.organisasiSMP,
    organisasiSMA: m.organisasiSMA,
    organisasiPT: m.organisasiPT,
    orientasiProfetik: m.orientasiProfetik,
    minatPassion: m.minatPassion,
    motivasiMapaba: m.motivasiMapaba
  };
}
