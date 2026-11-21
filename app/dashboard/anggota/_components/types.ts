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
  tahunMasukSD?: string;
  tahunLulusSD?: string;
  pendidikanSMP?: string;
  tahunMasukSMP?: string;
  tahunLulusSMP?: string;
  pendidikanSMA?: string;
  tahunMasukSMA?: string;
  tahunLulusSMA?: string;
  perguruanTinggi?: string;
  tahunMasukPT?: string;
  tahunLulusPT?: string;
  fakultas?: string;
  jurusan?: string;
  ktmName?: string;
  ktmFileUrl?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  avatar?: string;
  pasFoto?: string;
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
    tahunMasukSD: c.tahunMasukSD || "",
    tahunLulusSD: c.tahunLulusSD || "",
    pendidikanSMP: c.pendidikanSMP || "",
    tahunMasukSMP: c.tahunMasukSMP || "",
    tahunLulusSMP: c.tahunLulusSMP || "",
    pendidikanSMA: c.pendidikanSMA || "",
    tahunMasukSMA: c.tahunMasukSMA || "",
    tahunLulusSMA: c.tahunLulusSMA || "",
    perguruanTinggi: c.perguruanTinggi || "",
    tahunMasukPT: c.tahunMasukPT || "",
    tahunLulusPT: c.tahunLulusPT || "",
    fakultas: c.fakultas || "",
    jurusan: c.jurusan || "",
    ktmName: c.ktmName || "",
    ktmFileUrl: c.ktmFileUrl || "",
    instagram: c.instagram || "",
    twitter: c.twitter || "",
    facebook: c.facebook || "",
    avatar: c.avatar || "",
    pasFoto: c.pasFoto || "",
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

export const mapAnggotaToMember = mapCadreToMember;
export const mapMemberToAnggota = mapMemberToCadre;

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
    tahunMasukSD: m.tahunMasukSD,
    tahunLulusSD: m.tahunLulusSD,
    pendidikanSMP: m.pendidikanSMP,
    tahunMasukSMP: m.tahunMasukSMP,
    tahunLulusSMP: m.tahunLulusSMP,
    pendidikanSMA: m.pendidikanSMA,
    tahunMasukSMA: m.tahunMasukSMA,
    tahunLulusSMA: m.tahunLulusSMA,
    perguruanTinggi: m.perguruanTinggi,
    tahunMasukPT: m.tahunMasukPT,
    tahunLulusPT: m.tahunLulusPT,
    fakultas: m.fakultas,
    jurusan: m.jurusan,
    ktmName: m.ktmName,
    ktmFileUrl: m.ktmFileUrl,
    twitter: m.twitter,
    facebook: m.facebook,
    avatar: m.avatar,
    pasFoto: m.pasFoto,
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

/**
 * Resolves the member's photo URL or data URI from any available field
 */
export function resolveMemberPhotoUrl(member?: Partial<Member> | null): string {
  if (!member) return "";
  // 1. Check official pasFoto (formal 3x4 photo) first
  if (member.pasFoto && typeof member.pasFoto === "string" && member.pasFoto.trim()) {
    const p = member.pasFoto.trim();
    if (p.startsWith("data:") || p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/")) {
      return p;
    }
    if (p.includes("/")) {
      return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/${p}`;
    }
    return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/avatars/${p}`;
  }

  // 2. Fallback to profile avatar
  if (member.avatar && typeof member.avatar === "string" && member.avatar.trim()) {
    const a = member.avatar.trim();
    if (a.startsWith("data:") || a.startsWith("http://") || a.startsWith("https://") || a.startsWith("/")) {
      return a;
    }
    if (a.includes("/")) {
      return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/${a}`;
    }
    return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/avatars/${a}`;
  }

  return "";
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === "" || dateStr === "-") return "-";

  const BULAN_INDO = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const trimmed = dateStr.trim();

  // Format YYYY-MM-DD atau YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split("T")[0].split(/[-/]/).map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (y && m && d && m >= 1 && m <= 12) {
      return `${d} ${BULAN_INDO[m - 1]} ${y}`;
    }
  }

  return trimmed;
}
