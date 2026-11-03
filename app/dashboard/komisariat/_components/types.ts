import { CommissariatList, KomisariatStructure, KomisariatGalleryItem } from "@/lib/services/types";
import { normalizeTenantName } from "@/lib/tenancy";

export type { CommissariatList, KomisariatStructure, KomisariatGalleryItem };

export interface KomisariatBphData {
  chairman: string;
  secretary: string;
  treasurer: string;
  period: string;
  isSynced?: boolean;
  hasData?: boolean;
  totalBoardCount?: number;
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
  const kName = komisariat.name || "";
  const kUniv = komisariat.university || komisariat.campusName || "";
  const kNameNorm = normalizeTenantName(kName);
  const kUnivNorm = normalizeTenantName(kUniv);

  // Cari semua pengurus yang terdaftar di komisariat ini
  const commBoards = (boardMembers || []).filter((b) => {
    if (!b) return false;
    // 1. Cek kecocokan ID komisariat / tenant
    if (kId && (b.komisariat_id === kId || b.tenant_id === kId)) {
      return true;
    }
    // 2. Cek kecocokan Nama Komisariat atau Kampus
    const bCommRaw = b.commissariat || b.komisariat || b.campus || "";
    if (bCommRaw) {
      const bCommNorm = normalizeTenantName(bCommRaw);
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

      const rawLower = bCommRaw.toLowerCase().trim();
      const kNameLower = kName.toLowerCase().trim();
      const kUnivLower = kUniv.toLowerCase().trim();
      if (
        (kNameLower && rawLower.includes(kNameLower)) ||
        (kNameLower && kNameLower.includes(rawLower)) ||
        (kUnivLower && rawLower.includes(kUnivLower)) ||
        (kUnivLower && kUnivLower.includes(rawLower))
      ) {
        return true;
      }
    }
    return false;
  });

  // Prioritaskan pengurus berstatus AKTIF
  const activePool = commBoards.filter((b) => b.status === "AKTIF");
  const candidatePool = activePool.length > 0 ? activePool : commBoards;

  // Helper normalisasi jabatan
  const matchPosition = (member: any, keywords: string[], excludeKeywords: string[] = ["wakil", "bidang", "rayon"]) => {
    const pos = (member.position || "").toLowerCase();
    const dept = (member.department || "").toUpperCase();
    const isExcluded = excludeKeywords.some((ex) => pos.includes(ex));
    if (isExcluded) return false;

    // Kecocokan nama jabatan
    const hasKeyword = keywords.some((kw) => pos.includes(kw));
    if (hasKeyword) return true;

    // Kecocokan di departemen BPH
    if (dept === "BPH" || dept === "PIMPINAN") {
      return keywords.some((kw) => pos.includes(kw));
    }
    return false;
  };

  // Pencarian Ketua (prioritas Ketua Komisariat / Ketua Umum)
  const chairmanMember =
    candidatePool.find((b) => matchPosition(b, ["ketua", "mandataris"])) ||
    commBoards.find((b) => matchPosition(b, ["ketua", "mandataris"]));

  // Pencarian Sekretaris
  const secretaryMember =
    candidatePool.find((b) => matchPosition(b, ["sekretaris"])) ||
    commBoards.find((b) => matchPosition(b, ["sekretaris"]));

  // Pencarian Bendahara
  const treasurerMember =
    candidatePool.find((b) => matchPosition(b, ["bendahara"])) ||
    commBoards.find((b) => matchPosition(b, ["bendahara"]));

  // Periode dari pengurus BPH atau struktur tersimpan
  const detectedPeriod =
    chairmanMember?.period ||
    secretaryMember?.period ||
    treasurerMember?.period ||
    candidatePool.find((b) => b.period)?.period ||
    komisariat.structure?.period ||
    "2026 - 2027";

  const chairmanName = chairmanMember?.name || komisariat.structure?.chairman || "-";
  const secretaryName = secretaryMember?.name || komisariat.structure?.secretary || "-";
  const treasurerName = treasurerMember?.name || komisariat.structure?.treasurer || "-";

  const isSynced = Boolean(chairmanMember || secretaryMember || treasurerMember);
  const hasData =
    (chairmanName !== "-" && chairmanName.trim() !== "") ||
    (secretaryName !== "-" && secretaryName.trim() !== "") ||
    (treasurerName !== "-" && treasurerName.trim() !== "");

  return {
    chairman: chairmanName,
    secretary: secretaryName,
    treasurer: treasurerName,
    period: detectedPeriod,
    isSynced,
    hasData,
    totalBoardCount: commBoards.length,
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
  gallery?: KomisariatGalleryItem[];
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
  gallery: [],
};

