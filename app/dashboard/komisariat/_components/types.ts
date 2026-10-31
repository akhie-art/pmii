import { CommissariatList, KomisariatStructure } from "@/lib/services/types";
import { normalizeTenantName } from "@/lib/tenancy";

export type { CommissariatList, KomisariatStructure };

export interface KomisariatBphData {
  chairman: string;
  secretary: string;
  treasurer: string;
  period: string;
}

/**
 * Mengambil susunan BPH (Ketua, Sekretaris, Bendahara, Periode) secara dinamis
 * dari data pengurus yang terdaftar di halaman pengurus/pengurus.
 */
export function getKomisariatBph(
  komisariat: { id?: string; name?: string; university?: string; campusName?: string; structure?: KomisariatStructure },
  boardMembers: any[] = []
): KomisariatBphData {
  const kId = komisariat.id;
  const kNameNorm = normalizeTenantName(komisariat.name || "");
  const kUnivNorm = normalizeTenantName(komisariat.university || komisariat.campusName || "");

  // Cari semua pengurus yang terdaftar di komisariat ini
  const commBoards = (boardMembers || []).filter((b) => {
    if (!b) return false;
    // 1. Cek kecocokan ID komisariat / tenant
    if (kId && (b.komisariat_id === kId || b.tenant_id === kId)) {
      return true;
    }
    // 2. Cek kecocokan Nama Komisariat
    if (b.commissariat) {
      const bCommNorm = normalizeTenantName(b.commissariat);
      if (
        (kNameNorm && bCommNorm === kNameNorm) ||
        (kNameNorm && bCommNorm.includes(kNameNorm)) ||
        (bCommNorm && kNameNorm.includes(bCommNorm))
      ) {
        return true;
      }
      if (kUnivNorm && (bCommNorm.includes(kUnivNorm) || kUnivNorm.includes(bCommNorm))) {
        return true;
      }
    }
    return false;
  });

  // Prioritaskan pengurus berstatus AKTIF
  const activePool = commBoards.filter((b) => b.status === "AKTIF");
  const candidatePool = activePool.length > 0 ? activePool : commBoards;

  // Pencarian Ketua (prioritas Ketua Komisariat / Ketua Umum)
  const chairmanMember =
    candidatePool.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return (
        pos.includes("ketua") &&
        !pos.includes("wakil") &&
        !pos.includes("bidang") &&
        !pos.includes("rayon")
      );
    }) ||
    commBoards.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return pos.includes("ketua") && !pos.includes("wakil");
    });

  // Pencarian Sekretaris
  const secretaryMember =
    candidatePool.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return (
        pos.includes("sekretaris") &&
        !pos.includes("wakil") &&
        !pos.includes("bidang")
      );
    }) ||
    commBoards.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return pos.includes("sekretaris") && !pos.includes("wakil");
    });

  // Pencarian Bendahara
  const treasurerMember =
    candidatePool.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return (
        pos.includes("bendahara") &&
        !pos.includes("wakil") &&
        !pos.includes("bidang")
      );
    }) ||
    commBoards.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return pos.includes("bendahara") && !pos.includes("wakil");
    });

  // Periode dari pengurus BPH atau struktur tersimpan
  const detectedPeriod =
    chairmanMember?.period ||
    secretaryMember?.period ||
    treasurerMember?.period ||
    candidatePool.find((b) => b.period)?.period ||
    komisariat.structure?.period ||
    "2026 - 2027";

  return {
    chairman: chairmanMember?.name || komisariat.structure?.chairman || "-",
    secretary: secretaryMember?.name || komisariat.structure?.secretary || "-",
    treasurer: treasurerMember?.name || komisariat.structure?.treasurer || "-",
    period: detectedPeriod
  };
}

export interface KomisariatFormData {
  id?: string;
  name: string;
  university: string;
  logo?: string;
  logoInitial?: string;
  establishedDate: string;
  establishedYear?: number;
  contactEmail: string;
  structure: {
    chairman: string;
    chairman_id?: string | null;
    secretary: string;
    secretary_id?: string | null;
    treasurer: string;
    treasurer_id?: string | null;
    period: string;
  };
}

export const DEFAULT_FORM_DATA: KomisariatFormData = {
  name: "",
  university: "",
  logo: "",
  logoInitial: "",
  establishedDate: "",
  contactEmail: "",
  structure: {
    chairman: "",
    chairman_id: null,
    secretary: "",
    secretary_id: null,
    treasurer: "",
    treasurer_id: null,
    period: "2026 - 2027",
  },
};

